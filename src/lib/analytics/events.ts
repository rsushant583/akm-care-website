/**
 * Centralized GA4 ecommerce events.
 *
 * Intentionally deferred:
 * - add_payment_info — Razorpay Checkout does not expose a reliable client-side
 *   moment when payment information is submitted (only modal open / verify success).
 */
import type { CartLineItem, CatalogProduct } from "@/lib/ecommerce/types";
import type { OrderReceipt } from "@/services/orderService";
import type { CreateCheckoutResponse } from "@/lib/paymentService";
import { ga4Event } from "@/lib/analytics/ga4";
import {
  cartLinesValue,
  GA4_CURRENCY,
  toGA4Item,
  toGA4ItemFromCartLine,
  toGA4Items,
  toGA4ItemsFromCartLines,
  toGA4ItemsFromOrderLines,
  type GA4Item,
  type OrderLineForGA4,
} from "@/lib/analytics/items";
import { trackPurchaseOnce } from "@/lib/analytics/dedupe";
import { isSensitiveSearchTerm } from "@/lib/analytics/ga4";

export function trackViewItem(product: CatalogProduct): void {
  const item = toGA4Item(product, 1);
  ga4Event("view_item", {
    currency: GA4_CURRENCY,
    value: item.price,
    items: [item],
  });
}

export function trackViewItemList(params: {
  itemListId: string;
  itemListName: string;
  products: CatalogProduct[];
}): void {
  if (params.products.length === 0) return;
  ga4Event("view_item_list", {
    item_list_id: params.itemListId,
    item_list_name: params.itemListName,
    items: toGA4Items(params.products.slice(0, 20)),
  });
}

export function trackSearch(searchTerm: string): void {
  const term = searchTerm.trim();
  if (!term || isSensitiveSearchTerm(term)) return;
  ga4Event("search", { search_term: term });
}

export function trackAddToCart(params: {
  product: CatalogProduct;
  quantity: number;
  line?: CartLineItem;
}): void {
  const item = params.line
    ? toGA4ItemFromCartLine(params.line)
    : toGA4Item(params.product, params.quantity);
  const value = item.price * item.quantity;
  ga4Event("add_to_cart", {
    currency: GA4_CURRENCY,
    value,
    items: [item],
  });
}

export function trackRemoveFromCart(line: CartLineItem): void {
  const item = toGA4ItemFromCartLine(line);
  ga4Event("remove_from_cart", {
    currency: GA4_CURRENCY,
    value: item.price * item.quantity,
    items: [item],
  });
}

export function trackViewCart(lines: CartLineItem[]): void {
  if (lines.length === 0) return;
  ga4Event("view_cart", {
    currency: GA4_CURRENCY,
    value: cartLinesValue(lines),
    items: toGA4ItemsFromCartLines(lines),
  });
}

export function trackBeginCheckout(lines: CartLineItem[], couponCode?: string): void {
  if (lines.length === 0) return;
  ga4Event("begin_checkout", {
    currency: GA4_CURRENCY,
    value: cartLinesValue(lines),
    coupon: couponCode?.trim() || undefined,
    items: toGA4ItemsFromCartLines(lines),
  });
}

function orderLinesFromCreateResponse(
  items: CreateCheckoutResponse["items"],
): OrderLineForGA4[] {
  if (!items?.length) return [];
  return items.map((line) => ({
    productId: line.productId,
    productName: line.productName,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
  }));
}

function orderLinesFromReceipt(receipt: OrderReceipt): OrderLineForGA4[] {
  return receipt.items.map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      productId: String(row.product_id || row.productId || ""),
      productName: String(row.product_name || row.productName || "Item"),
      quantity: Number(row.quantity) || 1,
      unitPrice: Number(row.unit_price ?? row.unitPrice ?? 0),
      sku: (row.sku as string | null | undefined) ?? null,
    };
  });
}

function firePurchaseEvent(params: {
  orderNumber: string;
  grandTotal: number;
  gstTotal?: number;
  shippingTotal?: number;
  couponCode?: string | null;
  items: GA4Item[];
}): boolean {
  return ga4Event("purchase", {
    transaction_id: params.orderNumber,
    value: params.grandTotal,
    currency: GA4_CURRENCY,
    tax: params.gstTotal,
    shipping: params.shippingTotal,
    coupon: params.couponCode?.trim() || undefined,
    items: params.items,
  });
}

/** Purchase — only when payment_status is authoritatively "paid". */
export function trackPurchaseFromCreateResponse(created: CreateCheckoutResponse): void {
  if (String(created.paymentStatus || "").toLowerCase() !== "paid") return;
  const orderNumber = created.orderNumber?.trim();
  if (!orderNumber || !created.totals) return;

  const items = orderLinesFromCreateResponse(created.items);
  trackPurchaseOnce(orderNumber, () =>
    firePurchaseEvent({
      orderNumber,
      grandTotal: Number(created.totals!.grandTotal),
      gstTotal: Number(created.totals!.gstTotal),
      shippingTotal: Number(created.totals!.shippingTotal),
      couponCode: created.totals!.couponCode,
      items: toGA4ItemsFromOrderLines(items),
    }),
  );
}

/** Purchase after Razorpay verify — server-confirmed paid status and totals. */
export function trackPurchaseAfterVerify(params: {
  paymentStatus?: string;
  orderNumber?: string;
  amount?: number;
  created: CreateCheckoutResponse;
}): void {
  if (String(params.paymentStatus || "").toLowerCase() !== "paid") return;
  const orderNumber = (params.orderNumber || params.created.orderNumber || "").trim();
  if (!orderNumber) return;

  const totals = params.created.totals;
  const grandTotal =
    params.amount ??
    totals?.grandTotal ??
    params.created.amount ??
    0;

  const items = orderLinesFromCreateResponse(params.created.items);
  trackPurchaseOnce(orderNumber, () =>
    firePurchaseEvent({
      orderNumber,
      grandTotal: Number(grandTotal),
      gstTotal: totals ? Number(totals.gstTotal) : undefined,
      shippingTotal: totals ? Number(totals.shippingTotal) : undefined,
      couponCode: totals?.couponCode ?? null,
      items: toGA4ItemsFromOrderLines(items),
    }),
  );
}

/** OrderSuccess fallback — receipt confirms paid and dedupe allows one fire per session. */
export function trackPurchaseFromReceipt(receipt: OrderReceipt): void {
  const paymentStatus = String(receipt.order.payment_status || "").toLowerCase();
  if (paymentStatus !== "paid") return;

  const orderNumber = String(receipt.order.order_number || "").trim();
  if (!orderNumber) return;

  const lines = orderLinesFromReceipt(receipt);
  trackPurchaseOnce(orderNumber, () =>
    firePurchaseEvent({
      orderNumber,
      grandTotal: Number(receipt.order.grand_total),
      gstTotal: Number(receipt.order.gst_total),
      shippingTotal: Number(receipt.order.shipping_total),
      couponCode: receipt.order.coupon_code,
      items: toGA4ItemsFromOrderLines(lines),
    }),
  );
}
