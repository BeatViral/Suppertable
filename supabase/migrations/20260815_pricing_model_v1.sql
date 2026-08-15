-- SSU Australia commercial model V1. All money is stored in AUD cents.
create table public.platform_settings (
  id boolean primary key default true check (id),
  signature_meal_price_cents integer not null default 1700 check (signature_meal_price_cents >= 0),
  platform_fee_bps integer not null default 1200 check (platform_fee_bps between 0 and 10000),
  pickup_fee_cents integer not null default 0 check (pickup_fee_cents >= 0),
  free_delivery_enabled boolean not null default true,
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  payment_fee_borne_by text not null default 'kitchen' check (payment_fee_borne_by in ('kitchen', 'platform')),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (id) values (true);
create trigger platform_settings_updated before update on public.platform_settings for each row execute function public.set_updated_at();

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  postcode text,
  suburb text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.kitchens (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null unique references public.profiles(id),
  application_id uuid unique references public.kitchen_applications(id),
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'live', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger kitchens_updated before update on public.kitchens for each row execute function public.set_updated_at();
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references public.kitchens(id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  is_signature_meal boolean not null default false,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index one_signature_meal_per_kitchen on public.menu_items(kitchen_id) where is_signature_meal;
create trigger menu_items_updated before update on public.menu_items for each row execute function public.set_updated_at();

create function public.enforce_signature_meal_price() returns trigger language plpgsql security definer set search_path = public as $$
declare v_price integer;
begin
  if new.is_signature_meal then
    select signature_meal_price_cents into v_price from public.platform_settings where id = true;
    new.price_cents := v_price;
  end if;
  return new;
end;
$$;
create trigger signature_meal_global_price before insert or update on public.menu_items for each row execute function public.enforce_signature_meal_price();

-- Financial snapshots are immutable accounting inputs captured at order creation/payment time.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references public.kitchens(id),
  customer_id uuid not null references public.profiles(id),
  fulfilment_type text not null check (fulfilment_type in ('pickup', 'delivery')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled', 'refunded')),
  created_at timestamptz not null default now()
);
create table public.order_financials (
  order_id uuid primary key references public.orders(id) on delete cascade,
  food_subtotal_cents integer not null check (food_subtotal_cents >= 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  payment_processing_fee_cents integer not null default 0 check (payment_processing_fee_cents >= 0),
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  refund_cents integer not null default 0 check (refund_cents >= 0),
  kitchen_proceeds_cents integer not null check (kitchen_proceeds_cents >= 0),
  final_settlement_cents integer not null check (final_settlement_cents >= 0),
  created_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.kitchens enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_financials enable row level security;
create policy "authenticated users can read settings" on public.platform_settings for select to authenticated using (true);
create policy "authenticated users can read zones" on public.delivery_zones for select to authenticated using (true);
create policy "read live kitchens or own kitchen" on public.kitchens for select to authenticated using (status = 'live' or founder_id = auth.uid() or public.is_admin());
create policy "read live kitchen menus or own" on public.menu_items for select to authenticated using (exists(select 1 from public.kitchens k where k.id = kitchen_id and (k.status = 'live' or k.founder_id = auth.uid() or public.is_admin())));
create policy "read own orders" on public.orders for select to authenticated using (customer_id = auth.uid() or public.is_admin() or exists(select 1 from public.kitchens k where k.id = kitchen_id and k.founder_id = auth.uid()));
create policy "read own order financials" on public.order_financials for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin() or exists(select 1 from public.kitchens k where k.id = o.kitchen_id and k.founder_id = auth.uid()))));

create function public.update_platform_settings(p_signature_meal_price_cents integer, p_platform_fee_bps integer, p_pickup_fee_cents integer, p_free_delivery_enabled boolean, p_delivery_fee_cents integer)
returns public.platform_settings language plpgsql security definer set search_path = public as $$
declare v_settings public.platform_settings;
begin
  if not public.is_admin() then raise exception 'Only administrators can change platform settings.'; end if;
  update public.platform_settings set signature_meal_price_cents = p_signature_meal_price_cents, platform_fee_bps = p_platform_fee_bps, pickup_fee_cents = p_pickup_fee_cents, free_delivery_enabled = p_free_delivery_enabled, delivery_fee_cents = p_delivery_fee_cents, updated_by = auth.uid() where id = true returning * into v_settings;
  return v_settings;
end;
$$;
grant select on public.platform_settings, public.delivery_zones, public.kitchens, public.menu_items, public.orders, public.order_financials to authenticated;
grant execute on function public.update_platform_settings(integer,integer,integer,boolean,integer) to authenticated;
