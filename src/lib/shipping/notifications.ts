/** Notification hooks — no sends in this phase. */

export type ShippingNotificationEvent =
  | "shipment_created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "rto";

export type ShippingNotificationPayload = {
  event: ShippingNotificationEvent;
  orderId: string;
  orderNumber: string;
  shipmentId: string;
  awbCode?: string | null;
  courierName?: string | null;
};

/** Placeholder for future email/WhatsApp wiring. Must not throw or send. */
export function enqueueShippingNotification(_payload: ShippingNotificationPayload): void {
  // Intentionally no-op in MVP. Existing paid notifications remain unchanged.
}

export type ShippingOpsLogEvent =
  | "shipment_created"
  | "shipment_failed"
  | "awb_assigned"
  | "label_generated"
  | "pickup_scheduled"
  | "tracking_refreshed"
  | "shipping_webhook_received"
  | "shipping_webhook_duplicate"
  | "shipping_webhook_rejected"
  | "shipping_provider_error";

/** Safe ops log — never pass secrets, tokens, or Authorization headers. */
export function logShippingOps(
  event: ShippingOpsLogEvent,
  meta: Record<string, string | number | boolean | null | undefined>,
): void {
  const safe: Record<string, unknown> = { event };
  for (const [k, v] of Object.entries(meta)) {
    const key = k.toLowerCase();
    if (/password|token|secret|authorization|api[_-]?key|bearer/i.test(key)) continue;
    if (v === undefined) continue;
    safe[k] = v;
  }
  console.log(JSON.stringify(safe));
}
