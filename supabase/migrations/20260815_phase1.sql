-- SSU Australia Phase 1: accounts, roles and Founding Kitchen applications.
create type public.app_role as enum ('customer', 'kitchen_founder', 'admin', 'driver');
create type public.application_status as enum ('submitted', 'under_review', 'more_information_required', 'approved', 'declined');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.kitchen_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text not null,
  email text not null,
  mobile text not null,
  suburb text not null,
  food text not null,
  signature_dishes text not null,
  cooking_from text not null,
  proposed_name text,
  previously_sold_food boolean not null,
  why_launch text not null,
  status public.application_status not null default 'submitted',
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.application_status_history (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.kitchen_applications(id) on delete cascade,
  status public.application_status not null,
  note text,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger applications_updated before update on public.kitchen_applications for each row execute function public.set_updated_at();

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, nullif(trim(new.raw_user_meta_data->>'full_name'), ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.kitchen_applications enable row level security;
alter table public.application_status_history enable row level security;
create policy "read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "update own name" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "read own application" on public.kitchen_applications for select using (applicant_id = auth.uid() or public.is_admin());
create policy "read own application history" on public.application_status_history for select using (
  public.is_admin() or exists(select 1 from public.kitchen_applications a where a.id = application_id and a.applicant_id = auth.uid())
);

create function public.submit_kitchen_application(
  p_full_name text, p_mobile text, p_suburb text, p_food text, p_signature_dishes text,
  p_cooking_from text, p_previously_sold_food boolean, p_why_launch text, p_proposed_name text default null
) returns public.kitchen_applications language plpgsql security definer set search_path = public as $$
declare v_application public.kitchen_applications; v_email text;
begin
  if auth.uid() is null then raise exception 'You must be signed in to apply.'; end if;
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then raise exception 'Your account does not have an email address.'; end if;
  if exists(select 1 from public.kitchen_applications where applicant_id = auth.uid()) then raise exception 'You have already submitted an application.'; end if;
  if length(trim(p_full_name)) < 2 or length(trim(p_mobile)) < 8 or length(trim(p_suburb)) < 2 or length(trim(p_food)) < 3 or length(trim(p_signature_dishes)) < 3 or length(trim(p_why_launch)) < 10 then raise exception 'Please complete all required application fields.'; end if;
  insert into public.kitchen_applications (applicant_id, full_name, email, mobile, suburb, food, signature_dishes, cooking_from, previously_sold_food, why_launch, proposed_name)
  values (auth.uid(), trim(p_full_name), v_email, trim(p_mobile), trim(p_suburb), trim(p_food), trim(p_signature_dishes), trim(p_cooking_from), p_previously_sold_food, trim(p_why_launch), nullif(trim(p_proposed_name), '')) returning * into v_application;
  update public.profiles set full_name = trim(p_full_name), role = case when role = 'customer' then 'kitchen_founder' else role end where id = auth.uid();
  insert into public.application_status_history(application_id, status, changed_by) values (v_application.id, 'submitted', auth.uid());
  return v_application;
end;
$$;

create function public.review_kitchen_application(p_application_id uuid, p_status public.application_status, p_note text default null)
returns public.kitchen_applications language plpgsql security definer set search_path = public as $$
declare v_application public.kitchen_applications;
begin
  if not public.is_admin() then raise exception 'Only SSU Australia administrators can review applications.'; end if;
  if p_status not in ('under_review', 'more_information_required', 'approved', 'declined') then raise exception 'This is not a review status.'; end if;
  update public.kitchen_applications set status = p_status, admin_note = nullif(trim(p_note), ''), reviewed_by = auth.uid(), reviewed_at = now() where id = p_application_id returning * into v_application;
  if v_application.id is null then raise exception 'Application not found.'; end if;
  insert into public.application_status_history(application_id, status, note, changed_by) values (v_application.id, p_status, nullif(trim(p_note), ''), auth.uid());
  return v_application;
end;
$$;

revoke all on public.profiles, public.kitchen_applications, public.application_status_history from anon, authenticated;
grant select on public.profiles, public.kitchen_applications, public.application_status_history to authenticated;
grant execute on function public.submit_kitchen_application(text,text,text,text,text,text,boolean,text,text) to authenticated;
grant execute on function public.review_kitchen_application(uuid,public.application_status,text) to authenticated;

-- After creating your first account, promote it in Supabase SQL Editor (replace the UUID):
-- update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';
