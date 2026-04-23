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
  stock_quantity integer not null default 0 check (stock_quantity between 0 and 50),
  description text,
  image_url text,
  status text default 'sold_out',
  display_order integer default 0,
  created_at timestamptz default now()
);

alter table products add column if not exists stock_quantity integer not null default 0;
alter table products alter column stock_quantity set default 0;
update products set stock_quantity = 0 where stock_quantity is null;
update products set stock_quantity = 50 where stock_quantity > 50;
update products set stock_quantity = 0 where stock_quantity < 0;

create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  amount numeric not null,
  currency text not null default 'INR',
  quantity integer not null default 1,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  razorpay_order_id text not null,
  razorpay_payment_id text,
  razorpay_signature text,
  payment_status text not null default 'created',
  created_at timestamptz default now()
);

alter table orders add column if not exists order_group_id text;
alter table orders add column if not exists unit_price numeric;
alter table orders add column if not exists notes jsonb default '{}'::jsonb;

create table if not exists stock_movements (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null references products(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  movement_type text not null check (movement_type in ('sale', 'restock', 'adjustment', 'refund')),
  quantity_change integer not null,
  previous_stock integer not null,
  new_stock integer not null,
  reason text,
  created_at timestamptz default now()
);

create index if not exists idx_stock_movements_product_created
  on stock_movements(product_id, created_at desc);

create table if not exists cart_items (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0 and quantity <= 10),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (session_id, product_id)
);

create index if not exists idx_cart_items_session_id on cart_items(session_id);

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
alter table orders enable row level security;
alter table stock_movements enable row level security;
alter table cart_items enable row level security;

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

drop policy if exists "public_insert_orders" on orders;
create policy "public_insert_orders" on orders
for insert with check (true);

drop policy if exists "public_read_stock_movements" on stock_movements;
create policy "public_read_stock_movements" on stock_movements
for select using (true);

drop policy if exists "service_insert_stock_movements" on stock_movements;
create policy "service_insert_stock_movements" on stock_movements
for insert with check (true);

drop policy if exists "public_read_cart_items" on cart_items;
create policy "public_read_cart_items" on cart_items
for select using (true);

drop policy if exists "public_insert_cart_items" on cart_items;
create policy "public_insert_cart_items" on cart_items
for insert with check (true);

drop policy if exists "public_update_cart_items" on cart_items;
create policy "public_update_cart_items" on cart_items
for update using (true) with check (true);

drop policy if exists "public_delete_cart_items" on cart_items;
create policy "public_delete_cart_items" on cart_items
for delete using (true);
