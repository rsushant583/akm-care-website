-- Vendor marketplace onboarding foundation
create table if not exists vendor_applications (
  id uuid default gen_random_uuid() primary key,
  business_name text not null,
  owner_name text not null,
  mobile text not null,
  email text not null,
  gst_number text,
  product_category text not null,
  business_address text not null,
  product_description text not null,
  website_links text,
  documents jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_at timestamptz,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_vendor_applications_status_created
  on vendor_applications(status, created_at desc);

alter table vendor_applications enable row level security;

drop policy if exists "public_insert_vendor_applications" on vendor_applications;
create policy "public_insert_vendor_applications" on vendor_applications
for insert with check (true);

-- Future-ready vendor accounts table (populated on approval in a later phase)
create table if not exists vendors (
  id uuid default gen_random_uuid() primary key,
  application_id uuid unique references vendor_applications(id) on delete set null,
  business_name text not null,
  owner_name text not null,
  email text not null,
  mobile text not null,
  gst_number text,
  product_category text,
  status text not null default 'active' check (status in ('active', 'suspended', 'inactive')),
  commission_rate numeric(5,2) default 15.00,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table vendors enable row level security;

-- Storage bucket for vendor onboarding documents (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vendor-documents',
  'vendor-documents',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "public_upload_vendor_documents" on storage.objects;
create policy "public_upload_vendor_documents" on storage.objects
for insert with check (bucket_id = 'vendor-documents');
