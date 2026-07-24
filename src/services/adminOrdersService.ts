import { getSupabaseClient } from "@/lib/supabaseClient";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export async function listAdminOrders(opts?: { q?: string; status?: string }) {
  const client = getSupabaseClient();
  if (!client) return [];
  let q = client
    .from("order_headers")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (opts?.status && opts.status !== "all") q = q.eq("status", opts.status);
  if (opts?.q?.trim()) {
    const s = opts.q.trim();
    q = q.or(`order_number.ilike.%${s}%,customer_email.ilike.%${s}%,customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%`);
  }
  const { data, error } = await q;
  if (error) {
    // Fallback if some columns missing
    const fallback = await client.from("order_headers").select("*").order("created_at", { ascending: false }).limit(300);
    if (fallback.error) throw error;
    return fallback.data || [];
  }
  return data || [];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const { error } = await client
    .from("order_headers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw error;
  await client.from("order_status").insert({
    order_id: orderId,
    status,
    note: `Status set to ${status} by admin`,
  });
}

export async function listCustomers(opts?: { q?: string }) {
  const client = getSupabaseClient();
  if (!client) return [];
  let q = client.from("profiles").select("*").order("created_at", { ascending: false }).limit(300);
  if (opts?.q?.trim()) {
    const s = opts.q.trim();
    q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function setCustomerBlocked(userId: string, is_blocked: boolean) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const { error } = await client.from("profiles").update({ is_blocked }).eq("id", userId);
  if (error) throw error;
}

export async function getCustomerOrders(userId: string) {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("order_headers")
    .select("id, order_number, status, grand_total, created_at, payment_status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
