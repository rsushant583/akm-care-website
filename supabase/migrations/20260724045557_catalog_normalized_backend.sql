-- Normalized catalog backend for scalable ecommerce (100k+ products)
-- Extends existing products table used by orders/Razorpay — additive + related tables.

create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Brands / Categories
-- ---------------------------------------------------------------------------
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references categories(id) on delete set null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  image_url text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, slug)
);

create index if not exists idx_categories_parent on categories(parent_id);
create index if not exists idx_subcategories_category on subcategories(category_id);

-- ---------------------------------------------------------------------------
-- Products — ensure ecommerce columns exist, then add normalized FKs / SEO
-- (Idempotent if 20260724045556 already applied; safe if migration order varies.)
-- ---------------------------------------------------------------------------
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

alter table products add column if not exists brand_id uuid references brands(id) on delete set null;
alter table products add column if not exists category_id uuid references categories(id) on delete set null;
alter table products add column if not exists subcategory_id uuid references subcategories(id) on delete set null;
alter table products add column if not exists specifications jsonb default '{}'::jsonb;
alter table products add column if not exists is_trending boolean default false;
alter table products add column if not exists seo_title text;
alter table products add column if not exists seo_description text;
alter table products add column if not exists updated_at timestamptz default now();
alter table products add column if not exists search_vector tsvector;

-- Relax legacy stock cap so catalog can scale beyond 50 units
do $$
begin
  alter table products drop constraint if exists products_stock_quantity_check;
exception when undefined_object then null;
end $$;

alter table products
  drop constraint if exists products_stock_quantity_check;

alter table products
  add constraint products_stock_quantity_nonneg
  check (stock_quantity >= 0);

create index if not exists idx_products_brand_id on products(brand_id);
create index if not exists idx_products_category_id on products(category_id);
create index if not exists idx_products_subcategory_id on products(subcategory_id);
create index if not exists idx_products_featured on products(is_featured) where is_featured = true;
create index if not exists idx_products_best_seller on products(is_best_seller) where is_best_seller = true;
create index if not exists idx_products_price on products(akm_care_price);
create index if not exists idx_products_mrp on products(mrp);
create index if not exists idx_products_discount on products(discount_percent);
create index if not exists idx_products_created_at on products(created_at desc);
create index if not exists idx_products_search_vector on products using gin (search_vector);
create index if not exists idx_products_name_trgm on products using gin (name gin_trgm_ops);

-- Rebuild search vector trigger
create or replace function products_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.sku, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.product_code, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.category_label, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.short_description, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(new.detailed_description, new.description, '')), 'D');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_products_search_vector on products;
create trigger trg_products_search_vector
before insert or update of name, sku, product_code, category_label, short_description, detailed_description, description
on products
for each row execute function products_search_vector_update();

-- ---------------------------------------------------------------------------
-- Product images (unlimited per product)
-- ---------------------------------------------------------------------------
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt text,
  storage_path text,
  color_slug text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product on product_images(product_id, sort_order);
create index if not exists idx_product_images_primary on product_images(product_id) where is_primary = true;

-- ---------------------------------------------------------------------------
-- Variants & colors (normalized)
-- ---------------------------------------------------------------------------
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  sku_suffix text,
  stock integer not null default 0 check (stock >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, name)
);

create table if not exists product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  hex text,
  slug text,
  image_indexes integer[] default '{}',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, name)
);

create index if not exists idx_product_variants_product on product_variants(product_id);
create index if not exists idx_product_colors_product on product_colors(product_id);

-- ---------------------------------------------------------------------------
-- Inventory (future-ready multi-warehouse)
-- ---------------------------------------------------------------------------
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  warehouse_code text not null default 'DEFAULT',
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_inventory_unique_line
  on inventory (product_id, warehouse_code, (coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)));

create index if not exists idx_inventory_product on inventory(product_id);

-- ---------------------------------------------------------------------------
-- Merchandising
-- ---------------------------------------------------------------------------
create table if not exists featured_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  slot text not null default 'home' check (slot in ('home', 'shop', 'banner')),
  display_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, slot)
);

create table if not exists related_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  related_product_id uuid not null references products(id) on delete cascade,
  relation_type text not null default 'related' check (relation_type in ('related', 'similar', 'upsell', 'cross_sell')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (product_id <> related_product_id),
  unique (product_id, related_product_id, relation_type)
);

create index if not exists idx_featured_products_slot on featured_products(slot, display_order);
create index if not exists idx_related_products_product on related_products(product_id, display_order);

-- ---------------------------------------------------------------------------
-- Future-ready tables
-- ---------------------------------------------------------------------------
create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid,
  session_id text,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_reviews_product on product_reviews(product_id) where is_approved = true;

-- wishlists (future-ready guest + account sync)
create table if not exists wishlists (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique (session_id, product_id)
);
alter table wishlists add column if not exists user_id uuid;
create index if not exists idx_wishlists_user on wishlists(user_id) where user_id is not null;

create table if not exists recently_viewed (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  user_id uuid,
  product_id uuid not null references products(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_recently_viewed_session on recently_viewed(session_id, viewed_at desc);
create index if not exists idx_recently_viewed_user on recently_viewed(user_id, viewed_at desc);

-- ---------------------------------------------------------------------------
-- Catalog listing view (denormalized read model for shop)
-- ---------------------------------------------------------------------------
create or replace view catalog_product_list
with (security_invoker = true)
as
select
  p.id,
  p.slug,
  p.name,
  p.sku,
  p.product_code,
  p.short_description,
  p.detailed_description,
  p.description,
  p.mrp,
  p.selling_price,
  p.akm_care_price,
  coalesce(p.akm_care_price, p.selling_price, p.price) as effective_price,
  p.discount_percent,
  p.gst_percent,
  p.gst_number,
  p.hsn,
  p.weight,
  p.dimensions,
  p.stock_quantity,
  p.status,
  p.shipping_time,
  p.warranty,
  p.packing_type,
  p.freight_cost,
  p.video_url,
  p.category as category_slug,
  p.category_label,
  p.tags,
  p.rating,
  p.review_count,
  p.is_featured,
  p.is_new_arrival,
  p.is_best_seller,
  p.is_trending,
  p.popularity,
  p.display_order,
  p.seo_title,
  p.seo_description,
  p.specifications,
  p.price,
  p.image_url,
  p.created_at,
  p.updated_at,
  b.id as brand_id,
  b.name as brand_name,
  b.slug as brand_slug,
  c.id as category_id,
  c.name as category_name,
  sc.id as subcategory_id,
  sc.name as subcategory_name,
  sc.slug as subcategory_slug,
  (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', pi.id,
          'src', pi.url,
          'alt', coalesce(pi.alt, p.name),
          'color', pi.color_slug,
          'sortOrder', pi.sort_order,
          'isPrimary', pi.is_primary
        )
        order by pi.sort_order, pi.created_at
      ),
      '[]'::jsonb
    )
    from product_images pi
    where pi.product_id = p.id
  ) as images,
  (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', pv.id,
          'name', pv.name,
          'skuSuffix', pv.sku_suffix,
          'stock', pv.stock
        )
        order by pv.sort_order
      ),
      '[]'::jsonb
    )
    from product_variants pv
    where pv.product_id = p.id and pv.is_active = true
  ) as variants,
  (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', pc.id,
          'name', pc.name,
          'hex', pc.hex,
          'imageIndexes', pc.image_indexes
        )
        order by pc.sort_order
      ),
      '[]'::jsonb
    )
    from product_colors pc
    where pc.product_id = p.id and pc.is_active = true
  ) as colors
from products p
left join brands b on b.id = p.brand_id
left join categories c on c.id = p.category_id
left join subcategories sc on sc.id = p.subcategory_id;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table brands enable row level security;
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table product_colors enable row level security;
alter table inventory enable row level security;
alter table featured_products enable row level security;
alter table related_products enable row level security;
alter table product_reviews enable row level security;
alter table recently_viewed enable row level security;

drop policy if exists "public_read_brands" on brands;
create policy "public_read_brands" on brands for select using (is_active = true);

drop policy if exists "public_read_categories" on categories;
create policy "public_read_categories" on categories for select using (is_active = true);

drop policy if exists "public_read_subcategories" on subcategories;
create policy "public_read_subcategories" on subcategories for select using (is_active = true);

drop policy if exists "public_read_product_images" on product_images;
create policy "public_read_product_images" on product_images for select using (true);

drop policy if exists "public_read_product_variants" on product_variants;
create policy "public_read_product_variants" on product_variants for select using (is_active = true);

drop policy if exists "public_read_product_colors" on product_colors;
create policy "public_read_product_colors" on product_colors for select using (is_active = true);

drop policy if exists "public_read_inventory" on inventory;
create policy "public_read_inventory" on inventory for select using (true);

drop policy if exists "public_read_featured_products" on featured_products;
create policy "public_read_featured_products" on featured_products for select using (is_active = true);

drop policy if exists "public_read_related_products" on related_products;
create policy "public_read_related_products" on related_products for select using (true);

drop policy if exists "public_read_approved_reviews" on product_reviews;
create policy "public_read_approved_reviews" on product_reviews for select using (is_approved = true);

drop policy if exists "public_insert_recently_viewed" on recently_viewed;
create policy "public_insert_recently_viewed" on recently_viewed for insert with check (true);

drop policy if exists "public_read_recently_viewed" on recently_viewed;
create policy "public_read_recently_viewed" on recently_viewed for select using (true);

-- ---------------------------------------------------------------------------
-- Storage buckets (public catalog assets)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products', 'products', true, 10485760, array['image/png','image/jpeg','image/webp','image/jpg']),
  ('brands', 'brands', true, 5242880, array['image/png','image/jpeg','image/webp','image/jpg']),
  ('categories', 'categories', true, 5242880, array['image/png','image/jpeg','image/webp','image/jpg']),
  ('banners', 'banners', true, 10485760, array['image/png','image/jpeg','image/webp','image/jpg']),
  ('thumbnails', 'thumbnails', true, 2097152, array['image/png','image/jpeg','image/webp','image/jpg'])
on conflict (id) do update set public = excluded.public;

drop policy if exists "public_read_products_bucket" on storage.objects;
create policy "public_read_products_bucket" on storage.objects
for select using (bucket_id in ('products','brands','categories','banners','thumbnails'));

drop policy if exists "authenticated_upload_catalog_buckets" on storage.objects;
create policy "authenticated_upload_catalog_buckets" on storage.objects
for insert to authenticated
with check (bucket_id in ('products','brands','categories','banners','thumbnails'));

drop policy if exists "authenticated_update_catalog_buckets" on storage.objects;
create policy "authenticated_update_catalog_buckets" on storage.objects
for update to authenticated
using (bucket_id in ('products','brands','categories','banners','thumbnails'))
with check (bucket_id in ('products','brands','categories','banners','thumbnails'));
