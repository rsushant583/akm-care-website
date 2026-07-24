-- Ensure admin helper functions are callable by authenticated sessions
grant execute on function public.is_admin_user() to authenticated, anon;
grant execute on function public.admin_has_role(text[]) to authenticated, anon;
