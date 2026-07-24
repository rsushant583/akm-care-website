-- Customer shopping workflow: auth profiles, addresses, cart sync, orders, payments, shipping
-- Additive; preserves legacy `orders` table used by existing Razorpay edge functions.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Addresses
-- ---------------------------------------------------------------------------
create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'home' check (label in ('home', 'office', 'other')),
  full_name text not null,
  phone text not null,
  pincode text not null,
  state text not null,
  city text not null,
  area text not null,
  landmark text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_addresses_user on addresses(user_id);

alter table addresses enable row level security;

drop policy if exists "addresses_select_own" on addresses;
create policy "addresses_select_own" on addresses for select using (auth.uid() = user_id);

drop policy if exists "addresses_insert_own" on addresses;
create policy "addresses_insert_own" on addresses for insert with check (auth.uid() = user_id);

drop policy if exists "addresses_update_own" on addresses;
create policy "addresses_update_own" on addresses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "addresses_delete_own" on addresses;
create policy "addresses_delete_own" on addresses for delete using (auth.uid() = user_id);

-- Ensure only one default per user
create or replace function public.addresses_single_default()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update public.addresses
    set is_default = false, updated_at = now()
    where user_id = new.user_id and id <> new.id and is_default = true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_addresses_single_default on addresses;
create trigger trg_addresses_single_default
  before insert or update of is_default on addresses
  for each row execute function public.addresses_single_default();

-- ---------------------------------------------------------------------------
-- Cart lines — extend for user, color/variant, saved-for-later
-- ---------------------------------------------------------------------------
alter table cart_items add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table cart_items add column if not exists color_id text;
alter table cart_items add column if not exists color_name text;
alter table cart_items add column if not exists variant_id text;
alter table cart_items add column if not exists variant_name text;
alter table cart_items add column if not exists unit_price numeric;
alter table cart_items add column if not exists saved_for_later boolean not null default false;
alter table cart_items add column if not exists product_snapshot jsonb default '{}'::jsonb;

-- Relax qty cap for production carts
do $$
begin
  alter table cart_items drop constraint if exists cart_items_quantity_check;
exception when undefined_object then null;
end $$;

alter table cart_items drop constraint if exists cart_items_quantity_check;
alter table cart_items add constraint cart_items_quantity_nonneg check (quantity > 0 and quantity <= 100);

create index if not exists idx_cart_items_user on cart_items(user_id) where user_id is not null;

drop policy if exists "cart_items_select_own" on cart_items;
create policy "cart_items_select_own" on cart_items
  for select using (auth.uid() = user_id or session_id is not null);

drop policy if exists "cart_items_write_own" on cart_items;
create policy "cart_items_write_own" on cart_items
  for all using (auth.uid() = user_id or session_id is not null)
  with check (auth.uid() = user_id or session_id is not null);

-- ---------------------------------------------------------------------------
-- Wishlists — already exists; tighten for auth users + guest session
-- ---------------------------------------------------------------------------
alter table wishlists add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table wishlists alter column session_id drop not null;

create unique index if not exists idx_wishlists_user_product
  on wishlists (user_id, product_id) where user_id is not null;

drop policy if exists "wishlists_own" on wishlists;
create policy "wishlists_own" on wishlists
  for all using (auth.uid() = user_id or session_id is not null)
  with check (auth.uid() = user_id or session_id is not null);

-- ---------------------------------------------------------------------------
-- Order headers / items / payments / shipping / status history
-- ---------------------------------------------------------------------------
create table if not exists order_headers (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb not null default '{}'::jsonb,
  billing_address jsonb,
  subtotal numeric not null default 0,
  gst_total numeric not null default 0,
  shipping_total numeric not null default 0,
  discount_total numeric not null default 0,
  coupon_code text,
  grand_total numeric not null default 0,
  currency text not null default 'INR',
  status text not null default 'pending'
    check (status in ('pending','confirmed','paid','processing','shipped','delivered','cancelled','failed','refunded')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','created','paid','failed','refunded')),
  shipping_method text default 'standard',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_order_headers_user on order_headers(user_id, created_at desc);
create index if not exists idx_order_headers_email on order_headers(customer_email);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references order_headers(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null,
  mrp numeric,
  gst_percent numeric not null default 0,
  line_total numeric not null,
  color_name text,
  variant_name text,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order on order_items(order_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references order_headers(id) on delete cascade,
  provider text not null default 'razorpay',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric not null,
  currency text not null default 'INR',
  method text,
  status text not null default 'created'
    check (status in ('created','authorized','captured','failed','refunded')),
  raw_response jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_order on payments(order_id);
create unique index if not exists idx_payments_razorpay_payment
  on payments (razorpay_payment_id) where razorpay_payment_id is not null;

create table if not exists shipping (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references order_headers(id) on delete cascade,
  carrier text,
  tracking_number text,
  method text not null default 'standard',
  status text not null default 'pending'
    check (status in ('pending','ready','shipped','in_transit','delivered','returned')),
  shipped_at timestamptz,
  delivered_at timestamptz,
  estimated_days integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shipping_order on shipping(order_id);

create table if not exists order_status (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references order_headers(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_status_order on order_status(order_id, created_at desc);

-- Future-ready stubs (empty tables)
create table if not exists saved_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'razorpay',
  token_ref text,
  last4 text,
  brand text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references order_headers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  reason text,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

alter table order_headers enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table shipping enable row level security;
alter table order_status enable row level security;
alter table saved_payments enable row level security;
alter table returns enable row level security;

drop policy if exists "order_headers_select_own" on order_headers;
create policy "order_headers_select_own" on order_headers
  for select using (auth.uid() = user_id or user_id is null);

drop policy if exists "order_headers_insert_public" on order_headers;
create policy "order_headers_insert_public" on order_headers
  for insert with check (true);

drop policy if exists "order_items_select_via_order" on order_items;
create policy "order_items_select_via_order" on order_items
  for select using (
    exists (
      select 1 from order_headers oh
      where oh.id = order_id and (oh.user_id = auth.uid() or oh.user_id is null)
    )
  );

drop policy if exists "order_items_insert_public" on order_items;
create policy "order_items_insert_public" on order_items for insert with check (true);

drop policy if exists "payments_select_own" on payments;
create policy "payments_select_own" on payments
  for select using (
    exists (select 1 from order_headers oh where oh.id = order_id and oh.user_id = auth.uid())
  );

drop policy if exists "payments_insert_public" on payments;
create policy "payments_insert_public" on payments for insert with check (true);

drop policy if exists "shipping_select_own" on shipping;
create policy "shipping_select_own" on shipping
  for select using (
    exists (select 1 from order_headers oh where oh.id = order_id and oh.user_id = auth.uid())
  );

drop policy if exists "shipping_insert_public" on shipping;
create policy "shipping_insert_public" on shipping for insert with check (true);

drop policy if exists "order_status_select_own" on order_status;
create policy "order_status_select_own" on order_status
  for select using (
    exists (select 1 from order_headers oh where oh.id = order_id and oh.user_id = auth.uid())
  );

drop policy if exists "order_status_insert_public" on order_status;
create policy "order_status_insert_public" on order_status for insert with check (true);

drop policy if exists "saved_payments_own" on saved_payments;
create policy "saved_payments_own" on saved_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "returns_own" on returns;
create policy "returns_own" on returns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Link legacy orders table to user optionally
alter table orders add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table orders add column if not exists order_header_id uuid references order_headers(id) on delete set null;

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
declare
  n text;
begin
  n := 'AKM' || to_char(now(), 'YYMMDD') || lpad((floor(random()*100000))::int::text, 5, '0');
  return n;
end;
$$;
