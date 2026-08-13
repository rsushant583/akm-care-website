import { getSupabaseClient } from "@/lib/supabaseClient";
import { canManageOrders, type AdminRole } from "@/services/adminAuthService";

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

export const PAYMENT_STATUSES = ["pending", "created", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ADMIN_ORDER_LIST_LIMIT = 300;

const HEADER_LIST_COLUMNS = [
  "id",
  "order_number",
  "customer_name",
  "customer_email",
  "customer_phone",
  "subtotal",
  "gst_total",
  "shipping_total",
  "discount_total",
  "coupon_code",
  "grand_total",
  "currency",
  "status",
  "payment_status",
  "shipping_method",
  "created_at",
  "updated_at",
  "razorpay_order_id",
].join(",");

const ITEM_COLUMNS = "id,product_id,product_name,sku,quantity,unit_price,line_total,color_name,variant_name,image_url,gst_percent";

export type AdminOrderItem = {
  id: string;
  product_id?: string | null;
  product_name: string;
  sku?: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  color_name?: string | null;
  variant_name?: string | null;
  image_url?: string | null;
  gst_percent?: number | null;
};

export type AdminOrderListRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  subtotal?: number;
  gst_total?: number;
  shipping_total?: number;
  discount_total?: number;
  coupon_code?: string | null;
  grand_total: number;
  currency?: string;
  status: string;
  payment_status: string;
  shipping_method?: string | null;
  created_at: string;
  updated_at?: string;
  razorpay_order_id?: string | null;
  order_items?: AdminOrderItem[];
};

export type AdminOrderDetail = AdminOrderListRow & {
  notes?: string | null;
  shipping_address?: Record<string, unknown> | null;
  payment: {
    provider: string | null;
    status: string | null;
    amount: number | null;
    method: string | null;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    created_at?: string | null;
  } | null;
  shipping: {
    method: string | null;
    status: string | null;
    carrier: string | null;
    tracking_number: string | null;
    estimated_days: number | null;
    shipped_at: string | null;
    delivered_at: string | null;
  } | null;
  timeline: Array<{ id: string; status: string; note: string | null; created_at: string }>;
};

export type ListAdminOrdersOpts = {
  q?: string;
  status?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
};

export async function listAdminOrders(opts?: ListAdminOrdersOpts): Promise<AdminOrderListRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  let q = client
    .from("order_headers")
    .select(`${HEADER_LIST_COLUMNS}, order_items(${ITEM_COLUMNS})`)
    .order("created_at", { ascending: false })
    .limit(ADMIN_ORDER_LIST_LIMIT);
  if (opts?.status && opts.status !== "all") q = q.eq("status", opts.status);
  if (opts?.paymentStatus && opts.paymentStatus !== "all") q = q.eq("payment_status", opts.paymentStatus);
  if (opts?.from) q = q.gte("created_at", `${opts.from}T00:00:00.000Z`);
  if (opts?.to) q = q.lte("created_at", `${opts.to}T23:59:59.999Z`);
  if (opts?.q?.trim()) {
    const s = opts.q.trim().replace(/,/g, " ");
    q = q.or(
      `order_number.ilike.%${s}%,customer_email.ilike.%${s}%,customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%`,
    );
  }
  const { data, error } = await q;
  if (error) {
    const fallback = await client
      .from("order_headers")
      .select(HEADER_LIST_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(ADMIN_ORDER_LIST_LIMIT);
    if (fallback.error) throw error;
    return (fallback.data || []) as AdminOrderListRow[];
  }
  return (data || []) as AdminOrderListRow[];
}

export async function getAdminOrderById(orderId: string): Promise<AdminOrderListRow | null> {
  const client = getSupabaseClient();
  if (!client || !orderId) return null;
  const { data, error } = await client
    .from("order_headers")
    .select(`${HEADER_LIST_COLUMNS}, order_items(${ITEM_COLUMNS})`)
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  return (data as AdminOrderListRow | null) ?? null;
}

export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const client = getSupabaseClient();
  if (!client || !orderId) return null;

  const { data: header, error } = await client
    .from("order_headers")
    .select(
      `${HEADER_LIST_COLUMNS},notes,shipping_address, order_items(${ITEM_COLUMNS})`,
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!header) return null;

  const [payRes, shipRes, histRes] = await Promise.all([
    client
      .from("payments")
      .select("provider,status,amount,method,razorpay_order_id,razorpay_payment_id,created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("shipping")
      .select("method,status,carrier,tracking_number,estimated_days,shipped_at,delivered_at")
      .eq("order_id", orderId)
      .maybeSingle(),
    client
      .from("order_status")
      .select("id,status,note,created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
  ]);

  const row = header as AdminOrderListRow & {
    notes?: string | null;
    shipping_address?: Record<string, unknown> | null;
  };

  return {
    ...row,
    payment: payRes.data
      ? {
          provider: payRes.data.provider ?? null,
          status: payRes.data.status ?? null,
          amount: payRes.data.amount != null ? Number(payRes.data.amount) : null,
          method: payRes.data.method ?? null,
          razorpay_order_id: payRes.data.razorpay_order_id ?? null,
          razorpay_payment_id: payRes.data.razorpay_payment_id ?? null,
          created_at: payRes.data.created_at ?? null,
        }
      : null,
    shipping: shipRes.data
      ? {
          method: shipRes.data.method ?? null,
          status: shipRes.data.status ?? null,
          carrier: shipRes.data.carrier ?? null,
          tracking_number: shipRes.data.tracking_number ?? null,
          estimated_days: shipRes.data.estimated_days ?? null,
          shipped_at: shipRes.data.shipped_at ?? null,
          delivered_at: shipRes.data.delivered_at ?? null,
        }
      : null,
    timeline: (histRes.data || []) as AdminOrderDetail["timeline"],
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, role?: AdminRole | null) {
  if (role && !canManageOrders(role)) {
    throw new Error("Staff can view orders but cannot change fulfillment status.");
  }
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
