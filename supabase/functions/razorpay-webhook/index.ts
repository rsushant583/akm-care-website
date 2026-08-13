import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac, timingSafeEqual } from "node:crypto";
import { corsHeadersFor, json } from "../_shared/http.ts";
import { fulfillPaidOrder, releaseCheckoutHolds } from "../_shared/fulfillPaidOrder.ts";

function signaturesMatch(expectedHex: string, provided: string) {
  try {
    const enc = new TextEncoder();
    const a = enc.encode(expectedHex);
    const b = enc.encode(provided);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function fetchRazorpayPayment(paymentId: string, keyId: string, keySecret: string) {
  const auth = btoa(`${keyId}:${keySecret}`);
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error("Razorpay payment fetch failed");
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeadersFor(req) });
  if (req.method !== "POST") return json(req, 405, { success: false, error: "Method Not Allowed" });

  try {
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";
    const keyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!webhookSecret || !keyId || !keySecret || !supabaseUrl || !serviceRole) {
      return json(req, 500, { success: false, error: "Webhook is not configured" });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (!signature || !signaturesMatch(expected, signature)) {
      return json(req, 400, { success: false, error: "Invalid webhook signature" });
    }

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return json(req, 400, { success: false, error: "Invalid webhook payload" });
    }

    const eventId = String(event.id || "");
    const eventType = String(event.event || "");
    if (!eventId || !eventType) {
      return json(req, 400, { success: false, error: "Missing event id" });
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    const { data: existing } = await supabase
      .from("processed_razorpay_events")
      .select("event_id")
      .eq("event_id", eventId)
      .maybeSingle();
    if (existing) {
      return json(req, 200, { success: true, duplicate: true });
    }

    const payload = (event.payload || {}) as Record<string, unknown>;
    const paymentEntity = ((payload.payment as Record<string, unknown> | undefined)?.entity ||
      {}) as Record<string, unknown>;
    const orderEntity = ((payload.order as Record<string, unknown> | undefined)?.entity ||
      {}) as Record<string, unknown>;

    const razorpayOrderId = String(paymentEntity.order_id || orderEntity.id || "");
    const razorpayPaymentId = String(paymentEntity.id || "");

    if (!razorpayOrderId) {
      return json(req, 200, { success: true, ignored: true, reason: "no order id" });
    }

    const { data: header } = await supabase
      .from("order_headers")
      .select("*")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();
    if (!header) {
      return json(req, 200, { success: true, ignored: true, reason: "order not found" });
    }

    if (eventType === "payment.failed") {
      if (header.payment_status !== "paid") {
        await releaseCheckoutHolds(supabase, header);
        await supabase
          .from("order_headers")
          .update({
            status: header.status === "pending" || header.status === "failed" ? "failed" : header.status,
            payment_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", header.id)
          .neq("payment_status", "paid");
        await supabase
          .from("payments")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("order_id", header.id)
          .neq("status", "captured");
      }
    } else if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentId = razorpayPaymentId || String(orderEntity.id || "");
      if (!razorpayPaymentId && eventType === "order.paid") {
        // order.paid may not include payment id — skip if we cannot confirm a payment
        if (!paymentEntity.id) {
          await supabase.from("processed_razorpay_events").insert({
            event_id: eventId,
            event_type: eventType,
            razorpay_order_id: razorpayOrderId,
            order_header_id: header.id,
          });
          return json(req, 200, { success: true, ignored: true, reason: "order.paid without payment id" });
        }
      }

      const rpPayment = await fetchRazorpayPayment(String(paymentEntity.id), keyId, keySecret);
      if (String(rpPayment.order_id) !== razorpayOrderId) {
        return json(req, 400, { success: false, error: "Payment does not belong to this order" });
      }
      if (!["captured", "authorized"].includes(String(rpPayment.status))) {
        return json(req, 200, { success: true, ignored: true, reason: "payment not captured" });
      }
      const expectedPaise = Math.round(Number(header.grand_total) * 100);
      if (Number(rpPayment.amount) !== expectedPaise) {
        return json(req, 400, { success: false, error: "Amount mismatch" });
      }

      await fulfillPaidOrder({
        supabase,
        header,
        razorpayOrderId,
        razorpayPaymentId: String(rpPayment.id),
        razorpaySignature: signature,
        rpPayment,
        source: "webhook",
      });
    }

    await supabase.from("processed_razorpay_events").upsert({
      event_id: eventId,
      event_type: eventType,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId || null,
      order_header_id: header.id,
    });

    return json(req, 200, { success: true });
  } catch {
    return json(req, 500, { success: false, error: "Webhook processing failed" });
  }
});
