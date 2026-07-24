-- Optional: promote an existing auth user to Super Admin.
-- Replace the email below with your staff login, then run:
--   npx supabase db query --linked -f supabase/seed_admin.sql

insert into public.admin_users (user_id, role, full_name, is_active)
select u.id, 'super_admin', coalesce(u.raw_user_meta_data->>'full_name', u.email), true
from auth.users u
where lower(u.email) = lower('admin@akmcare.com')
on conflict (user_id) do update
set role = excluded.role,
    is_active = true,
    updated_at = now();
