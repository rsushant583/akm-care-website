import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

const missingEnvWarning =
  "Supabase env vars are missing. Falling back to local data.";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export function getSupabaseClient() {
  if (!supabase) {
    console.warn(missingEnvWarning);
  }
  return supabase;
}

export function getSupabaseAdminClient() {
  if (!supabaseAdmin) {
    console.warn("Supabase admin client unavailable. Check service key.");
  }
  return supabaseAdmin;
}
