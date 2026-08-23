import { getSupabaseClient } from "@/lib/supabaseClient";
import { getProductById } from "@/services/productService";
import { getAvailableQuantity, isProductInStock } from "@/lib/ecommerce/availability";
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
  tracking_number: string | null;
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
    created_at: string | null;
    updated_at: string | null;
  } | null;
  shipping: {
    method: string | null;
    status: string | null;
    carrier: string | null;
    tracking_number: string | null;
    estimated_days: number | null;
    shipped_at: string | null;
    delivered_at: string | null;
    tracking_url?: string | null;
    etd?: string | null;
  } | null;
  timeline: Array<{ id: string; status: string; note: string | null; created_at: string }>;
};

const LIST_SELECT_CORE = `
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

const LIST_SELECT = `
  ${LIST_SELECT_CORE},
  shipping(tracking_number)
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

function firstEmbedded<T>(raw: unknown): T | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return (raw[0] as T) || null;
  return raw as T;
}

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

  let { data, error } = await client
    .from("order_headers")
    .select(LIST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    const retry = await client
      .from("order_headers")
      .select(LIST_SELECT_CORE)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return (data || []).map((row) => {
    const ship = firstEmbedded<{ tracking_number?: string | null }>(row.shipping);
    return {
      id: String(row.id),
      order_number: String(row.order_number),
      grand_total: Number(row.grand_total || 0),
      status: String(row.status || "pending"),
      payment_status: String(row.payment_status || "pending"),
      created_at: String(row.created_at),
      shipping_method: row.shipping_method ? String(row.shipping_method) : null,
      tracking_number: ship?.tracking_number ? String(ship.tracking_number) : null,
      order_items: ((row.order_items as CustomerOrderItem[]) || []).map(normalizeItem),
    };
  });
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
      .select("provider,status,method,amount,razorpay_payment_id,razorpay_order_id,created_at,updated_at")
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

  const shipmentRes = await client
    .from("shipping_shipments")
    .select("awb_code,courier_name,tracking_url,etd,status")
    .eq("order_id", orderId)
    .eq("kind", "forward")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  // Ignore missing-table / RLS errors — projection still works.

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
          created_at: payRes.data.created_at ? String(payRes.data.created_at) : null,
          updated_at: payRes.data.updated_at ? String(payRes.data.updated_at) : null,
        }
      : null,
    shipping: shipRes.data || shipmentRes.data
      ? {
          method: shipRes.data?.method ?? null,
          status: shipRes.data?.status ?? shipmentRes.data?.status ?? null,
          carrier: shipRes.data?.carrier ?? shipmentRes.data?.courier_name ?? null,
          tracking_number:
            shipRes.data?.tracking_number ?? shipmentRes.data?.awb_code ?? null,
          estimated_days: shipRes.data?.estimated_days ?? null,
          shipped_at: shipRes.data?.shipped_at ? String(shipRes.data.shipped_at) : null,
          delivered_at: shipRes.data?.delivered_at ? String(shipRes.data.delivered_at) : null,
          tracking_url: shipmentRes.data?.tracking_url
            ? String(shipmentRes.data.tracking_url)
            : null,
          etd: shipmentRes.data?.etd ? String(shipmentRes.data.etd) : null,
        }
      : null,
    timeline: (histRes.data || []) as CustomerOrderDetail["timeline"],
  };
}

export type ReorderResult = {
  added: Array<{ name: string; quantity: number }>;
  unavailable: Array<{ name: string; reason: string }>;
};

function reorderUnavailableReason(product: CatalogProduct | null): string | null {
  if (!product) return "This product is no longer in the catalog.";
  if (product.status === "draft" || product.status === "coming_soon") {
    return "This product is not currently available to purchase.";
  }
  if (!isProductInStock(product) || getAvailableQuantity(product) <= 0) {
    return "Currently out of stock.";
  }
  return null;
}

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
  loaded?: CustomerOrderDetail | null,
): Promise<ReorderResult> {
  const detail = loaded?.id === orderId ? loaded : await getMyOrderDetail(orderId);
  if (!detail) {
    return { added: [], unavailable: [{ name: "Order", reason: "Order not found or not accessible." }] };
  }

  const added: ReorderResult["added"] = [];
  const unavailable: ReorderResult["unavailable"] = [];

  const uniqueIds = [...new Set(detail.items.map((line) => line.product_id).filter(Boolean))] as string[];
  const fetched = await Promise.all(uniqueIds.map((id) => getProductById(id).catch(() => null)));
  const byId = new Map(uniqueIds.map((id, i) => [id, fetched[i]]));

  for (const line of detail.items) {
    if (!line.product_id) {
      unavailable.push({ name: line.product_name, reason: "This item is no longer linked to a catalog product." });
      continue;
    }
    const product = byId.get(line.product_id) ?? null;
    const blocked = reorderUnavailableReason(product);
    if (!product || blocked) {
      unavailable.push({ name: product?.name || line.product_name, reason: blocked || "Currently unavailable." });
      continue;
    }

    const available = getAvailableQuantity(product);
    const qty = Math.min(Math.max(1, line.quantity), available);
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
        reason: `Only ${qty} available now (originally ordered ${line.quantity}). Current catalog price applies.`,
      });
    }
  }

  return { added, unavailable };
}
