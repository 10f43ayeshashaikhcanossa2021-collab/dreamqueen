-- DreamQueen Supabase setup
-- Run once in Supabase SQL Editor.
-- Your existing products/orders policies can remain; these statements are safe to re-run.

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  phone text,
  role text default 'customer' check (role in ('customer','admin')),
  saved_addresses jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', new.phone, '')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Orders/custom orders need to be readable/writable by the current prototype.
-- Tighten these policies before production if you want customer-specific privacy.
alter table public.orders enable row level security;
grant select, insert, update, delete on public.orders to anon, authenticated;
drop policy if exists "Allow public read-write orders" on public.orders;
create policy "Allow public read-write orders" on public.orders
for all to anon, authenticated using (true) with check (true);

alter table public.custom_orders enable row level security;
grant select, insert, update, delete on public.custom_orders to anon, authenticated;
drop policy if exists "Allow public read-write custom_orders" on public.custom_orders;
create policy "Allow public read-write custom_orders" on public.custom_orders
for all to anon, authenticated using (true) with check (true);

-- Realtime for cross-device admin/customer updates.
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.custom_orders;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null;
end $$;

-- Verification queries:
-- select id, email, created_at from auth.users order by created_at desc;
-- select id, full_name, email, phone, role from public.profiles order by created_at desc;
-- select id, order_number, total, tracking_status, created_at from public.orders order by created_at desc;
