import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOTIFICATION_EMAIL = "rsushant583@gmail.com";

async function sendWhatsAppOrderNotification(payload: Record<string, unknown>) {
  const token = Deno.env.get("WHATSAPP_TOKEN") ?? "";
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
  const to = Deno.env.get("WHATSAPP_TO_NUMBER") ?? "";
  if (!token || !phoneNumberId || !to) return;

  const lines = Object.entries(payload)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim().length > 0)
    .map(([k, v]) => `${k}: ${String(v)}`);

  const text = `New Order Paid\n${lines.join("\n")}`;

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
        text: { body: text },
      }),
    });
  } catch (_) {
    // ignore WhatsApp failure
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  try {
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!secret || !supabaseUrl || !serviceRole) {
      return new Response(JSON.stringify({ success: false, error: "Server env missing for verification" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderPayload } = await req.json();
    if (!orderPayload?.items || !Array.isArray(orderPayload.items) || orderPayload.items.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Invalid checkout payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = createHmac("sha256", secret).update(body).digest("hex");

    if (expected !== razorpay_signature) {
      return new Response(JSON.stringify({ success: false, error: "Invalid payment signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRole);
    const { data: paidExisting } = await supabase
      .from("orders")
      .select("id")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .eq("payment_status", "paid")
      .limit(1);
    if (paidExisting && paidExisting.length > 0) {
      return new Response(JSON.stringify({ success: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productIds = [...new Set(orderPayload.items.map((i: { productId: string }) => i.productId))];
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id,name,price,stock_quantity")
      .in("id", productIds);
    if (pErr) throw pErr;
    const pMap = new Map((products || []).map((p) => [p.id, p]));

    for (const item of orderPayload.items) {
      const p = pMap.get(item.productId);
      const qty = Math.max(1, Number(item.quantity || 1));
      if (!p || Number(p.stock_quantity ?? 0) < qty) {
        return new Response(JSON.stringify({ success: false, error: `${item.productName} went out of stock` }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const insertedOrderIds: string[] = [];
    for (const item of orderPayload.items) {
      const p = pMap.get(item.productId)!;
      const qty = Math.max(1, Number(item.quantity || 1));
      const prevStock = Number(p.stock_quantity ?? 0);
      const newStock = Math.max(0, prevStock - qty);
      const status = newStock > 0 ? "available" : "sold_out";

      const { data: updatedRows, error: stockErr } = await supabase
        .from("products")
        .update({ stock_quantity: newStock, status })
        .eq("id", item.productId)
        .gte("stock_quantity", qty)
        .select("id");
      if (stockErr) throw stockErr;
      if (!updatedRows || updatedRows.length === 0) {
        return new Response(JSON.stringify({ success: false, error: `${item.productName} went out of stock` }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: insertedOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          product_id: item.productId,
          product_name: item.productName,
          amount: Number(item.unitPrice) * qty,
          unit_price: Number(item.unitPrice),
          currency: "INR",
          quantity: qty,
          customer_name: orderPayload.customer.name,
          customer_email: orderPayload.customer.email,
          customer_phone: orderPayload.customer.phone || null,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          order_group_id: razorpay_order_id,
          payment_status: "paid",
          notes: { itemCount: orderPayload.items.length },
        })
        .select("id")
        .single();
      if (orderErr) throw orderErr;
      insertedOrderIds.push(insertedOrder.id);

      const { error: movementErr } = await supabase.from("stock_movements").insert({
        product_id: item.productId,
        order_id: insertedOrder.id,
        movement_type: "sale",
        quantity_change: -qty,
        previous_stock: prevStock,
        new_stock: newStock,
        reason: "Razorpay paid checkout",
      });
      if (movementErr) throw movementErr;

      p.stock_quantity = newStock;
    }

    await sendWhatsAppOrderNotification({
      item_count: String(orderPayload.items.length),
      amount: `INR ${orderPayload.totalAmount}`,
      customer: orderPayload.customer.name,
      email: orderPayload.customer.email,
      phone: orderPayload.customer.phone || "-",
      razorpay_order_id,
      razorpay_payment_id,
      timestamp: new Date().toISOString(),
    });

    const resendKey = Deno.env.get("VITE_RESEND_API_KEY") ?? "";
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const orderRows = [
            ["Items", String(orderPayload.items.length)],
            ["Amount", `INR ${orderPayload.totalAmount}`],
            ["Customer", orderPayload.customer.name],
            ["Email", orderPayload.customer.email],
            ["Phone", orderPayload.customer.phone || "-"],
          ["Razorpay Order ID", razorpay_order_id],
          ["Razorpay Payment ID", razorpay_payment_id],
          ["Timestamp", new Date().toISOString()],
        ];
        const rowsHtml = orderRows
          .map(([k, v]) => `<tr><td style="padding:8px 10px;font-weight:600;border:1px solid #eee;">${k}</td><td style="padding:8px 10px;border:1px solid #eee;">${v}</td></tr>`)
          .join("");
        const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;"><h2 style="color:#b45309;">Payment Successful</h2><table style="width:100%;border-collapse:collapse;">${rowsHtml}</table></div>`;

        await resend.emails.send({
          from: "AKM Care <onboarding@resend.dev>",
          to: [orderPayload.customer.email, NOTIFICATION_EMAIL],
          subject: `Order Confirmed - ${orderPayload.items.length} item(s)`,
          html,
        });
      } catch (_) {
        // Email failure should not fail paid order processing.
      }
    }

    return new Response(JSON.stringify({ success: true, orderIds: insertedOrderIds }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
