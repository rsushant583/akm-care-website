-- Phase 5.5: payment idempotency, stock/coupon holds, order transitions, admin RBAC.
-- Additive and non-destructive. Service-role Edge Functions remain the money path.

-- ---------------------------------------------------------------------------
-- Order hold / notification flags
-- ---------------------------------------------------------------------------
alter table public.order_headers
  add column if not exists stock_reserved boolean not null default false;

alter table public.order_headers
  add column if not exists coupon_reserved boolean not null default false;

alter table public.order_headers
  add column if not exists fulfillment_notified_at timestamptz;

-- ---------------------------------------------------------------------------
-- Webhook idempotency
-- ---------------------------------------------------------------------------
create table if not exists public.processed_razorpay_events (
  event_id text primary key,
  event_type text not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  order_header_id uuid,
  processed_at timestamptz not null default now()
);

alter table public.processed_razorpay_events enable row level security;
-- No anon/authenticated policies: service role only.

-- ---------------------------------------------------------------------------
-- Atomic stock reserve / release (service_role only)
-- ---------------------------------------------------------------------------
create or replace function public.reserve_product_stock(p_product_id uuid, p_qty integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  prev int;
  next_qty int;
begin
  if p_product_id is null or p_qty is null or p_qty < 1 then
    return jsonb_build_object('ok', false, 'error', 'invalid stock reserve');
  end if;

  update public.products
  set
    stock_quantity = stock_quantity - p_qty,
    status = case when stock_quantity - p_qty <= 0 then 'sold_out' else coalesce(status, 'available') end
  where id = p_product_id
    and coalesce(stock_quantity, 0) >= p_qty
  returning (stock_quantity + p_qty), stock_quantity into prev, next_qty;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'insufficient stock');
  end if;

  return jsonb_build_object('ok', true, 'previous_stock', prev, 'new_stock', next_qty);
end;
$$;

create or replace function public.release_product_stock(p_product_id uuid, p_qty integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  next_qty int;
begin
  if p_product_id is null or p_qty is null or p_qty < 1 then
    return jsonb_build_object('ok', false, 'error', 'invalid stock release');
  end if;

  update public.products
  set
    stock_quantity = stock_quantity + p_qty,
    status = case when stock_quantity + p_qty > 0 then 'available' else status end
  where id = p_product_id
  returning stock_quantity into next_qty;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'product missing');
  end if;

  return jsonb_build_object('ok', true, 'new_stock', next_qty);
end;
$$;

create or replace function public.reserve_coupon_usage(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count int;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'missing coupon');
  end if;

  update public.coupons
  set used_count = used_count + 1, updated_at = now()
  where upper(code) = upper(trim(p_code))
    and is_active = true
    and (usage_limit is null or used_count < usage_limit)
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at > now())
  returning used_count into next_count;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'coupon unavailable');
  end if;

  return jsonb_build_object('ok', true, 'used_count', next_count);
end;
$$;

create or replace function public.release_coupon_usage(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return jsonb_build_object('ok', true);
  end if;

  update public.coupons
  set used_count = greatest(0, used_count - 1), updated_at = now()
  where upper(code) = upper(trim(p_code));

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.reserve_product_stock(uuid, integer) from public, anon, authenticated;
revoke all on function public.release_product_stock(uuid, integer) from public, anon, authenticated;
revoke all on function public.reserve_coupon_usage(text) from public, anon, authenticated;
revoke all on function public.release_coupon_usage(text) from public, anon, authenticated;
grant execute on function public.reserve_product_stock(uuid, integer) to service_role;
grant execute on function public.release_product_stock(uuid, integer) to service_role;
grant execute on function public.reserve_coupon_usage(text) to service_role;
grant execute on function public.release_coupon_usage(text) to service_role;

-- Ops helper: release unpaid holds older than 45 minutes (call via service role / SQL editor).
create or replace function public.release_stale_checkout_holds(p_max_age interval default interval '45 minutes')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  released int := 0;
  line record;
begin
  for rec in
    select *
    from public.order_headers
    where payment_status is distinct from 'paid'
      and (stock_reserved = true or coupon_reserved = true)
      and created_at < now() - p_max_age
  loop
    if rec.stock_reserved then
      for line in select product_id, quantity from public.order_items where order_id = rec.id
      loop
        perform public.release_product_stock(line.product_id, line.quantity);
      end loop;
    end if;
    if rec.coupon_reserved and rec.coupon_code is not null then
      perform public.release_coupon_usage(rec.coupon_code);
    end if;
    update public.order_headers
    set stock_reserved = false,
        coupon_reserved = false,
        status = case when status = 'pending' then 'failed' else status end,
        payment_status = case when payment_status in ('pending', 'created') then 'failed' else payment_status end,
        updated_at = now()
    where id = rec.id
      and payment_status is distinct from 'paid';
    released := released + 1;
  end loop;
  return released;
end;
$$;

revoke all on function public.release_stale_checkout_holds(interval) from public, anon, authenticated;
grant execute on function public.release_stale_checkout_holds(interval) to service_role;

-- ---------------------------------------------------------------------------
-- Order status machine (blocks clearly invalid transitions)
-- ---------------------------------------------------------------------------
create or replace function public.order_status_transition_allowed(old_status text, new_status text)
returns boolean
language plpgsql
immutable
as $$
begin
  if old_status is not distinct from new_status then
    return true;
  end if;
  if old_status is null then
    return true;
  end if;

  return case old_status
    when 'pending' then new_status in ('confirmed', 'paid', 'cancelled', 'failed')
    when 'failed' then new_status in ('confirmed', 'paid', 'cancelled') -- webhook may win after dismiss
    when 'paid' then new_status in ('confirmed', 'packed', 'shipped', 'cancelled', 'refunded')
    when 'confirmed' then new_status in ('packed', 'shipped', 'cancelled')
    when 'packed' then new_status in ('shipped', 'cancelled')
    when 'shipped' then new_status in ('out_for_delivery', 'delivered', 'cancelled')
    when 'out_for_delivery' then new_status in ('delivered')
    when 'delivered' then new_status in ('returned')
    when 'cancelled' then new_status in ('confirmed', 'paid', 'refunded') -- paid webhook after cancel
    when 'returned' then new_status in ('refunded')
    when 'refunded' then false
    else new_status in ('confirmed', 'cancelled', 'failed')
  end;
end;
$$;

create or replace function public.enforce_order_header_transitions()
returns trigger
language plpgsql
as $$
begin
  if old.payment_status = 'paid'
     and new.payment_status is distinct from old.payment_status
     and new.payment_status not in ('paid', 'refunded') then
    raise exception 'Cannot change paid payment status to %', new.payment_status;
  end if;

  if not public.order_status_transition_allowed(old.status, new.status) then
    raise exception 'Invalid order status transition: % → %', old.status, new.status;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_order_headers_transitions on public.order_headers;
create trigger trg_order_headers_transitions
  before update of status, payment_status on public.order_headers
  for each row
  execute function public.enforce_order_header_transitions();

-- ---------------------------------------------------------------------------
-- H9: split staff vs admin vs super_admin writes (SELECT stays for all admins)
-- ---------------------------------------------------------------------------

-- site_settings: staff may read (public already); write admin+super only
drop policy if exists "admin_manage_settings" on public.site_settings;
create policy "admin_write_settings" on public.site_settings
  for insert with check (public.admin_has_role(array['admin', 'super_admin']));
create policy "admin_update_settings" on public.site_settings
  for update using (public.admin_has_role(array['admin', 'super_admin']))
  with check (public.admin_has_role(array['admin', 'super_admin']));
create policy "admin_delete_settings" on public.site_settings
  for delete using (public.admin_has_role(array['admin', 'super_admin']));

-- coupons: write admin+super; staff keep select via public_read + extra admin select
drop policy if exists "admin_manage_coupons" on public.coupons;
create policy "admin_select_coupons" on public.coupons
  for select using (public.is_admin_user());
create policy "admin_write_coupons" on public.coupons
  for all using (public.admin_has_role(array['admin', 'super_admin']))
  with check (public.admin_has_role(array['admin', 'super_admin']));

-- order_headers: staff read-only; admin+super can update fulfillment status
drop policy if exists "admin_read_orders" on public.order_headers;
create policy "admin_select_orders" on public.order_headers
  for select using (public.is_admin_user());
create policy "admin_update_orders" on public.order_headers
  for update using (public.admin_has_role(array['admin', 'super_admin']))
  with check (public.admin_has_role(array['admin', 'super_admin']));

drop policy if exists "admin_read_order_items" on public.order_items;
create policy "admin_select_order_items" on public.order_items
  for select using (public.is_admin_user());

drop policy if exists "admin_read_payments" on public.payments;
create policy "admin_select_payments" on public.payments
  for select using (public.is_admin_user());

drop policy if exists "admin_manage_shipping" on public.shipping;
create policy "admin_select_shipping" on public.shipping
  for select using (public.is_admin_user());
create policy "admin_update_shipping" on public.shipping
  for all using (public.admin_has_role(array['admin', 'super_admin']))
  with check (public.admin_has_role(array['admin', 'super_admin']));

drop policy if exists "admin_manage_order_status" on public.order_status;
create policy "admin_select_order_status_hist" on public.order_status
  for select using (public.is_admin_user());
create policy "admin_insert_order_status_hist" on public.order_status
  for insert with check (public.admin_has_role(array['admin', 'super_admin']));

drop policy if exists "admin_manage_legacy_orders" on public.orders;
drop policy if exists "admin_read_legacy_orders" on public.orders;
create policy "admin_select_legacy_orders" on public.orders
  for select using (public.is_admin_user());
create policy "admin_update_legacy_orders" on public.orders
  for update using (public.admin_has_role(array['admin', 'super_admin']))
  with check (public.admin_has_role(array['admin', 'super_admin']));

-- profiles: staff can view customers; only admin+super can block/update others
drop policy if exists "admin_update_profiles" on public.profiles;
create policy "admin_update_profiles" on public.profiles
  for update using (
    auth.uid() = id
    or public.admin_has_role(array['admin', 'super_admin'])
  )
  with check (
    auth.uid() = id
    or public.admin_has_role(array['admin', 'super_admin'])
  );

-- inbox writes: admin+super; staff read
drop policy if exists "admin_read_inbox_contact" on public.contact_submissions;
create policy "admin_select_inbox_contact" on public.contact_submissions
  for select using (public.is_admin_user());
create policy "admin_write_inbox_contact" on public.contact_submissions
  for all using (public.admin_has_role(array['admin', 'super_admin']))
  with check (public.admin_has_role(array['admin', 'super_admin']));

drop policy if exists "admin_read_inbox_feedback" on public.feedback_submissions;
create policy "admin_select_inbox_feedback" on public.feedback_submissions
  for select using (public.is_admin_user());
create policy "admin_write_inbox_feedback" on public.feedback_submissions
  for all using (public.admin_has_role(array['admin', 'super_admin']))
  with check (public.admin_has_role(array['admin', 'super_admin']));

drop policy if exists "admin_read_inbox_interest" on public.product_interests;
create policy "admin_select_inbox_interest" on public.product_interests
  for select using (public.is_admin_user());
create policy "admin_write_inbox_interest" on public.product_interests
  for all using (public.admin_has_role(array['admin', 'super_admin']))
  with check (public.admin_has_role(array['admin', 'super_admin']));

drop policy if exists "admin_read_inbox_career" on public.career_applications;
create policy "admin_select_inbox_career" on public.career_applications
  for select using (public.is_admin_user());
create policy "admin_write_inbox_career" on public.career_applications
  for all using (public.admin_has_role(array['admin', 'super_admin']))
  with check (public.admin_has_role(array['admin', 'super_admin']));
