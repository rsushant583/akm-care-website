-- Phase 5.6: enable Supabase Realtime on order_headers for admin live notifications.
-- Additive. Does not change RLS, payments, or order state machine.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'order_headers'
  ) then
    execute 'alter publication supabase_realtime add table public.order_headers';
  end if;
end $$;
