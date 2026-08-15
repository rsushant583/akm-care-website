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
  if (!client || !orderId) return null;
  const { data: auth } = await client.auth.getUser();
  if (!auth.user?.id) return null;
  const { data: order, error } = await client
    .from("order_headers")
    .select(
      "id,order_number,user_id,customer_name,customer_email,customer_phone,shipping_address,subtotal,gst_total,shipping_total,discount_total,coupon_code,grand_total,status,payment_status,shipping_method,created_at",
    )
    .eq("id", orderId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!order) return null;
  const { data: items } = await client
    .from("order_items")
    .select("id,product_id,product_name,sku,quantity,unit_price,line_total,image_url,color_name,variant_name")
    .eq("order_id", orderId);
  const { data: payment } = await client
    .from("payments")
    .select("provider,status,method,amount,razorpay_payment_id,razorpay_order_id")
    .eq("order_id", orderId)
    .maybeSingle();
  const { data: ship } = await client
    .from("shipping")
    .select("method,status,carrier,tracking_number,estimated_days")
    .eq("order_id", orderId)
    .maybeSingle();
  return { order: order as OrderHeader, items: items || [], payment, shipping: ship };
}

function redactReceipt(data: unknown): OrderReceipt | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as Record<string, unknown>;
  const orderRaw = raw.order && typeof raw.order === "object" ? { ...(raw.order as Record<string, unknown>) } : null;
  if (!orderRaw) return null;
  delete orderRaw.access_token;
  const paymentRaw =
    raw.payment && typeof raw.payment === "object" ? { ...(raw.payment as Record<string, unknown>) } : null;
  if (paymentRaw) {
    delete paymentRaw.raw_response;
    delete paymentRaw.razorpay_signature;
  }
  return {
    order: orderRaw as unknown as OrderHeader,
    items: Array.isArray(raw.items) ? (raw.items as Array<Record<string, unknown>>) : [],
    payment: paymentRaw,
    shipping: raw.shipping && typeof raw.shipping === "object" ? (raw.shipping as Record<string, unknown>) : null,
  };
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
  return redactReceipt(data);
}

/** @deprecated Use getOrderReceipt(orderNumber, accessToken). */
export async function getOrderByNumber(_orderNumber: string) {
  return null;
}

/** @deprecated Prefer listMyOrders() which binds to auth.getUser() and omits access_token. */
export async function listOrdersForUser(userId: string): Promise<OrderHeader[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data: auth } = await client.auth.getUser();
  if (!auth.user?.id || auth.user.id !== userId) return [];
  const { data, error } = await client
    .from("order_headers")
    .select(
      "id,order_number,user_id,customer_name,customer_email,customer_phone,subtotal,gst_total,shipping_total,discount_total,coupon_code,grand_total,status,payment_status,shipping_method,created_at",
    )
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as OrderHeader[];
}
