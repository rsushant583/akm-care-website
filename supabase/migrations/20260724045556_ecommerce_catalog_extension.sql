-- Extended ecommerce catalog fields for scalable product management.
-- Safe to apply on existing products table (additive only).

alter table products add column if not exists slug text;
alter table products add column if not exists short_description text;
alter table products add column if not exists detailed_description text;
alter table products add column if not exists images jsonb default '[]'::jsonb;
alter table products add column if not exists video_url text;
alter table products add column if not exists sku text;
alter table products add column if not exists product_code text;
alter table products add column if not exists dimensions text;
alter table products add column if not exists weight text;
alter table products add column if not exists variants jsonb default '[]'::jsonb;
alter table products add column if not exists colors jsonb default '[]'::jsonb;
alter table products add column if not exists mrp numeric;
alter table products add column if not exists selling_price numeric;
alter table products add column if not exists akm_care_price numeric;
alter table products add column if not exists discount_percent numeric default 0;
alter table products add column if not exists gst_percent numeric default 5;
alter table products add column if not exists gst_number text;
alter table products add column if not exists hsn text;
alter table products add column if not exists shipping_time text;
alter table products add column if not exists warranty text;
alter table products add column if not exists packing_type text;
alter table products add column if not exists freight_cost text;
alter table products add column if not exists category text default 'apparel';
alter table products add column if not exists category_label text;
alter table products add column if not exists tags jsonb default '[]'::jsonb;
alter table products add column if not exists rating numeric default 4.5;
alter table products add column if not exists review_count integer default 0;
alter table products add column if not exists is_featured boolean default false;
alter table products add column if not exists is_new_arrival boolean default false;
alter table products add column if not exists is_best_seller boolean default false;
alter table products add column if not exists popularity integer default 0;

create unique index if not exists idx_products_slug_unique on products (slug) where slug is not null;
create unique index if not exists idx_products_sku_unique on products (sku) where sku is not null;
create index if not exists idx_products_category on products (category);
create index if not exists idx_products_status on products (status);

-- Guest wishlist sync (future account sync)
create table if not exists wishlists (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique (session_id, product_id)
);

alter table wishlists enable row level security;

drop policy if exists "public_read_wishlists" on wishlists;
create policy "public_read_wishlists" on wishlists for select using (true);

drop policy if exists "public_insert_wishlists" on wishlists;
create policy "public_insert_wishlists" on wishlists for insert with check (true);

drop policy if exists "public_delete_wishlists" on wishlists;
create policy "public_delete_wishlists" on wishlists for delete using (true);

-- Checkout drafts / pending payment (Razorpay handoff)
create table if not exists checkout_drafts (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  payload jsonb not null default '{}'::jsonb,
  payment_method text,
  status text not null default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table checkout_drafts enable row level security;

drop policy if exists "public_insert_checkout_drafts" on checkout_drafts;
create policy "public_insert_checkout_drafts" on checkout_drafts for insert with check (true);
