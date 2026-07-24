import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const missingEnvWarning =
  "Supabase env vars are missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Falling back to local data.";

/**
 * Browser Supabase client — anon key only.
 * Admin mutations rely on the signed-in user JWT + RLS (`admin_users` / `is_admin_user()`).
 * Never initialize a service-role client in frontend code.
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function getSupabaseClient() {
  if (!supabase) {
    console.warn(missingEnvWarning);
  }
  return supabase;
}
