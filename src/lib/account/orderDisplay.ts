/** Customer-facing order labels. Payment and fulfillment stay separate. */

const FULFILLMENT_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
  failed: "Failed",
  processing: "Processing",
  /** Leftover header value — never treat as payment success. */
  paid: "Pending fulfillment",
};

export const SUPPORT_EMAIL = "contact@akmcare.in";
export const SUPPORT_PHONE_DISPLAY = "+91-84019 95486";
export const SUPPORT_PHONE_TEL = "+918401995486";

export function formatCustomerPaymentStatus(value: string) {
  const v = (value || "pending").toLowerCase();
  if (v === "paid") return "Paid";
  if (v === "failed") return "Payment failed";
  if (v === "created") return "Payment started";
  if (v === "pending") return "Payment pending";
  if (v === "refunded") return "Refunded";
  return titleCaseStatus(v);
}

export function formatCustomerOrderStatus(value: string) {
  const v = (value || "pending").toLowerCase();
  if (FULFILLMENT_LABELS[v]) return FULFILLMENT_LABELS[v];
  return titleCaseStatus(v);
}

function titleCaseStatus(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function paymentBadgeClass(value: string) {
  const v = (value || "").toLowerCase();
  if (v === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (v === "failed") return "border-red-200 bg-red-50 text-red-800";
  if (v === "created") return "border-sky-200 bg-sky-50 text-sky-800";
  if (v === "refunded") return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

export function orderBadgeClass(value: string) {
  const v = (value || "").toLowerCase();
  if (v === "delivered") return "border-slate-800 bg-slate-900 text-white";
  if (v === "confirmed" || v === "packed" || v === "shipped" || v === "out_for_delivery") {
    return "border-indigo-200 bg-indigo-50 text-indigo-800";
  }
  if (v === "cancelled" || v === "failed" || v === "returned") return "border-red-200 bg-red-50 text-red-800";
  if (v === "refunded") return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

export function addrField(address: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!address) return "";
  for (const k of keys) {
    const v = address[k];
    if (v != null && String(v).trim()) return String(v);
  }
  return "";
}

export function hasTrackingNumber(tracking: string | null | undefined) {
  return Boolean(tracking && String(tracking).trim());
}

/** List/detail hint only. Never invent a tracking number. */
export function trackingAvailabilityLabel(opts: {
  trackingNumber?: string | null;
  fulfillmentStatus: string;
}) {
  if (hasTrackingNumber(opts.trackingNumber)) return "Tracking available";
  const s = (opts.fulfillmentStatus || "").toLowerCase();
  if (s === "shipped" || s === "out_for_delivery" || s === "delivered") {
    return "Tracking not yet available";
  }
  return null;
}

export function formatOrderDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
