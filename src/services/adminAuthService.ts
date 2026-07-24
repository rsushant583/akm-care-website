import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabaseClient";

export type AdminRole = "super_admin" | "admin" | "staff";

export type AdminUser = {
  user_id: string;
  role: AdminRole;
  full_name: string | null;
  is_active: boolean;
};

export async function fetchAdminProfile(userId: string): Promise<AdminUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("admin_users")
    .select("user_id, role, full_name, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data as AdminUser | null;
}

export async function adminSignIn(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) return { user: null as User | null, admin: null as AdminUser | null, error: "Supabase not configured" };
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { user: null, admin: null, error: error.message };
  const admin = await fetchAdminProfile(data.user.id);
  if (!admin) {
    await client.auth.signOut();
    return { user: null, admin: null, error: "This account is not authorized for admin access." };
  }
  return { user: data.user, admin, error: null };
}

export async function adminSignOut() {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}

export function canManageStaff(role: AdminRole) {
  return role === "super_admin";
}

export function canWriteCatalog(role: AdminRole) {
  return role === "super_admin" || role === "admin" || role === "staff";
}

export function canManageSettings(role: AdminRole) {
  return role === "super_admin" || role === "admin";
}
