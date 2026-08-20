-- V1 bulk catalog import: hide draft/archived from storefront, import jobs, private staging bucket.
-- Additive. Does not change product column layout or checkout tables.

-- ---------------------------------------------------------------------------
-- Storefront visibility: draft + archived stay in products (admin) but not shop
-- ---------------------------------------------------------------------------
drop policy if exists "public_read_products" on products;
create policy "public_read_products" on products
for select using (
  coalesce(status, 'available') not in ('draft', 'archived')
);

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
left join subcategories sc on sc.id = p.subcategory_id
where coalesce(p.status, 'available') not in ('draft', 'archived');

grant select on catalog_product_list to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Import audit tables
-- ---------------------------------------------------------------------------
create table if not exists catalog_import_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  source_filename text,
  images_filename text,
  source_path text,
  images_path text,
  source_type text not null check (source_type in ('xlsx', 'csv')),
  mode text not null check (mode in ('add_new', 'update_existing', 'sync')),
  status text not null default 'uploaded' check (status in (
    'uploaded', 'parsed', 'preview', 'committing', 'completed', 'failed', 'cancelled'
  )),
  column_map jsonb not null default '{}'::jsonb,
  rows_detected integer not null default 0,
  valid_count integer not null default 0,
  invalid_count integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  failed_count integer not null default 0,
  images_processed integer not null default 0,
  duplicate_sku_count integer not null default 0,
  missing_image_count integer not null default 0,
  error_summary jsonb not null default '{}'::jsonb,
  image_filenames jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists catalog_import_rows (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references catalog_import_jobs(id) on delete cascade,
  row_number integer not null,
  sku text,
  sku_key text,
  raw jsonb not null default '{}'::jsonb,
  normalized jsonb not null default '{}'::jsonb,
  action text check (action in ('create', 'update', 'skip')),
  validation_status text not null check (validation_status in ('valid', 'invalid')),
  errors jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  existing_product_id uuid,
  product_id uuid,
  commit_status text not null default 'pending' check (
    commit_status in ('pending', 'committed', 'failed', 'skipped')
  ),
  commit_error text,
  created_at timestamptz not null default now(),
  unique (job_id, row_number)
);

create index if not exists idx_catalog_import_jobs_created on catalog_import_jobs(created_at desc);
create index if not exists idx_catalog_import_rows_job on catalog_import_rows(job_id, row_number);

alter table catalog_import_jobs enable row level security;
alter table catalog_import_rows enable row level security;

drop policy if exists "admin_all_catalog_import_jobs" on catalog_import_jobs;
create policy "admin_all_catalog_import_jobs" on catalog_import_jobs
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists "admin_all_catalog_import_rows" on catalog_import_rows;
create policy "admin_all_catalog_import_rows" on catalog_import_rows
  for all using (public.is_admin_user()) with check (public.is_admin_user());

grant select, insert, update, delete on catalog_import_jobs to authenticated;
grant select, insert, update, delete on catalog_import_rows to authenticated;

-- ---------------------------------------------------------------------------
-- Private staging bucket (never public; never Vite/public)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-imports',
  'catalog-imports',
  false,
  52428800,
  array[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain',
    'application/csv',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin_select_catalog_imports" on storage.objects;
create policy "admin_select_catalog_imports" on storage.objects
  for select to authenticated
  using (bucket_id = 'catalog-imports' and public.is_admin_user());

drop policy if exists "admin_insert_catalog_imports" on storage.objects;
create policy "admin_insert_catalog_imports" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'catalog-imports' and public.is_admin_user());

drop policy if exists "admin_update_catalog_imports" on storage.objects;
create policy "admin_update_catalog_imports" on storage.objects
  for update to authenticated
  using (bucket_id = 'catalog-imports' and public.is_admin_user())
  with check (bucket_id = 'catalog-imports' and public.is_admin_user());

drop policy if exists "admin_delete_catalog_imports" on storage.objects;
create policy "admin_delete_catalog_imports" on storage.objects
  for delete to authenticated
  using (bucket_id = 'catalog-imports' and public.is_admin_user());
