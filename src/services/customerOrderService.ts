import { getSupabaseClient } from "@/lib/supabaseClient";
import { getProductById } from "@/services/productService";
import { isProductInStock } from "@/lib/ecommerce/availability";
import type { CatalogProduct } from "@/lib/ecommerce/types";

/** Safe customer-facing order list row — no access_token. */
export type CustomerOrderListItem = {
  id: string;
  order_number: string;
  grand_total: number;
  status: string;
  payment_status: string;
  created_at: string;
  shipping_method: string | null;
  order_items: CustomerOrderItem[];
};

export type CustomerOrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  image_url: string | null;
  color_name: string | null;
  variant_name: string | null;
};

export type CustomerOrderDetail = {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: Record<string, unknown> | null;
  subtotal: number;
  gst_total: number;
  shipping_total: number;
  discount_total: number;
  coupon_code: string | null;
  grand_total: number;
  shipping_method: string | null;
  notes: string | null;
  items: CustomerOrderItem[];
  payment: {
    provider: string | null;
    status: string | null;
    method: string | null;
    amount: number | null;
    razorpay_payment_id: string | null;
    razorpay_order_id: string | null;
  } | null;
  shipping: {
    method: string | null;
    status: string | null;
    carrier: string | null;
    tracking_number: string | null;
    estimated_days: number | null;
  } | null;
  timeline: Array<{ id: string; status: string; note: string | null; created_at: string }>;
};

const LIST_SELECT = `
  id,
  order_number,
  grand_total,
  status,
  payment_status,
  created_at,
  shipping_method,
  order_items(
    id,
    product_id,
    product_name,
    sku,
    quantity,
    unit_price,
    line_total,
    image_url,
    color_name,
    variant_name
  )
`;

const HEADER_DETAIL_SELECT = `
  id,
  order_number,
  created_at,
  status,
  payment_status,
  customer_name,
  customer_email,
  customer_phone,
  shipping_address,
  subtotal,
  gst_total,
  shipping_total,
  discount_total,
  coupon_code,
  grand_total,
  shipping_method,
  notes,
  order_items(
    id,
    product_id,
    product_name,
    sku,
    quantity,
    unit_price,
    line_total,
    image_url,
    color_name,
    variant_name
  )
`;

async function requireAuthUserId(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user.id;
}

/** Lists orders for the signed-in user only (JWT + RLS). Never trusts a client-supplied userId. */
export async function listMyOrders(): Promise<CustomerOrderListItem[]> {
  const client = getSupabaseClient();
  const userId = await requireAuthUserId();
  if (!client || !userId) return [];

  const { data, error } = await client
    .from("order_headers")
    .select(LIST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data || []).map((row) => ({
    id: String(row.id),
    order_number: String(row.order_number),
    grand_total: Number(row.grand_total || 0),
    status: String(row.status || "pending"),
    payment_status: String(row.payment_status || "pending"),
    created_at: String(row.created_at),
    shipping_method: row.shipping_method ? String(row.shipping_method) : null,
    order_items: ((row.order_items as CustomerOrderItem[]) || []).map(normalizeItem),
  }));
}

function normalizeItem(it: Partial<CustomerOrderItem>): CustomerOrderItem {
  return {
    id: String(it.id),
    product_id: it.product_id ? String(it.product_id) : null,
    product_name: String(it.product_name || "Item"),
    sku: it.sku ? String(it.sku) : null,
    quantity: Number(it.quantity || 0),
    unit_price: Number(it.unit_price || 0),
    line_total: Number(it.line_total || 0),
    image_url: it.image_url ? String(it.image_url) : null,
    color_name: it.color_name ? String(it.color_name) : null,
    variant_name: it.variant_name ? String(it.variant_name) : null,
  };
}

/**
 * Auth-scoped order detail. Returns null if missing or not owned (RLS + explicit user_id filter).
 * Does not return access_token, signatures, or raw_response.
 */
export async function getMyOrderDetail(orderId: string): Promise<CustomerOrderDetail | null> {
  const client = getSupabaseClient();
  const userId = await requireAuthUserId();
  if (!client || !userId || !orderId) return null;

  const { data: header, error } = await client
    .from("order_headers")
    .select(HEADER_DETAIL_SELECT)
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!header) return null;

  const [payRes, shipRes, histRes] = await Promise.all([
    client
      .from("payments")
      .select("provider,status,method,amount,razorpay_payment_id,razorpay_order_id")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("shipping")
      .select("method,status,carrier,tracking_number,estimated_days")
      .eq("order_id", orderId)
      .maybeSingle(),
    client
      .from("order_status")
      .select("id,status,note,created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    id: String(header.id),
    order_number: String(header.order_number),
    created_at: String(header.created_at),
    status: String(header.status || "pending"),
    payment_status: String(header.payment_status || "pending"),
    customer_name: String(header.customer_name || ""),
    customer_email: String(header.customer_email || ""),
    customer_phone: header.customer_phone ? String(header.customer_phone) : null,
    shipping_address: (header.shipping_address as Record<string, unknown>) || null,
    subtotal: Number(header.subtotal || 0),
    gst_total: Number(header.gst_total || 0),
    shipping_total: Number(header.shipping_total || 0),
    discount_total: Number(header.discount_total || 0),
    coupon_code: header.coupon_code ? String(header.coupon_code) : null,
    grand_total: Number(header.grand_total || 0),
    shipping_method: header.shipping_method ? String(header.shipping_method) : null,
    notes: header.notes ? String(header.notes) : null,
    items: ((header.order_items as CustomerOrderItem[]) || []).map(normalizeItem),
    payment: payRes.data
      ? {
          provider: payRes.data.provider ?? null,
          status: payRes.data.status ?? null,
          method: payRes.data.method ?? null,
          amount: payRes.data.amount != null ? Number(payRes.data.amount) : null,
          razorpay_payment_id: payRes.data.razorpay_payment_id ?? null,
          razorpay_order_id: payRes.data.razorpay_order_id ?? null,
        }
      : null,
    shipping: shipRes.data
      ? {
          method: shipRes.data.method ?? null,
          status: shipRes.data.status ?? null,
          carrier: shipRes.data.carrier ?? null,
          tracking_number: shipRes.data.tracking_number ?? null,
          estimated_days: shipRes.data.estimated_days ?? null,
        }
      : null,
    timeline: (histRes.data || []) as CustomerOrderDetail["timeline"],
  };
}

export type ReorderResult = {
  added: Array<{ name: string; quantity: number }>;
  unavailable: Array<{ name: string; reason: string }>;
};

/**
 * Buy Again: load current catalog products (live price/stock), never historical prices.
 * Caller supplies CartContext.addToCart.
 */
export async function prepareReorder(
  orderId: string,
  addToCart: (payload: {
    product: CatalogProduct;
    quantity?: number;
    colorName?: string;
    variantName?: string;
  }) => void,
): Promise<ReorderResult> {
  const detail = await getMyOrderDetail(orderId);
  if (!detail) {
    return { added: [], unavailable: [{ name: "Order", reason: "Order not found or not accessible." }] };
  }

  const added: ReorderResult["added"] = [];
  const unavailable: ReorderResult["unavailable"] = [];

  for (const line of detail.items) {
    if (!line.product_id) {
      unavailable.push({ name: line.product_name, reason: "Product no longer linked." });
      continue;
    }
    const product = await getProductById(line.product_id).catch(() => null);
    if (!product) {
      unavailable.push({ name: line.product_name, reason: "Product is no longer available." });
      continue;
    }
    if (!isProductInStock(product)) {
      unavailable.push({ name: product.name, reason: "Currently out of stock." });
      continue;
    }
    const qty = Math.max(1, Math.min(line.quantity, product.stock_quantity || line.quantity));
    addToCart({
      product,
      quantity: qty,
      colorName: line.color_name || undefined,
      variantName: line.variant_name || undefined,
    });
    added.push({ name: product.name, quantity: qty });
    if (qty < line.quantity) {
      unavailable.push({
        name: product.name,
        reason: `Only ${qty} available (ordered ${line.quantity}).`,
      });
    }
  }

  return { added, unavailable };
}
