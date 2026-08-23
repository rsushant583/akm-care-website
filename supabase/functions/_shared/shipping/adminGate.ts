import type { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";
import { json } from "../http.ts";
import { serviceClient } from "../adminAuth.ts";

export type AdminManager = {
  user: User;
  role: "admin" | "super_admin";
};

/** JWT + active admin/super_admin only (staff denied for shipping mutations). */
export async function requireShippingAdmin(
  req: Request,
  service: SupabaseClient = serviceClient(),
): Promise<{ ok: true; admin: AdminManager } | { ok: false; response: Response }> {
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
    .select("user_id, role, is_active")
    .eq("user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (adminError || !admin) {
    return { ok: false, response: json(req, 403, { success: false, error: "Not authorized." }) };
  }
  const role = String(admin.role || "");
  if (role !== "admin" && role !== "super_admin") {
    return {
      ok: false,
      response: json(req, 403, { success: false, error: "Staff can view orders but cannot mutate shipping." }),
    };
  }
  return { ok: true, admin: { user: data.user, role: role as "admin" | "super_admin" } };
}

export function createShiprocketFromEnv() {
  const enabled = String(Deno.env.get("SHIPPING_PROVIDER_ENABLED") || "false").toLowerCase() === "true";
  const email = Deno.env.get("SHIPROCKET_EMAIL") || "";
  const password = Deno.env.get("SHIPROCKET_PASSWORD") || "";
  const pickup = Deno.env.get("SHIPROCKET_PICKUP_LOCATION") || "";
  return { enabled, email, password, pickup };
}
