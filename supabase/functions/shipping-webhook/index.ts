import { createHash } from "node:crypto";
import { corsHeadersFor, json } from "../_shared/http.ts";
import { serviceClient } from "../_shared/adminAuth.ts";
import { validateShippingWebhookKey, logShippingOps, enqueueShippingNotification } from "../_shared/shipping/ops.ts";
import {
  canAdvanceFulfillment,
  canAdvanceShippingStatus,
  mapProviderStatusToShipping,
  shippingEventDedupeKey,
  suggestedFulfillmentFromShipping,
  toProjectionStatus,
  type ShippingStatus,
} from "../_shared/shipping/statusMap.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeadersFor(req) });
  if (req.method !== "POST") return json(req, 405, { success: false, error: "Method Not Allowed" });

  const expected = Deno.env.get("SHIPROCKET_WEBHOOK_TOKEN") || "";
  const provided = req.headers.get("x-api-key");
  const auth = validateShippingWebhookKey(provided, expected);
  if (!auth.ok) {
    logShippingOps("shipping_webhook_rejected", { reason: auth.reason });
    return json(req, 401, { success: false, error: "Unauthorized" });
  }

  try {
    const rawBody = await req.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    } catch {
      logShippingOps("shipping_webhook_rejected", { reason: "malformed_json" });
      return json(req, 400, { success: false, error: "Invalid JSON" });
    }

    const awb = payload.awb != null ? String(payload.awb) : null;
    const currentStatus = payload.current_status != null ? String(payload.current_status) : null;
    const shipmentStatus = payload.shipment_status != null ? String(payload.shipment_status) : null;
    const currentStatusId =
      payload.current_status_id != null ? String(payload.current_status_id) : null;
    const providerTimestamp =
      payload.current_timestamp != null ? String(payload.current_timestamp) : null;
    const providerShipmentId =
      payload.sr_shipment_id != null
        ? String(payload.sr_shipment_id)
        : payload.shipment_id != null
          ? String(payload.shipment_id)
          : null;
    const channelOrderId =
      payload.order_id != null ? String(payload.order_id) : null;

    const rawBodyHash = createHash("sha256").update(rawBody).digest("hex").slice(0, 32);
    const eventId = shippingEventDedupeKey({
      awb,
      currentStatusId,
      providerTimestamp,
      rawBodyHash,
    });

    const supabase = serviceClient();
    const { error: claimErr } = await supabase.from("shipping_events").insert({
      event_id: eventId,
      event_type: "tracking_update",
      awb_code: awb,
      provider_shipment_id: providerShipmentId,
      current_status: currentStatus,
      current_status_id: currentStatusId,
      provider_timestamp: providerTimestamp,
      payload,
    });

    if (claimErr) {
      // Unique violation → duplicate
      if (/duplicate|unique/i.test(claimErr.message || "")) {
        logShippingOps("shipping_webhook_duplicate", { event_id: eventId, awb });
        return json(req, 200, { success: true, duplicate: true });
      }
      throw claimErr;
    }

    logShippingOps("shipping_webhook_received", { event_id: eventId, awb, current_status: currentStatus });

    // Resolve shipment
    let shipmentQuery = supabase.from("shipping_shipments").select("*").eq("kind", "forward").neq("status", "cancelled");
    if (awb) shipmentQuery = shipmentQuery.eq("awb_code", awb);
    else if (providerShipmentId) shipmentQuery = shipmentQuery.eq("provider_shipment_id", providerShipmentId);
    else if (channelOrderId) shipmentQuery = shipmentQuery.eq("channel_order_id", channelOrderId);
    else {
      return json(req, 200, { success: true, ignored: true, reason: "no_shipment_key" });
    }

    const { data: shipment } = await shipmentQuery.order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!shipment) {
      await supabase
        .from("shipping_events")
        .update({ order_header_id: null })
        .eq("event_id", eventId);
      return json(req, 200, { success: true, ignored: true, reason: "shipment_not_found" });
    }

    await supabase
      .from("shipping_events")
      .update({
        shipment_id: shipment.id,
        order_header_id: shipment.order_id,
      })
      .eq("event_id", eventId);

    const mapped = mapProviderStatusToShipping({
      currentStatus,
      shipmentStatus,
      currentStatusId,
    });

    if (!mapped) {
      // Persist event only — do not invent AKM state
      return json(req, 200, { success: true, mapped: false });
    }

    if (!canAdvanceShippingStatus(String(shipment.status), mapped)) {
      return json(req, 200, { success: true, skipped: "non_monotonic", from: shipment.status, to: mapped });
    }

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      status: mapped,
      updated_at: now,
      last_error: null,
    };
    if (payload.courier_name) patch.courier_name = String(payload.courier_name);
    if (payload.etd) patch.etd = String(payload.etd);
    if (mapped === "picked_up") patch.picked_up_at = now;
    if (mapped === "in_transit") patch.in_transit_at = now;
    if (mapped === "out_for_delivery") patch.out_for_delivery_at = now;
    if (mapped === "delivered") patch.delivered_at = now;
    if (mapped === "rto") patch.rto_at = now;
    if (mapped === "cancelled") patch.cancelled_at = now;

    await supabase.from("shipping_shipments").update(patch).eq("id", shipment.id);

    const proj: Record<string, unknown> = {
      status: toProjectionStatus(mapped),
      carrier: patch.courier_name != null ? String(patch.courier_name) : shipment.courier_name,
      tracking_number: shipment.awb_code || awb,
      updated_at: now,
    };
    if (mapped === "picked_up" || mapped === "in_transit" || mapped === "out_for_delivery") {
      proj.shipped_at = now;
    }
    if (mapped === "delivered") {
      proj.delivered_at = now;
    }
    await supabase.from("shipping").update(proj).eq("order_id", shipment.order_id);

    // Monotonic fulfillment coupling
    const { data: header } = await supabase
      .from("order_headers")
      .select("id,status,order_number")
      .eq("id", shipment.order_id)
      .maybeSingle();

    if (header) {
      const nextFulfillment = suggestedFulfillmentFromShipping(mapped as ShippingStatus);
      if (nextFulfillment && canAdvanceFulfillment(String(header.status), nextFulfillment)) {
        const { error: fulErr } = await supabase
          .from("order_headers")
          .update({ status: nextFulfillment, updated_at: now })
          .eq("id", header.id);
        if (!fulErr) {
          await supabase.from("order_status").insert({
            order_id: header.id,
            status: nextFulfillment,
            note: `Fulfillment advanced from shipping webhook (${mapped})`,
          });
        }
      }
      enqueueShippingNotification({
        event: mapped === "rto" ? "rto" : mapped,
        orderId: String(header.id),
        orderNumber: String(header.order_number),
        shipmentId: String(shipment.id),
        awbCode: awb,
      });
    }

    return json(req, 200, { success: true, status: mapped });
  } catch (e) {
    logShippingOps("shipping_provider_error", {
      error: e instanceof Error ? e.message : "webhook_failed",
    });
    // Return 200 only after durable processing — on unexpected errors return 500 so provider retries
    return json(req, 500, { success: false, error: "Webhook processing failed" });
  }
});
