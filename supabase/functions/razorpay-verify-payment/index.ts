import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac, timingSafeEqual } from "node:crypto";
import { corsHeadersFor, json } from "../_shared/http.ts";
import { fulfillPaidOrder } from "../_shared/fulfillPaidOrder.ts";

function signaturesMatch(expectedHex: string, provided: string) {
  try {
    const a = Buffer.from(expectedHex, "utf8");
    const b = Buffer.from(provided, "utf8");
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
    const razorpay_signature = String(body.razorpay_signature || "");
    const orderHeaderId = body.orderHeaderId ? String(body.orderHeaderId) : "";
    const accessToken = body.accessToken ? String(body.accessToken) : "";

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json(req, 400, { success: false, error: "Missing Razorpay verification fields" });
    }
    if (!orderHeaderId || !accessToken) {
      return json(req, 400, { success: false, error: "Missing order verification credentials" });
    }

    const expected = createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (!signaturesMatch(expected, razorpay_signature)) {
      return json(req, 400, { success: false, error: "Invalid payment signature", code: "invalid_signature" });
    }

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
      razorpaySignature: razorpay_signature,
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
