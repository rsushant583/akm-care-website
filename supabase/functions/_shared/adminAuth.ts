import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2";
import { json } from "./http.ts";

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireAdmin(req: Request, service: SupabaseClient): Promise<
  { ok: true; user: User } | { ok: false; response: Response }
> {
  const header = req.headers.get("Authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!token || token === anon) {
    return { ok: false, response: json(req, 401, { success: false, error: "Admin sign-in required." }) };
  }
  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, response: json(req, 401, { success: false, error: "Invalid or expired session." }) };
  }
  const { data: admin, error: adminError } = await service
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (adminError || !admin) {
    return { ok: false, response: json(req, 403, { success: false, error: "Not authorized for catalog import." }) };
  }
  return { ok: true, user: data.user };
}
