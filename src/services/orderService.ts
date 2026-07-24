import { getSupabaseClient } from "@/lib/supabaseClient";
import type { CartLineItem } from "@/lib/ecommerce/types";
import { calcCartTotals } from "@/lib/ecommerce/pricing";

export type OrderHeader = {
  id: string;
  order_number: string;
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

export type CreateOrderInput = {
  userId?: string | null;
  customer: { name: string; email: string; phone?: string };
  address: Record<string, unknown>;
  items: CartLineItem[];
  shippingMethod: string;
  shippingTotal: number;
  couponCode?: string;
  couponDiscount?: number;
  notes?: string;
};

function orderNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return `AKM${stamp}${rand}`;
}

export async function createPendingOrder(input: CreateOrderInput): Promise<OrderHeader> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");

  const totals = calcCartTotals(input.items, {
    shippingEstimate: input.shippingTotal,
    couponDiscount: input.couponDiscount ?? 0,
  });

  const header = {
    order_number: orderNumber(),
    user_id: input.userId || null,
    customer_name: input.customer.name,
    customer_email: input.customer.email,
    customer_phone: input.customer.phone || null,
    shipping_address: input.address,
    subtotal: totals.subtotal,
    gst_total: totals.gstTotal,
    shipping_total: input.shippingTotal,
    discount_total: input.couponDiscount ?? 0,
    coupon_code: input.couponCode || null,
    grand_total: totals.orderTotal,
    currency: "INR",
    status: "pending",
    payment_status: "pending",
    shipping_method: input.shippingMethod,
    notes: input.notes || null,
  };

  const { data: order, error } = await client.from("order_headers").insert(header).select("*").single();
  if (error) throw error;

  const lines = input.items.map((line) => ({
    order_id: order.id,
    product_id: line.productId,
    product_name: line.name,
    sku: line.sku,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    mrp: line.mrp,
    gst_percent: line.gstPercent,
    line_total: line.unitPrice * line.quantity,
    color_name: line.colorName || null,
    variant_name: line.variantName || null,
    image_url: line.image || null,
  }));

  const { error: itemsError } = await client.from("order_items").insert(lines);
  if (itemsError) throw itemsError;

  await client.from("order_status").insert({ order_id: order.id, status: "pending", note: "Order created" });
  await client.from("shipping").insert({
    order_id: order.id,
    method: input.shippingMethod,
    status: "pending",
    estimated_days: input.shippingMethod === "express" ? 2 : 5,
  });

  return order as OrderHeader;
}

export async function attachPayment(params: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amount: number;
  method?: string;
  status?: string;
}) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");

  const { error } = await client.from("payments").insert({
    order_id: params.orderId,
    provider: "razorpay",
    razorpay_order_id: params.razorpayOrderId,
    razorpay_payment_id: params.razorpayPaymentId,
    razorpay_signature: params.razorpaySignature,
    amount: params.amount,
    method: params.method || null,
    status: params.status || "captured",
  });
  if (error) throw error;

  await client
    .from("order_headers")
    .update({
      status: "paid",
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.orderId);

  await client.from("order_status").insert({
    order_id: params.orderId,
    status: "paid",
    note: "Payment captured via Razorpay",
  });
}

export async function markOrderFailed(orderId: string, note?: string) {
  const client = getSupabaseClient();
  if (!client) return;
  await client
    .from("order_headers")
    .update({ status: "failed", payment_status: "failed", updated_at: new Date().toISOString() })
    .eq("id", orderId);
  await client.from("order_status").insert({
    order_id: orderId,
    status: "failed",
    note: note || "Payment failed",
  });
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

export async function getOrderByNumber(orderNumber: string) {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data: order, error } = await client
    .from("order_headers")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw error;
  if (!order) return null;
  return getOrderById(order.id);
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
