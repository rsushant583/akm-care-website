create extension if not exists pgcrypto;

create table if not exists services (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text default 'other',
  icon text default 'briefcase',
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric not null,
  quantity text,
  description text,
  image_url text,
  status text default 'sold_out',
  display_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists motivation_quotes (
  id uuid default gen_random_uuid() primary key,
  quote text not null,
  source text default 'AKM Care',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists faq (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  answer text not null,
  category text default 'general',
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists contact_submissions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  service text,
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists feedback_submissions (
  id uuid default gen_random_uuid() primary key,
  name text,
  rating integer check (rating between 1 and 5),
  message text,
  page text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists product_interests (
  id uuid default gen_random_uuid() primary key,
  name text,
  email text not null,
  product_name text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists career_applications (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text,
  role text,
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table services enable row level security;
alter table products enable row level security;
alter table motivation_quotes enable row level security;
alter table faq enable row level security;
alter table contact_submissions enable row level security;
alter table feedback_submissions enable row level security;
alter table product_interests enable row level security;
alter table career_applications enable row level security;

drop policy if exists "public_read_services" on services;
create policy "public_read_services" on services
for select using (is_active = true);

drop policy if exists "public_read_products" on products;
create policy "public_read_products" on products
for select using (true);

drop policy if exists "public_read_motivation" on motivation_quotes;
create policy "public_read_motivation" on motivation_quotes
for select using (is_active = true);

drop policy if exists "public_read_faq" on faq;
create policy "public_read_faq" on faq
for select using (is_active = true);

drop policy if exists "public_insert_contact" on contact_submissions;
create policy "public_insert_contact" on contact_submissions
for insert with check (true);

drop policy if exists "public_insert_feedback" on feedback_submissions;
create policy "public_insert_feedback" on feedback_submissions
for insert with check (true);

drop policy if exists "public_insert_interest" on product_interests;
create policy "public_insert_interest" on product_interests
for insert with check (true);

drop policy if exists "public_insert_career" on career_applications;
create policy "public_insert_career" on career_applications
for insert with check (true);
