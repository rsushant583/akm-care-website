-- Add "Policy Formation" to Supabase `services` if it is missing.
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once (skips when title already exists).

insert into public.services (title, description, category, icon, display_order, is_active)
select
  'Policy Formation',
  'Structured HR, industrial, and corporate policy design—handbooks, SOPs, code of conduct, and governance frameworks tailored to your organization.',
  'compliance',
  'FileText',
  coalesce((select max(display_order) from public.services), 0) + 1,
  true
where not exists (
  select 1 from public.services where lower(trim(title)) = lower(trim('Policy Formation'))
);

-- Optional: set a fixed position after "Industrial Compliance Consulting" (adjust titles to match your rows):
-- update public.services set display_order = display_order + 1 where display_order >= 4;
-- update public.services set display_order = 4 where title = 'Policy Formation';
