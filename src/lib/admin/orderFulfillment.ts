import { ORDER_STATUSES, type OrderStatus } from "@/services/adminOrdersService";

/** Mirrors DB function order_status_transition_allowed (Phase 5.5). UI filter only — DB still enforces. */
export function allowedNextStatuses(current: string): OrderStatus[] {
  const map: Record<string, OrderStatus[]> = {
    pending: ["confirmed", "cancelled"],
    failed: ["confirmed", "cancelled"],
    paid: ["confirmed", "packed", "shipped", "cancelled", "refunded"],
    confirmed: ["packed", "shipped", "cancelled"],
    packed: ["shipped", "cancelled"],
    shipped: ["out_for_delivery", "delivered", "cancelled"],
    out_for_delivery: ["delivered"],
    delivered: ["returned"],
    cancelled: ["confirmed", "refunded"],
    returned: ["refunded"],
    refunded: [],
    processing: ["confirmed", "packed", "shipped", "cancelled"],
  };
  const next = map[current] || ["confirmed", "cancelled"];
  return next.filter((s) => (ORDER_STATUSES as readonly string[]).includes(s));
}

export function statusOptionsFor(current: string): string[] {
  const next = allowedNextStatuses(current);
  const opts = [current, ...next];
  return [...new Set(opts)];
}

export function formatOrderStatus(value: string) {
  return value.replace(/_/g, " ");
}

export function formatPaymentStatus(value: string) {
  if (value === "failed") return "Payment Failed";
  if (value === "paid") return "Paid";
  if (value === "created") return "Created";
  if (value === "pending") return "Pending";
  if (value === "refunded") return "Refunded";
  return value.replace(/_/g, " ");
}
