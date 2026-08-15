-- Phase 9.1: lock sensitive profile columns for non-admin clients.
-- Does not replace existing RLS policies or change row ownership.
-- Admin/super_admin can still update other customers (e.g. is_blocked).
-- handle_new_user email sync remains allowed when the new email matches auth.users.

create or replace function public.enforce_profile_column_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_privileged boolean;
  auth_email text;
begin
  is_privileged := public.admin_has_role(array['admin', 'super_admin']);

  if tg_op = 'INSERT' then
    if not is_privileged then
      new.role := coalesce(new.role, 'customer');
      if new.role is distinct from 'customer' then
        raise exception 'This profile field cannot be updated.';
      end if;
      new.is_blocked := coalesce(new.is_blocked, false);
      if new.is_blocked is distinct from false then
        raise exception 'This profile field cannot be updated.';
      end if;
    end if;
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'This profile field cannot be updated.';
  end if;

  if is_privileged then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.is_blocked is distinct from old.is_blocked
     or new.created_at is distinct from old.created_at
     or new.avatar_url is distinct from old.avatar_url then
    raise exception 'This profile field cannot be updated.';
  end if;

  if new.email is distinct from old.email then
    select u.email into auth_email from auth.users u where u.id = new.id;
    if new.email is distinct from auth_email then
      raise exception 'This profile field cannot be updated.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_column_guard() from public, anon, authenticated;

drop trigger if exists trg_profiles_column_guard on public.profiles;
create trigger trg_profiles_column_guard
  before insert or update on public.profiles
  for each row
  execute function public.enforce_profile_column_guard();

-- Guest receipt RPC: keep the same lookup, omit secrets from the payload.
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
    'order', (to_jsonb(hdr) - 'access_token'),
    'items', items,
    'payment', case
      when payment is null then null
      else payment - 'raw_response' - 'razorpay_signature'
    end,
    'shipping', ship
  );
end;
$$;

revoke all on function public.get_order_receipt(text, uuid) from public;
grant execute on function public.get_order_receipt(text, uuid) to anon, authenticated;
