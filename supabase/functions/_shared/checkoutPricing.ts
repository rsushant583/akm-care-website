/** Shared server-side checkout pricing — never trust client money fields. */

export const SHIPPING_RATES = {
  standard: 49,
  express: 99,
} as const;

export type ShippingMethod = keyof typeof SHIPPING_RATES;

export type CheckoutLineInput = {
  productId: string;
  quantity: number;
};

export type PricedLine = {
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  mrp: number | null;
  gstPercent: number;
  lineTotal: number;
  imageUrl: string | null;
};

export type CouponRow = {
  code: string;
  discount_type: "percentage" | "flat" | "free_shipping";
  discount_value: number;
  min_purchase: number;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
};

export type PricingResult = {
  lines: PricedLine[];
  subtotal: number;
  gstTotal: number;
  shippingTotal: number;
  discountTotal: number;
  couponCode: string | null;
  grandTotal: number;
  shippingMethod: ShippingMethod;
};

function clampQty(raw: unknown): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return 0;
  return Math.min(100, n);
}

export function resolveUnitPrice(product: {
  akm_care_price?: number | null;
  selling_price?: number | null;
  price?: number | null;
}): number | null {
  const candidates = [product.akm_care_price, product.selling_price, product.price];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return Math.round(n * 100) / 100;
  }
  return null;
}

export function resolveShippingMethod(raw: unknown): ShippingMethod {
  return raw === "express" ? "express" : "standard";
}

export function computeShippingTotal(
  method: ShippingMethod,
  subtotal: number,
  coupon: CouponRow | null,
  freeAbove = 999,
): number {
  if (coupon?.discount_type === "free_shipping") return 0;
  if (subtotal >= freeAbove) return 0;
  return SHIPPING_RATES[method];
}

export function computeCouponDiscount(coupon: CouponRow | null, subtotal: number): number {
  if (!coupon) return 0;
  if (!coupon.is_active) return 0;
  if (Number(coupon.min_purchase || 0) > subtotal) return 0;
  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) return 0;
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) return 0;
  if (coupon.usage_limit != null && Number(coupon.used_count) >= Number(coupon.usage_limit)) return 0;

  if (coupon.discount_type === "percentage") {
    const pct = Math.max(0, Math.min(100, Number(coupon.discount_value) || 0));
    return Math.round(((subtotal * pct) / 100) * 100) / 100;
  }
  if (coupon.discount_type === "flat") {
    return Math.min(subtotal, Math.max(0, Number(coupon.discount_value) || 0));
  }
  // free_shipping handled in shipping
  return 0;
}

export function priceCheckout(params: {
  items: CheckoutLineInput[];
  products: Array<Record<string, unknown>>;
  shippingMethod: ShippingMethod;
  coupon: CouponRow | null;
  freeShippingAbove?: number;
}): PricingResult | { error: string } {
  const productMap = new Map(params.products.map((p) => [String(p.id), p]));
  const lines: PricedLine[] = [];
  let subtotal = 0;
  let gstTotal = 0;

  for (const raw of params.items) {
    const productId = String(raw.productId || "");
    const qty = clampQty(raw.quantity);
    if (!productId || qty < 1) {
      return { error: "Invalid cart line" };
    }
    const p = productMap.get(productId);
    if (!p) return { error: "One or more items are invalid" };

    const stock = Number(p.stock_quantity ?? 0);
    if (stock < qty) {
      return { error: `${String(p.name || "Item")} is low on stock` };
    }

    const unitPrice = resolveUnitPrice(p as {
      akm_care_price?: number | null;
      selling_price?: number | null;
      price?: number | null;
    });
    if (unitPrice == null) {
      return { error: `${String(p.name || "Item")} has no valid price` };
    }

    const gstPercent = Math.max(0, Number(p.gst_percent ?? 0) || 0);
    const lineTotal = Math.round(unitPrice * qty * 100) / 100;
    const lineGst = Math.round(((lineTotal * gstPercent) / 100) * 100) / 100;
    subtotal += lineTotal;
    gstTotal += lineGst;

    const images = p.images;
    let imageUrl: string | null = null;
    if (typeof p.image_url === "string") imageUrl = p.image_url;
    else if (Array.isArray(images) && images[0] && typeof (images[0] as { src?: string }).src === "string") {
      imageUrl = (images[0] as { src: string }).src;
    }

    lines.push({
      productId,
      productName: String(p.name || "Product"),
      sku: p.sku != null ? String(p.sku) : null,
      quantity: qty,
      unitPrice,
      mrp: p.mrp != null ? Number(p.mrp) : null,
      gstPercent,
      lineTotal,
      imageUrl,
    });
  }

  if (lines.length === 0) return { error: "Cart is empty" };

  subtotal = Math.round(subtotal * 100) / 100;
  gstTotal = Math.round(gstTotal * 100) / 100;

  const discountTotal = computeCouponDiscount(params.coupon, subtotal);
  const shippingTotal = computeShippingTotal(
    params.shippingMethod,
    subtotal,
    params.coupon,
    params.freeShippingAbove ?? 999,
  );
  // Prices are treated as GST-inclusive for charged total (matches prior UI orderTotal).
  const grandTotal = Math.round(Math.max(0, subtotal + shippingTotal - discountTotal) * 100) / 100;

  if (grandTotal < 1) {
    return { error: "Order total must be at least ₹1" };
  }

  return {
    lines,
    subtotal,
    gstTotal,
    shippingTotal,
    discountTotal,
    couponCode: params.coupon?.code ?? null,
    grandTotal,
    shippingMethod: params.shippingMethod,
  };
}

export function generateOrderNumber(): string {
  const stamp = new Date();
  const y = String(stamp.getFullYear()).slice(2);
  const m = String(stamp.getMonth() + 1).padStart(2, "0");
  const d = String(stamp.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return `AKM${y}${m}${d}${rand}`;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
