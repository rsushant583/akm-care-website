-- Shipping & fulfillment v1: provider-neutral shipments + webhook events.
-- Additive. Does not modify payments, Razorpay, or stock paths.
-- SHIPPING_PROVIDER_ENABLED is an Edge secret (default off); not a DB flag.

-- ---------------------------------------------------------------------------
-- Harden existing shipping projection (one row per order)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from public.shipping
    group by order_id
    having count(*) > 1
  ) then
    raise exception 'Cannot add unique(order_id) on shipping: duplicate projection rows exist';
  end if;
end $$;

create unique index if not exists idx_shipping_order_unique
  on public.shipping (order_id);

alter table public.shipping drop constraint if exists shipping_status_check;
alter table public.shipping
  add constraint shipping_status_check
  check (status in (
    'pending',
    'ready',
    'shipped',
    'in_transit',
    'delivered',
    'returned',
    'not_created',
    'created',
    'awb_assigned',
    'pickup_scheduled',
    'picked_up',
    'out_for_delivery',
    'cancelled',
    'failed',
    'rto'
  ));

-- Prefer Edge Function / service-role writes for projection mutations.
drop policy if exists "admin_update_shipping" on public.shipping;
-- Keep admin_select_shipping + shipping_select_own (customer read).

-- ---------------------------------------------------------------------------
-- shipping_shipments
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.order_headers(id) on delete cascade,
  kind text not null default 'forward'
    check (kind in ('forward', 'return', 'rto')),
  provider text not null default 'shiprocket',
  provider_order_id text,
  provider_shipment_id text,
  channel_order_id text,
  awb_code text,
  courier_company_id text,
  courier_name text,
  tracking_url text,
  label_url text,
  manifest_url text,
  status text not null default 'created'
    check (status in (
      'created',
      'awb_assigned',
      'pickup_scheduled',
      'picked_up',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'failed',
      'rto'
    )),
  pickup_status text,
  etd timestamptz,
  weight_kg numeric,
  length_cm numeric,
  breadth_cm numeric,
  height_cm numeric,
  cod_amount numeric not null default 0,
  destination_snapshot jsonb not null default '{}'::jsonb,
  provider_created_at timestamptz,
  awb_assigned_at timestamptz,
  pickup_scheduled_at timestamptz,
  picked_up_at timestamptz,
  in_transit_at timestamptz,
  out_for_delivery_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  rto_at timestamptz,
  last_error text,
  raw_last_response jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shipping_shipments_order
  on public.shipping_shipments (order_id, created_at desc);

create unique index if not exists idx_shipping_shipments_active_forward
  on public.shipping_shipments (order_id)
  where (kind = 'forward' and status is distinct from 'cancelled');

create unique index if not exists idx_shipping_shipments_provider_order
  on public.shipping_shipments (provider, provider_order_id)
  where (provider_order_id is not null);

create unique index if not exists idx_shipping_shipments_provider_shipment
  on public.shipping_shipments (provider, provider_shipment_id)
  where (provider_shipment_id is not null);

create unique index if not exists idx_shipping_shipments_awb
  on public.shipping_shipments (awb_code)
  where (awb_code is not null);

alter table public.shipping_shipments enable row level security;

-- Admins may read sanitized rows; raw_last_response must be excluded by client selects.
drop policy if exists "admin_select_shipping_shipments" on public.shipping_shipments;
create policy "admin_select_shipping_shipments" on public.shipping_shipments
  for select using (public.is_admin_user());

-- Customers may read their own forward shipment metadata (no raw payload via select list in app).
drop policy if exists "shipping_shipments_select_own" on public.shipping_shipments;
create policy "shipping_shipments_select_own" on public.shipping_shipments
  for select using (
    exists (
      select 1 from public.order_headers oh
      where oh.id = shipping_shipments.order_id
        and oh.user_id = auth.uid()
    )
  );

-- No anon/auth INSERT/UPDATE/DELETE — service role / Edge Functions only.

-- ---------------------------------------------------------------------------
-- shipping_events (webhook / ops idempotency)
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_events (
  event_id text primary key,
  event_type text not null,
  awb_code text,
  provider_shipment_id text,
  order_header_id uuid references public.order_headers(id) on delete set null,
  shipment_id uuid references public.shipping_shipments(id) on delete set null,
  current_status text,
  current_status_id text,
  provider_timestamp text,
  payload jsonb,
  processed_at timestamptz not null default now()
);

create index if not exists idx_shipping_events_shipment
  on public.shipping_events (shipment_id, processed_at desc);

create index if not exists idx_shipping_events_awb
  on public.shipping_events (awb_code)
  where (awb_code is not null);

alter table public.shipping_events enable row level security;
-- No anon/authenticated policies: service role only (mirrors processed_razorpay_events).

-- ---------------------------------------------------------------------------
-- Optional per-product parcel overrides (nullable; never invent defaults)
-- Catalog "dimensions" / "weight" text remain display-only and must NOT be used as parcel size.
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists package_weight_kg numeric;

alter table public.products
  add column if not exists package_length_cm numeric;

alter table public.products
  add column if not exists package_breadth_cm numeric;

alter table public.products
  add column if not exists package_height_cm numeric;

comment on column public.products.package_weight_kg is
  'Parcel deadweight in kg for logistics. Distinct from catalog weight text.';
comment on column public.products.package_length_cm is
  'Parcel length cm for logistics. Distinct from catalog dimensions/saree length.';
comment on column public.products.package_breadth_cm is
  'Parcel breadth cm for logistics.';
comment on column public.products.package_height_cm is
  'Parcel height cm for logistics.';

comment on table public.shipping_shipments is
  'Provider-neutral shipment records. payment_status and stock are never mutated here.';
comment on table public.shipping_events is
  'Idempotent shipping webhook / ops event log. Service-role writes only.';
