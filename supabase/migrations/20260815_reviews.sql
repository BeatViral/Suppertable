-- Reviews are earned: one customer review per genuinely completed order.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  kitchen_id uuid not null references public.kitchens(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(trim(body)) between 3 and 1000),
  moderation_status text not null default 'published' check (moderation_status in ('published', 'hidden')),
  moderated_by uuid references public.profiles(id),
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);
create index reviews_kitchen_published_idx on public.reviews(kitchen_id, created_at desc) where moderation_status = 'published';
alter table public.reviews enable row level security;
create policy "published reviews are public to signed in users" on public.reviews for select to authenticated using (moderation_status = 'published' or customer_id = auth.uid() or public.is_admin());

create function public.submit_order_review(p_order_id uuid, p_rating smallint, p_body text)
returns public.reviews language plpgsql security definer set search_path = public as $$
declare v_order public.orders; v_review public.reviews;
begin
  if auth.uid() is null then raise exception 'You must be signed in to leave a review.'; end if;
  select * into v_order from public.orders where id = p_order_id and customer_id = auth.uid();
  if v_order.id is null then raise exception 'This order does not belong to your account.'; end if;
  if v_order.status <> 'completed' then raise exception 'Reviews are available after an order is completed.'; end if;
  insert into public.reviews(order_id, kitchen_id, customer_id, rating, body)
  values(p_order_id, v_order.kitchen_id, auth.uid(), p_rating, trim(p_body)) returning * into v_review;
  return v_review;
end;
$$;
create function public.moderate_review(p_review_id uuid, p_status text)
returns public.reviews language plpgsql security definer set search_path = public as $$
declare v_review public.reviews;
begin
  if not public.is_admin() then raise exception 'Only administrators can moderate reviews.'; end if;
  if p_status not in ('published', 'hidden') then raise exception 'Invalid moderation status.'; end if;
  update public.reviews set moderation_status = p_status, moderated_by = auth.uid(), moderated_at = now() where id = p_review_id returning * into v_review;
  if v_review.id is null then raise exception 'Review not found.'; end if;
  return v_review;
end;
$$;
grant select on public.reviews to authenticated;
grant execute on function public.submit_order_review(uuid,smallint,text) to authenticated;
grant execute on function public.moderate_review(uuid,text) to authenticated;
