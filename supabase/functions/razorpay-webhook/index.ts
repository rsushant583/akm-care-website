import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";
import { corsHeadersFor, json } from "../_shared/http.ts";
import { fulfillPaidOrder, releaseCheckoutHolds } from "../_shared/fulfillPaidOrder.ts";

/** Safe labels only — never log secrets, digests, tokens, or bodies. */
type WebhookSigDiagnostic =
  | "WEBHOOK_SIG_MISSING"
  | "WEBHOOK_SIG_BAD_LENGTH"
  | "WEBHOOK_SIG_NON_HEX"
  | "WEBHOOK_SIG_MISMATCH"
  | "WEBHOOK_SIG_MATCH"
  | "WEBHOOK_SIG_COMPARE_EXCEPTION";

type WebhookSigCheckResult =
  | { ok: true; label: "WEBHOOK_SIG_MATCH" }
  | { ok: false; label: Exclude<WebhookSigDiagnostic, "WEBHOOK_SIG_MATCH"> };

const HEX64 = /^[0-9a-fA-F]{64}$/;

/** Timing-safe compare of SHA-256 hex digests as bytes — not UTF-8 string bytes. */
function checkWebhookSignature(expectedHex: unknown, provided: unknown): WebhookSigCheckResult {
  if (provided == null || provided === "") {
    return { ok: false, label: "WEBHOOK_SIG_MISSING" };
  }
  if (typeof provided !== "string" || typeof expectedHex !== "string") {
    return { ok: false, label: "WEBHOOK_SIG_MISSING" };
  }
  if (provided.length !== 64 || expectedHex.length !== 64) {
    return { ok: false, label: "WEBHOOK_SIG_BAD_LENGTH" };
  }
  if (!HEX64.test(provided) || !HEX64.test(expectedHex)) {
    return { ok: false, label: "WEBHOOK_SIG_NON_HEX" };
  }

  try {
    const a = Buffer.from(expectedHex, "hex");
    const b = Buffer.from(provided, "hex");
    if (a.length !== 32 || b.length !== 32) {
      return { ok: false, label: "WEBHOOK_SIG_BAD_LENGTH" };
    }
    if (!timingSafeEqual(a, b)) {
      return { ok: false, label: "WEBHOOK_SIG_MISMATCH" };
    }
    return { ok: true, label: "WEBHOOK_SIG_MATCH" };
  } catch {
    console.error("WEBHOOK_SIG_COMPARE_EXCEPTION");
    return { ok: false, label: "WEBHOOK_SIG_COMPARE_EXCEPTION" };
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
    const signature = req.headers.get("x-razorpay-signature");
    const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    const sigCheck = checkWebhookSignature(expected, signature);
    if (sigCheck.label !== "WEBHOOK_SIG_MATCH") {
      console.error(sigCheck.label);
    }
    if (sigCheck.label === "WEBHOOK_SIG_COMPARE_EXCEPTION") {
      return json(req, 500, {
        success: false,
        error: "Webhook processing failed",
        diagnostic: "WEBHOOK_SIG_COMPARE_EXCEPTION",
      });
    }
    if (!sigCheck.ok) {
      return json(req, 400, {
        success: false,
        error: "Invalid webhook signature",
        diagnostic: sigCheck.label,
      });
    }

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return json(req, 400, { success: false, error: "Invalid webhook payload" });
    }

    // Razorpay sends the delivery id in X-Razorpay-Event-Id (not body event.id).
    const eventId = String(req.headers.get("x-razorpay-event-id") || "").trim();
    const eventType = String(event.event || "");
    if (!eventId || !eventType) {
      return json(req, 400, { success: false, error: "Missing event id" });
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    // Claim event first (PK on event_id) — duplicate deliveries return 200 immediately.
    const { error: claimErr } = await supabase.from("processed_razorpay_events").insert({
      event_id: eventId,
      event_type: eventType,
    });
    if (claimErr) {
      const msg = String(claimErr.message || claimErr.code || "");
      if (/duplicate|unique|23505/i.test(msg)) {
        return json(req, 200, { success: true, duplicate: true });
      }
      throw claimErr;
    }

    const payload = (event.payload || {}) as Record<string, unknown>;
    const paymentEntity = ((payload.payment as Record<string, unknown> | undefined)?.entity ||
      {}) as Record<string, unknown>;
    const orderEntity = ((payload.order as Record<string, unknown> | undefined)?.entity ||
      {}) as Record<string, unknown>;

    const razorpayOrderId = String(paymentEntity.order_id || orderEntity.id || "");
    const razorpayPaymentId = String(paymentEntity.id || "");

    if (!razorpayOrderId) {
      await supabase
        .from("processed_razorpay_events")
        .update({ event_type: eventType })
        .eq("event_id", eventId);
      return json(req, 200, { success: true, ignored: true, reason: "no order id" });
    }

    const { data: header } = await supabase
      .from("order_headers")
      .select("*")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();

    await supabase
      .from("processed_razorpay_events")
      .update({
        event_type: eventType,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId || null,
        order_header_id: header?.id ?? null,
      })
      .eq("event_id", eventId);

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
        await supabase.from("order_status").insert({
          order_id: header.id,
          status: "failed",
          note: "Payment failed (webhook)",
        });
      }
    } else if (eventType === "payment.captured" || eventType === "order.paid") {
      if (!razorpayPaymentId) {
        return json(req, 200, { success: true, ignored: true, reason: "missing payment id" });
      }

      try {
        const rpPayment = await fetchRazorpayPayment(razorpayPaymentId, keyId, keySecret);
        if (String(rpPayment.order_id) !== razorpayOrderId) {
          await supabase.from("processed_razorpay_events").delete().eq("event_id", eventId);
          return json(req, 400, { success: false, error: "Payment does not belong to this order" });
        }

        const rpStatus = String(rpPayment.status || "");
        if (rpStatus === "authorized" && eventType !== "payment.captured") {
          await supabase
            .from("payments")
            .update({
              razorpay_payment_id: razorpayPaymentId,
              status: "authorized",
              method: rpPayment.method || "razorpay",
              updated_at: new Date().toISOString(),
            })
            .eq("order_id", header.id)
            .eq("razorpay_order_id", razorpayOrderId)
            .neq("status", "captured");
          return json(req, 200, { success: true, pendingCapture: true });
        }

        if (rpStatus !== "captured") {
          return json(req, 200, { success: true, ignored: true, reason: "payment not captured" });
        }

        const expectedPaise = Math.round(Number(header.grand_total) * 100);
        if (Number(rpPayment.amount) !== expectedPaise) {
          await supabase.from("processed_razorpay_events").delete().eq("event_id", eventId);
          return json(req, 400, { success: false, error: "Amount mismatch" });
        }

        await fulfillPaidOrder({
          supabase,
          header,
          razorpayOrderId,
          razorpayPaymentId: String(rpPayment.id),
          razorpaySignature: null,
          rpPayment,
          source: "webhook",
        });
      } catch {
        // Allow Razorpay to retry — release claim so the event is not stuck.
        await supabase.from("processed_razorpay_events").delete().eq("event_id", eventId);
        return json(req, 500, { success: false, error: "Webhook processing failed" });
      }
    }

    return json(req, 200, { success: true });
  } catch {
    return json(req, 500, { success: false, error: "Webhook processing failed" });
  }
});
