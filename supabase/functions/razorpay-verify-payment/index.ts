import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";
import { corsHeadersFor, json } from "../_shared/http.ts";
import { fulfillPaidOrder } from "../_shared/fulfillPaidOrder.ts";

/** Safe labels only — never log secrets, digests, tokens, or bodies. */
type SigDiagnostic =
  | "SIG_MISSING"
  | "SIG_NOT_STRING"
  | "SIG_BAD_LENGTH"
  | "SIG_NON_HEX"
  | "SIG_MISMATCH"
  | "SIG_MATCH"
  | "SIG_COMPARE_EXCEPTION";

type SigCheckResult = { ok: true; label: "SIG_MATCH" } | { ok: false; label: Exclude<SigDiagnostic, "SIG_MATCH"> };

const HEX64 = /^[0-9a-fA-F]{64}$/;

/** Timing-safe compare of SHA-256 hex digests as bytes — not UTF-8 string bytes. */
function checkPaymentSignature(expectedHex: unknown, provided: unknown): SigCheckResult {
  if (provided == null || provided === "") {
    return { ok: false, label: "SIG_MISSING" };
  }
  if (typeof provided !== "string" || typeof expectedHex !== "string") {
    return { ok: false, label: "SIG_NOT_STRING" };
  }
  if (provided.length !== 64 || expectedHex.length !== 64) {
    return { ok: false, label: "SIG_BAD_LENGTH" };
  }
  if (!HEX64.test(provided) || !HEX64.test(expectedHex)) {
    return { ok: false, label: "SIG_NON_HEX" };
  }

  try {
    const a = Buffer.from(expectedHex, "hex");
    const b = Buffer.from(provided, "hex");
    if (a.length !== 32 || b.length !== 32) {
      return { ok: false, label: "SIG_BAD_LENGTH" };
    }
    if (!timingSafeEqual(a, b)) {
      return { ok: false, label: "SIG_MISMATCH" };
    }
    return { ok: true, label: "SIG_MATCH" };
  } catch {
    console.error("SIG_COMPARE_EXCEPTION");
    return { ok: false, label: "SIG_COMPARE_EXCEPTION" };
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
    const keyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!keyId || !secret || !supabaseUrl || !serviceRole) {
      return json(req, 500, { success: false, error: "Server env missing for verification" });
    }

    const body = await req.json();
    const razorpay_order_id = String(body.razorpay_order_id || "");
    const razorpay_payment_id = String(body.razorpay_payment_id || "");
    const razorpay_signature = body.razorpay_signature;
    const orderHeaderId = body.orderHeaderId ? String(body.orderHeaderId) : "";
    const accessToken = body.accessToken ? String(body.accessToken) : "";

    if (!razorpay_order_id || !razorpay_payment_id) {
      return json(req, 400, { success: false, error: "Missing Razorpay verification fields" });
    }
    if (!orderHeaderId || !accessToken) {
      return json(req, 400, { success: false, error: "Missing order verification credentials" });
    }

    const expected = createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    const sigCheck = checkPaymentSignature(expected, razorpay_signature);
    if (sigCheck.label !== "SIG_MATCH") {
      console.error(sigCheck.label);
    }
    if (sigCheck.label === "SIG_COMPARE_EXCEPTION") {
      return json(req, 500, {
        success: false,
        error: "Payment verification failed. Please try again or contact support.",
        code: "verify_error",
        diagnostic: "SIG_COMPARE_EXCEPTION",
      });
    }
    if (!sigCheck.ok) {
      return json(req, 400, {
        success: false,
        error: "Invalid payment signature",
        code: "invalid_signature",
        diagnostic: sigCheck.label,
      });
    }
    const razorpay_signature_str = String(razorpay_signature);

    const supabase = createClient(supabaseUrl, serviceRole);
    const { data: header, error: hdrErr } = await supabase
      .from("order_headers")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("id", orderHeaderId)
      .eq("access_token", accessToken)
      .maybeSingle();
    if (hdrErr) throw hdrErr;
    if (!header) {
      return json(req, 404, { success: false, error: "Order not found for this payment" });
    }

    if (header.payment_status === "paid" || header.status === "paid") {
      return json(req, 200, {
        success: true,
        duplicate: true,
        paymentStatus: "paid",
        orderHeaderId: header.id,
        orderNumber: header.order_number,
        amount: Number(header.grand_total),
      });
    }

    const rpPayment = await fetchRazorpayPayment(razorpay_payment_id, keyId, secret);
    if (String(rpPayment.order_id) !== razorpay_order_id) {
      return json(req, 400, { success: false, error: "Payment does not belong to this order" });
    }

    const rpStatus = String(rpPayment.status || "");
    if (rpStatus === "authorized") {
      // Auto-capture path usually yields captured; authorized alone is not final paid.
      await supabase
        .from("payments")
        .update({
          razorpay_payment_id,
          status: "authorized",
          method: rpPayment.method || "razorpay",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", header.id)
        .eq("razorpay_order_id", razorpay_order_id)
        .neq("status", "captured");

      return json(req, 200, {
        success: true,
        pendingCapture: true,
        paymentStatus: "created",
        orderHeaderId: header.id,
        orderNumber: header.order_number,
        amount: Number(header.grand_total),
      });
    }

    if (rpStatus !== "captured") {
      return json(req, 400, {
        success: false,
        error: "Payment is not captured",
        code: "not_captured",
      });
    }

    const expectedPaise = Math.round(Number(header.grand_total) * 100);
    const paidPaise = Number(rpPayment.amount);
    if (!Number.isFinite(paidPaise) || paidPaise !== expectedPaise) {
      return json(req, 400, { success: false, error: "Amount mismatch" });
    }

    const result = await fulfillPaidOrder({
      supabase,
      header,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature_str,
      rpPayment,
      source: "verify",
    });

    return json(req, 200, {
      success: true,
      duplicate: result.duplicate,
      paymentStatus: "paid",
      orderHeaderId: header.id,
      orderNumber: header.order_number,
      amount: Number(header.grand_total),
    });
  } catch {
    return json(req, 500, {
      success: false,
      error: "Payment verification failed. Please try again or contact support.",
      code: "verify_error",
    });
  }
});
