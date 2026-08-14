export function formatCustomerPaymentStatus(value: string) {
  const v = (value || "pending").toLowerCase();
  if (v === "paid") return "Paid";
  if (v === "failed") return "Payment failed";
  if (v === "created") return "Payment started";
  if (v === "pending") return "Payment pending";
  if (v === "refunded") return "Refunded";
  return v.replace(/_/g, " ");
}

export function formatCustomerOrderStatus(value: string) {
  return (value || "pending").replace(/_/g, " ");
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
  if (v === "cancelled" || v === "failed") return "border-red-200 bg-red-50 text-red-800";
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
