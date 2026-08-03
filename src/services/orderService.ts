import { getSupabaseClient } from "@/lib/supabaseClient";

export type OrderHeader = {
  id: string;
  order_number: string;
  access_token?: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: Record<string, unknown>;
  subtotal: number;
  gst_total: number;
  shipping_total: number;
  discount_total: number;
  coupon_code: string | null;
  grand_total: number;
  status: string;
  payment_status: string;
  shipping_method: string | null;
  created_at: string;
};

export type OrderReceipt = {
  order: OrderHeader;
  items: Array<Record<string, unknown>>;
  payment: Record<string, unknown> | null;
  shipping: Record<string, unknown> | null;
};

/** @deprecated Client inserts removed — orders are created by razorpay-create-order Edge Function. */
export async function createPendingOrder(): Promise<never> {
  throw new Error("Orders must be created via secure checkout Edge Function");
}

/** @deprecated Payment rows are written by razorpay-verify-payment Edge Function. */
export async function attachPayment(): Promise<never> {
  throw new Error("Payments must be attached via secure verify Edge Function");
}

export async function markOrderFailed(orderId: string, accessToken: string, note?: string) {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkout-mark-failed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      orderHeaderId: orderId,
      accessToken,
      note: note || "Payment failed",
    }),
  });
  return response.json();
}

export async function getOrderById(orderId: string) {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data: order, error } = await client.from("order_headers").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order) return null;
  const { data: items } = await client.from("order_items").select("*").eq("order_id", orderId);
  const { data: payment } = await client.from("payments").select("*").eq("order_id", orderId).maybeSingle();
  const { data: ship } = await client.from("shipping").select("*").eq("order_id", orderId).maybeSingle();
  return { order: order as OrderHeader, items: items || [], payment, shipping: ship };
}

/** Secure receipt lookup — requires access_token from checkout response (C2). */
export async function getOrderReceipt(orderNumber: string, accessToken: string): Promise<OrderReceipt | null> {
  const client = getSupabaseClient();
  if (!client || !orderNumber || !accessToken) return null;
  const { data, error } = await client.rpc("get_order_receipt", {
    p_order_number: orderNumber,
    p_access_token: accessToken,
  });
  if (error) throw error;
  if (!data) return null;
  return data as OrderReceipt;
}

/** @deprecated Use getOrderReceipt(orderNumber, accessToken). */
export async function getOrderByNumber(_orderNumber: string) {
  return null;
}

export async function listOrdersForUser(userId: string): Promise<OrderHeader[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("order_headers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as OrderHeader[];
}
