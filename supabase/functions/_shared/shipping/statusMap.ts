/** Deno Edge: shipping status mapping (mirrors src/lib/shipping/statusMap.ts). */

export type ShippingStatus =
  | "created"
  | "awb_assigned"
  | "pickup_scheduled"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "failed"
  | "rto";

export const SHIPPING_STATUS_RANK: Record<ShippingStatus, number> = {
  created: 1,
  awb_assigned: 2,
  pickup_scheduled: 3,
  picked_up: 4,
  in_transit: 5,
  out_for_delivery: 6,
  delivered: 7,
  cancelled: 0,
  failed: 0,
  rto: 0,
};

export function toProjectionStatus(status: ShippingStatus | "not_created" | "pending"): string {
  switch (status) {
    case "not_created":
    case "pending":
    case "created":
      return "pending";
    case "awb_assigned":
    case "pickup_scheduled":
      return "ready";
    case "picked_up":
    case "in_transit":
      return "in_transit";
    case "out_for_delivery":
      return "shipped";
    case "delivered":
      return "delivered";
    case "rto":
      return "returned";
    case "cancelled":
      return "cancelled";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}

export function canAdvanceShippingStatus(from: string, to: string): boolean {
  if (from === to) return true;
  const f = from as ShippingStatus;
  const t = to as ShippingStatus;
  if (!(t in SHIPPING_STATUS_RANK) || !(f in SHIPPING_STATUS_RANK)) return false;
  if (f === "delivered") return t === "rto";
  if (f === "cancelled" || f === "failed" || f === "rto") return false;
  if (t === "cancelled" || t === "failed") {
    return SHIPPING_STATUS_RANK[f] < SHIPPING_STATUS_RANK.picked_up;
  }
  if (t === "rto") return SHIPPING_STATUS_RANK[f] >= SHIPPING_STATUS_RANK.picked_up;
  return SHIPPING_STATUS_RANK[t] >= SHIPPING_STATUS_RANK[f];
}

export function mapProviderStatusToShipping(input: {
  currentStatus?: string | null;
  shipmentStatus?: string | null;
  currentStatusId?: string | number | null;
}): ShippingStatus | null {
  const labels = [input.currentStatus, input.shipmentStatus]
    .map((s) => String(s || "").trim().toUpperCase())
    .filter(Boolean);
  const joined = labels.join(" ");
  if (!joined) return null;
  if (/\bRTO\b|RETURN TO ORIGIN|RETURNED/.test(joined)) return "rto";
  if (/\bDELIVERED\b/.test(joined)) return "delivered";
  if (/OUT FOR DELIVERY|OFD/.test(joined)) return "out_for_delivery";
  if (/IN TRANSIT|SHIPPED/.test(joined)) return "in_transit";
  if (/PICKED UP|PICKUP DONE|PICKED/.test(joined)) return "picked_up";
  if (/PICKUP|PICKUP SCHEDULED|MANIFEST/.test(joined)) return "pickup_scheduled";
  if (/AWB|ASSIGNED|LABEL/.test(joined)) return "awb_assigned";
  if (/CANCEL|CANCELLATION/.test(joined)) return "cancelled";
  if (/FAIL|ERROR|UNDELIVERED|LOST/.test(joined)) return "failed";
  if (/CREATED|NEW|PENDING|BOOKED/.test(joined)) return "created";
  return null;
}

export function suggestedFulfillmentFromShipping(shipping: ShippingStatus): string | null {
  switch (shipping) {
    case "picked_up":
    case "in_transit":
      return "shipped";
    case "out_for_delivery":
      return "out_for_delivery";
    case "delivered":
      return "delivered";
    case "rto":
      return "returned";
    default:
      return null;
  }
}

const FULFILLMENT_RANK: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  packed: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
  returned: 6,
};

export function canAdvanceFulfillment(from: string, to: string): boolean {
  if (from === to) return true;
  const a = FULFILLMENT_RANK[from];
  const b = FULFILLMENT_RANK[to];
  if (a == null || b == null) return false;
  if (from === "delivered" && to === "returned") return true;
  if (from === "cancelled" || from === "refunded" || from === "failed") return false;
  return b > a;
}

export function shippingEventDedupeKey(parts: {
  awb?: string | null;
  currentStatusId?: string | number | null;
  providerTimestamp?: string | null;
  rawBodyHash?: string | null;
}): string {
  const awb = String(parts.awb || "").trim();
  const statusId = String(parts.currentStatusId ?? "").trim();
  const ts = String(parts.providerTimestamp || "").trim();
  if (awb && statusId && ts) return `sr:${awb}:${statusId}:${ts}`;
  if (awb && ts) return `sr:${awb}:${ts}`;
  if (parts.rawBodyHash) return `sr:body:${parts.rawBodyHash}`;
  return `sr:unknown:${Date.now()}`;
}
