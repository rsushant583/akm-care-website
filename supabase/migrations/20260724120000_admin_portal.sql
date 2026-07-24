-- Admin portal: roles, CMS, coupons, banners, media, settings
-- Additive; does not break customer storefront.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Admin users (RBAC)
-- ---------------------------------------------------------------------------
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'admin', 'staff')),
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_users_role on admin_users(role) where is_active = true;

alter table admin_users enable row level security;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid() and au.is_active = true
  );
$$;

create or replace function public.admin_has_role(allowed text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role = any(allowed)
  );
$$;

drop policy if exists "admin_users_select_self_or_super" on admin_users;
create policy "admin_users_select_self_or_super" on admin_users
  for select using (
    user_id = auth.uid()
    or public.admin_has_role(array['super_admin'])
  );

drop policy if exists "admin_users_manage_super" on admin_users;
create policy "admin_users_manage_super" on admin_users
  for all using (public.admin_has_role(array['super_admin']))
  with check (public.admin_has_role(array['super_admin']));

-- ---------------------------------------------------------------------------
-- Coupons
-- ---------------------------------------------------------------------------
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'flat', 'free_shipping')),
  discount_value numeric not null default 0,
  min_purchase numeric not null default 0,
  usage_limit integer,
  used_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_coupons_code on coupons(code);

-- ---------------------------------------------------------------------------
-- Banners
-- ---------------------------------------------------------------------------
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  link_url text,
  placement text not null default 'home_hero'
    check (placement in ('home_hero', 'promotional', 'seasonal', 'offer', 'festival', 'shop')),
  display_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_banners_placement on banners(placement, display_order);

-- ---------------------------------------------------------------------------
-- CMS pages / sections
-- ---------------------------------------------------------------------------
create table if not exists cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into cms_pages (slug, title, content) values
  ('about', 'About Us', '{"body":""}'::jsonb),
  ('csr', 'CSR', '{"body":""}'::jsonb),
  ('contact', 'Contact Information', '{"phone":"","email":"","address":""}'::jsonb),
  ('home', 'Home Page Sections', '{"hero":{},"sections":[]}'::jsonb),
  ('testimonials', 'Testimonials', '{"items":[]}'::jsonb)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Media library
-- ---------------------------------------------------------------------------
create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  storage_path text,
  bucket text not null default 'media',
  folder text not null default 'uploads',
  mime_type text,
  size_bytes integer,
  alt text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_media_folder on media_assets(folder, created_at desc);
create index if not exists idx_media_name on media_assets using gin (to_tsvector('simple', coalesce(name, '')));

-- ---------------------------------------------------------------------------
-- Site settings (key/value JSON)
-- ---------------------------------------------------------------------------
create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into site_settings (key, value) values
  ('company', '{"name":"AKM Care","tagline":"Trusted & Fair"}'::jsonb),
  ('contact', '{"phones":[],"emails":[],"address":""}'::jsonb),
  ('social', '{"facebook":"","instagram":"","youtube":"","linkedin":""}'::jsonb),
  ('shipping', '{"standard":49,"express":99,"free_above":999}'::jsonb),
  ('tax', '{"default_gst":5,"currency":"INR"}'::jsonb),
  ('theme', '{"primary":"#E8621A"}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Customer flags (block)
-- ---------------------------------------------------------------------------
alter table profiles add column if not exists is_blocked boolean not null default false;
alter table profiles add column if not exists role text default 'customer';

-- Expand order_headers status values for admin workflow
alter table order_headers drop constraint if exists order_headers_status_check;
alter table order_headers add constraint order_headers_status_check
  check (status in (
    'pending','confirmed','packed','shipped','out_for_delivery',
    'delivered','cancelled','returned','refunded','paid','processing','failed'
  ));

-- ---------------------------------------------------------------------------
-- RLS for admin-managed tables
-- ---------------------------------------------------------------------------
alter table coupons enable row level security;
alter table banners enable row level security;
alter table cms_pages enable row level security;
alter table media_assets enable row level security;
alter table site_settings enable row level security;

-- Public read for storefront-facing content
drop policy if exists "public_read_active_banners" on banners;
create policy "public_read_active_banners" on banners
  for select using (is_active = true);

drop policy if exists "public_read_published_cms" on cms_pages;
create policy "public_read_published_cms" on cms_pages
  for select using (is_published = true);

drop policy if exists "public_read_site_settings" on site_settings;
create policy "public_read_site_settings" on site_settings for select using (true);

drop policy if exists "public_read_active_coupons" on coupons;
create policy "public_read_active_coupons" on coupons
  for select using (is_active = true);

-- Admin full manage
drop policy if exists "admin_manage_coupons" on coupons;
create policy "admin_manage_coupons" on coupons
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_manage_banners" on banners;
create policy "admin_manage_banners" on banners
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_manage_cms" on cms_pages;
create policy "admin_manage_cms" on cms_pages
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_manage_media" on media_assets;
create policy "admin_manage_media" on media_assets
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_manage_settings" on site_settings;
create policy "admin_manage_settings" on site_settings
  for all using (public.is_admin_user()) with check (public.is_admin_user());

-- Catalog write for admins
drop policy if exists "admin_write_products" on products;
create policy "admin_write_products" on products
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_write_brands" on brands;
create policy "admin_write_brands" on brands
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_write_categories" on categories;
create policy "admin_write_categories" on categories
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_write_subcategories" on subcategories;
create policy "admin_write_subcategories" on subcategories
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_write_product_images" on product_images;
create policy "admin_write_product_images" on product_images
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_write_product_variants" on product_variants;
create policy "admin_write_product_variants" on product_variants
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_write_product_colors" on product_colors;
create policy "admin_write_product_colors" on product_colors
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_write_inventory" on inventory;
create policy "admin_write_inventory" on inventory
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_write_featured" on featured_products;
create policy "admin_write_featured" on featured_products
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_write_faq" on faq;
create policy "admin_write_faq" on faq
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_write_services" on services;
create policy "admin_write_services" on services
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_write_motivation" on motivation_quotes;
create policy "admin_write_motivation" on motivation_quotes
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_read_orders" on order_headers;
create policy "admin_read_orders" on order_headers
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_read_order_items" on order_items;
create policy "admin_read_order_items" on order_items
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_read_payments" on payments;
create policy "admin_read_payments" on payments
  for select using (public.is_admin_user());

drop policy if exists "admin_manage_shipping" on shipping;
create policy "admin_manage_shipping" on shipping
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_manage_order_status" on order_status;
create policy "admin_manage_order_status" on order_status
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_read_profiles" on profiles;
create policy "admin_read_profiles" on profiles
  for select using (public.is_admin_user() or auth.uid() = id);

drop policy if exists "admin_update_profiles" on profiles;
create policy "admin_update_profiles" on profiles
  for update using (public.is_admin_user() or auth.uid() = id)
  with check (public.is_admin_user() or auth.uid() = id);

drop policy if exists "admin_read_inbox_contact" on contact_submissions;
create policy "admin_read_inbox_contact" on contact_submissions
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_read_inbox_feedback" on feedback_submissions;
create policy "admin_read_inbox_feedback" on feedback_submissions
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_read_inbox_interest" on product_interests;
create policy "admin_read_inbox_interest" on product_interests
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_read_inbox_career" on career_applications;
create policy "admin_read_inbox_career" on career_applications
  for all using (public.is_admin_user()) with check (public.is_admin_user());

-- Storage: media bucket + admin upload
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,
  array['image/png','image/jpeg','image/webp','image/jpg','image/gif','video/mp4']
)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public_read_media_bucket" on storage.objects;
create policy "public_read_media_bucket" on storage.objects
  for select using (bucket_id = 'media' or bucket_id in ('products','brands','categories','banners','thumbnails'));

drop policy if exists "admin_upload_media" on storage.objects;
create policy "admin_upload_media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('media','products','brands','categories','banners','thumbnails')
    and public.is_admin_user()
  );

drop policy if exists "admin_update_media" on storage.objects;
create policy "admin_update_media" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('media','products','brands','categories','banners','thumbnails')
    and public.is_admin_user()
  );

drop policy if exists "admin_delete_media" on storage.objects;
create policy "admin_delete_media" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('media','products','brands','categories','banners','thumbnails')
    and public.is_admin_user()
  );
