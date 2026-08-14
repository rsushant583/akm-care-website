import type { CartLineItem, CatalogProduct } from "./types";

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calcDiscountPercent(mrp: number, akmPrice: number): number {
  if (!mrp || mrp <= 0) return 0;
  return Math.round(((mrp - akmPrice) / mrp) * 100);
}

export function getEffectivePrice(product: CatalogProduct): number {
  return product.akmCarePrice || product.sellingPrice || product.price;
}

/** Display-only rounding. Does not change stored catalog discount. */
export function displayDiscountPercent(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function calcLineSubtotal(line: CartLineItem): number {
  return line.unitPrice * line.quantity;
}

export function calcLineGst(line: CartLineItem): number {
  const taxable = calcLineSubtotal(line);
  return Math.round((taxable * (line.gstPercent || 0)) / 100);
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  mrpTotal: number;
  savings: number;
  gstTotal: number;
  shippingEstimate: number | null;
  couponDiscount: number;
  orderTotal: number;
}

export function calcCartTotals(
  lines: CartLineItem[],
  opts?: { shippingEstimate?: number | null; couponDiscount?: number },
): CartTotals {
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = lines.reduce((n, l) => n + calcLineSubtotal(l), 0);
  const mrpTotal = lines.reduce((n, l) => n + l.mrp * l.quantity, 0);
  const savings = Math.max(0, mrpTotal - subtotal);
  const gstTotal = lines.reduce((n, l) => n + calcLineGst(l), 0);
  const shippingEstimate = opts?.shippingEstimate ?? null;
  const couponDiscount = opts?.couponDiscount ?? 0;
  const shipping = shippingEstimate ?? 0;
  const orderTotal = Math.max(0, subtotal + shipping - couponDiscount);

  return {
    itemCount,
    subtotal,
    mrpTotal,
    savings,
    gstTotal,
    shippingEstimate,
    couponDiscount,
    orderTotal,
  };
}
