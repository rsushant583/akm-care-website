import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOTIFICATION_EMAIL = Deno.env.get("OPS_NOTIFICATION_EMAIL") ?? "rsushant583@gmail.com";

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function fetchRazorpayPayment(paymentId: string, keyId: string, keySecret: string) {
  const auth = btoa(`${keyId}:${keySecret}`);
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay payment fetch failed: ${text}`);
  }
  return res.json();
}

async function sendWhatsAppOrderNotification(payload: Record<string, unknown>) {
  const token = Deno.env.get("WHATSAPP_TOKEN") ?? "";
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
  const to = Deno.env.get("WHATSAPP_TO_NUMBER") ?? "";
  if (!token || !phoneNumberId || !to) return;

  const lines = Object.entries(payload)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim().length > 0)
    .map(([k, v]) => `${k}: ${String(v)}`);

  try {
    await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: `New Order Paid\n${lines.join("\n")}` },
      }),
    });
  } catch (_) {
    /* ignore */
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Method Not Allowed" });

  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!keyId || !secret || !supabaseUrl || !serviceRole) {
      return json(500, { success: false, error: "Server env missing for verification" });
    }

    const body = await req.json();
    const razorpay_order_id = String(body.razorpay_order_id || "");
    const razorpay_payment_id = String(body.razorpay_payment_id || "");
    const razorpay_signature = String(body.razorpay_signature || "");
    const orderHeaderId = body.orderHeaderId ? String(body.orderHeaderId) : null;
    const accessToken = body.accessToken ? String(body.accessToken) : null;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json(400, { success: false, error: "Missing Razorpay verification fields" });
    }

    const expected = createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expected !== razorpay_signature) {
      return json(400, { success: false, error: "Invalid payment signature" });
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    // Load canonical pending order created by razorpay-create-order (ignore client money fields)
    let query = supabase.from("order_headers").select("*").eq("razorpay_order_id", razorpay_order_id);
    if (orderHeaderId) query = query.eq("id", orderHeaderId);
    if (accessToken) query = query.eq("access_token", accessToken);

    const { data: header, error: hdrErr } = await query.maybeSingle();
    if (hdrErr) throw hdrErr;
    if (!header) {
      return json(404, { success: false, error: "Order not found for this payment" });
    }

    if (header.payment_status === "paid" || header.status === "paid") {
      return json(200, {
        success: true,
        duplicate: true,
        orderHeaderId: header.id,
        orderNumber: header.order_number,
        accessToken: header.access_token,
        amount: Number(header.grand_total),
      });
    }

    const { data: paidExisting } = await supabase
      .from("payments")
      .select("id")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .eq("status", "captured")
      .limit(1);
    if (paidExisting && paidExisting.length > 0) {
      return json(200, {
        success: true,
        duplicate: true,
        orderHeaderId: header.id,
        orderNumber: header.order_number,
        accessToken: header.access_token,
        amount: Number(header.grand_total),
      });
    }

    const rpPayment = await fetchRazorpayPayment(razorpay_payment_id, keyId, secret);
    if (String(rpPayment.order_id) !== razorpay_order_id) {
      return json(400, { success: false, error: "Payment does not belong to this order" });
    }
    if (!["captured", "authorized"].includes(String(rpPayment.status))) {
      return json(400, { success: false, error: `Payment status is ${rpPayment.status}` });
    }

    const expectedPaise = Math.round(Number(header.grand_total) * 100);
    const paidPaise = Number(rpPayment.amount);
    if (!Number.isFinite(paidPaise) || paidPaise !== expectedPaise) {
      return json(400, {
        success: false,
        error: `Amount mismatch: expected ${expectedPaise} paise, got ${paidPaise}`,
      });
    }

    const { data: lines, error: linesErr } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", header.id);
    if (linesErr) throw linesErr;
    if (!lines || lines.length === 0) {
      return json(400, { success: false, error: "Order has no line items" });
    }

    const productIds = [...new Set(lines.map((l) => l.product_id).filter(Boolean))];
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id,name,stock_quantity")
      .in("id", productIds);
    if (pErr) throw pErr;
    const pMap = new Map((products || []).map((p) => [p.id, p]));

    for (const line of lines) {
      const p = pMap.get(line.product_id);
      const qty = Number(line.quantity);
      if (!p || Number(p.stock_quantity ?? 0) < qty) {
        return json(409, { success: false, error: `${line.product_name} went out of stock` });
      }
    }

    const legacyOrderIds: string[] = [];
    for (const line of lines) {
      const p = pMap.get(line.product_id)!;
      const qty = Number(line.quantity);
      const prevStock = Number(p.stock_quantity ?? 0);
      const newStock = Math.max(0, prevStock - qty);
      const status = newStock > 0 ? "available" : "sold_out";

      const { data: updatedRows, error: stockErr } = await supabase
        .from("products")
        .update({ stock_quantity: newStock, status })
        .eq("id", line.product_id)
        .gte("stock_quantity", qty)
        .select("id");
      if (stockErr) throw stockErr;
      if (!updatedRows || updatedRows.length === 0) {
        return json(409, { success: false, error: `${line.product_name} went out of stock` });
      }

      const { data: insertedOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          product_id: line.product_id,
          product_name: line.product_name,
          amount: Number(line.line_total),
          unit_price: Number(line.unit_price),
          currency: "INR",
          quantity: qty,
          customer_name: header.customer_name,
          customer_email: header.customer_email,
          customer_phone: header.customer_phone,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          order_group_id: razorpay_order_id,
          order_header_id: header.id,
          user_id: header.user_id,
          payment_status: "paid",
          notes: { itemCount: lines.length, order_number: header.order_number },
        })
        .select("id")
        .single();
      if (orderErr) throw orderErr;
      legacyOrderIds.push(insertedOrder.id);

      await supabase.from("stock_movements").insert({
        product_id: line.product_id,
        order_id: insertedOrder.id,
        movement_type: "sale",
        quantity_change: -qty,
        previous_stock: prevStock,
        new_stock: newStock,
        reason: "Razorpay paid checkout",
      });

      p.stock_quantity = newStock;
    }

    await supabase
      .from("order_headers")
      .update({
        status: "paid",
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", header.id);

    await supabase
      .from("payments")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "captured",
        method: rpPayment.method || "razorpay",
        amount: Number(header.grand_total),
        raw_response: { payment: rpPayment },
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", header.id)
      .eq("razorpay_order_id", razorpay_order_id);

    await supabase.from("order_status").insert({
      order_id: header.id,
      status: "paid",
      note: "Payment verified against Razorpay amount",
    });

    if (header.coupon_code) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("id, used_count")
        .eq("code", header.coupon_code)
        .maybeSingle();
      if (coupon) {
        await supabase
          .from("coupons")
          .update({ used_count: Number(coupon.used_count ?? 0) + 1, updated_at: new Date().toISOString() })
          .eq("id", coupon.id);
      }
    }

    await sendWhatsAppOrderNotification({
      order_number: header.order_number,
      amount: `INR ${header.grand_total}`,
      customer: header.customer_name,
      email: header.customer_email,
      phone: header.customer_phone || "-",
      razorpay_order_id,
      razorpay_payment_id,
      timestamp: new Date().toISOString(),
    });

    const resendKey = Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("VITE_RESEND_API_KEY") ?? "";
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const orderRows = [
          ["Order", header.order_number],
          ["Amount", `INR ${header.grand_total}`],
          ["Customer", header.customer_name],
          ["Email", header.customer_email],
          ["Phone", header.customer_phone || "-"],
          ["Razorpay Order ID", razorpay_order_id],
          ["Razorpay Payment ID", razorpay_payment_id],
          ["Timestamp", new Date().toISOString()],
        ];
        const rowsHtml = orderRows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:8px 10px;font-weight:600;border:1px solid #eee;">${escapeHtml(k)}</td><td style="padding:8px 10px;border:1px solid #eee;">${escapeHtml(v)}</td></tr>`,
          )
          .join("");
        const html =
          `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;"><h2 style="color:#b45309;">Payment Successful</h2><table style="width:100%;border-collapse:collapse;">${rowsHtml}</table></div>`;

        await resend.emails.send({
          from: "AKM Care <onboarding@resend.dev>",
          to: [header.customer_email, NOTIFICATION_EMAIL],
          subject: `Order Confirmed - ${header.order_number}`,
          html,
        });
      } catch (_) {
        /* Email failure should not fail paid order processing. */
      }
    }

    return json(200, {
      success: true,
      orderHeaderId: header.id,
      orderNumber: header.order_number,
      accessToken: header.access_token,
      amount: Number(header.grand_total),
      legacyOrderIds,
    });
  } catch (e) {
    return json(500, { success: false, error: String(e) });
  }
});
