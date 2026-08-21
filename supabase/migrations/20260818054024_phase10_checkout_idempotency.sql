-- Phase 10: server-side checkout attempt idempotency.
-- Additive only. Does not backfill, rewrite historical orders, or change RLS.

alter table public.order_headers
  add column if not exists checkout_idempotency_key text;

create unique index if not exists idx_order_headers_checkout_idempotency
  on public.order_headers (checkout_idempotency_key)
  where checkout_idempotency_key is not null
    and payment_status in ('pending', 'created', 'paid');
