-- Critical remediation (C1–C4, C6): lock order/payment RLS, guest PII, cart/wishlist.
-- Order writes happen only via Edge Functions (service role). Clients cannot insert money rows.

-- ---------------------------------------------------------------------------
-- order_headers: access token + razorpay binding
-- ---------------------------------------------------------------------------
alter table order_headers
  add column if not exists access_token uuid not null default gen_random_uuid();

alter table order_headers
  add column if not exists razorpay_order_id text;

alter table order_headers
  add column if not exists pricing_snapshot jsonb not null default '{}'::jsonb;

create unique index if not exists idx_order_headers_razorpay_order
  on order_headers (razorpay_order_id)
  where razorpay_order_id is not null;

create index if not exists idx_order_headers_access_token
  on order_headers (order_number, access_token);

-- Seed known storefront coupon so server can validate (replaces client-only AKMCARE10 authority)
insert into coupons (code, description, discount_type, discount_value, min_purchase, is_active)
values ('AKMCARE10', 'AKM Care 10% off', 'percentage', 10, 0, true)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Drop insecure order / payment / shipping / status policies
-- ---------------------------------------------------------------------------
drop policy if exists "order_headers_select_own" on order_headers;
drop policy if exists "order_headers_insert_public" on order_headers;
drop policy if exists "order_items_select_via_order" on order_items;
drop policy if exists "order_items_insert_public" on order_items;
drop policy if exists "payments_select_own" on payments;
drop policy if exists "payments_insert_public" on payments;
drop policy if exists "shipping_select_own" on shipping;
drop policy if exists "shipping_insert_public" on shipping;
drop policy if exists "order_status_select_own" on order_status;
drop policy if exists "order_status_insert_public" on order_status;

-- Authenticated customers may only read their own orders (never guest null user_id via PostgREST)
create policy "order_headers_select_own" on order_headers
  for select using (auth.uid() is not null and auth.uid() = user_id);

create policy "order_items_select_own" on order_items
  for select using (
    exists (
      select 1 from order_headers oh
      where oh.id = order_id and oh.user_id = auth.uid()
    )
  );

create policy "payments_select_own" on payments
  for select using (
    exists (
      select 1 from order_headers oh
      where oh.id = order_id and oh.user_id = auth.uid()
    )
  );

create policy "shipping_select_own" on shipping
  for select using (
    exists (
      select 1 from order_headers oh
      where oh.id = order_id and oh.user_id = auth.uid()
    )
  );

create policy "order_status_select_own" on order_status
  for select using (
    exists (
      select 1 from order_headers oh
      where oh.id = order_id and oh.user_id = auth.uid()
    )
  );

-- No public INSERT/UPDATE/DELETE on these tables.
-- Admin policies (admin_read_orders / admin_manage_*) remain from admin_portal migration.
-- Service role bypasses RLS for Edge Functions.

-- ---------------------------------------------------------------------------
-- Legacy orders table: remove public insert (C1)
-- ---------------------------------------------------------------------------
drop policy if exists "public_insert_orders" on orders;

drop policy if exists "admin_read_legacy_orders" on orders;
create policy "admin_read_legacy_orders" on orders
  for select using (public.is_admin_user());

drop policy if exists "admin_manage_legacy_orders" on orders;
create policy "admin_manage_legacy_orders" on orders
  for all using (public.is_admin_user()) with check (public.is_admin_user());

-- Stock movements: stop world-writable inserts
drop policy if exists "service_insert_stock_movements" on stock_movements;
drop policy if exists "public_insert_stock_movements" on stock_movements;
drop policy if exists "admin_read_stock_movements" on stock_movements;
create policy "admin_read_stock_movements" on stock_movements
  for select using (public.is_admin_user());
-- inserts only via service role (no policy = denied for anon/authenticated)

-- ---------------------------------------------------------------------------
-- Cart / wishlist: drop world-open policies; auth user only (C3)
-- Guests keep carts/wishlists in localStorage only.
-- ---------------------------------------------------------------------------
drop policy if exists "public_read_cart_items" on cart_items;
drop policy if exists "public_insert_cart_items" on cart_items;
drop policy if exists "public_update_cart_items" on cart_items;
drop policy if exists "public_delete_cart_items" on cart_items;
drop policy if exists "cart_items_select_own" on cart_items;
drop policy if exists "cart_items_write_own" on cart_items;

create policy "cart_items_select_own" on cart_items
  for select using (auth.uid() is not null and auth.uid() = user_id);

create policy "cart_items_insert_own" on cart_items
  for insert with check (auth.uid() is not null and auth.uid() = user_id);

create policy "cart_items_update_own" on cart_items
  for update using (auth.uid() is not null and auth.uid() = user_id)
  with check (auth.uid() is not null and auth.uid() = user_id);

create policy "cart_items_delete_own" on cart_items
  for delete using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "public_read_wishlists" on wishlists;
drop policy if exists "public_insert_wishlists" on wishlists;
drop policy if exists "public_delete_wishlists" on wishlists;
drop policy if exists "wishlists_own" on wishlists;

create policy "wishlists_select_own" on wishlists
  for select using (auth.uid() is not null and auth.uid() = user_id);

create policy "wishlists_insert_own" on wishlists
  for insert with check (auth.uid() is not null and auth.uid() = user_id);

create policy "wishlists_delete_own" on wishlists
  for delete using (auth.uid() is not null and auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Secure guest/authenticated order receipt lookup (C2)
-- ---------------------------------------------------------------------------
create or replace function public.get_order_receipt(p_order_number text, p_access_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  hdr order_headers%rowtype;
  items jsonb;
  payment jsonb;
  ship jsonb;
begin
  if p_order_number is null or length(trim(p_order_number)) = 0 or p_access_token is null then
    return null;
  end if;

  select * into hdr
  from order_headers
  where order_number = p_order_number
    and access_token = p_access_token
  limit 1;

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(to_jsonb(oi) order by oi.created_at), '[]'::jsonb)
    into items
  from order_items oi
  where oi.order_id = hdr.id;

  select to_jsonb(p) into payment
  from payments p
  where p.order_id = hdr.id
  order by p.created_at desc
  limit 1;

  select to_jsonb(s) into ship
  from shipping s
  where s.order_id = hdr.id
  order by s.created_at desc
  limit 1;

  return jsonb_build_object(
    'order', to_jsonb(hdr),
    'items', items,
    'payment', payment,
    'shipping', ship
  );
end;
$$;

revoke all on function public.get_order_receipt(text, uuid) from public;
grant execute on function public.get_order_receipt(text, uuid) to anon, authenticated;
