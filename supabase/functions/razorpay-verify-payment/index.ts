import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOTIFICATION_EMAIL = "rsushant583@gmail.com";

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = await req.json();
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = createHmac("sha256", secret).update(body).digest("hex");

    if (expected !== razorpay_signature) {
      return new Response(JSON.stringify({ success: false, error: "Invalid payment signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRole);
    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("id,name,stock_quantity")
      .eq("id", orderData.product_id)
      .maybeSingle();

    if (pErr || !product) {
      return new Response(JSON.stringify({ success: false, error: "Product not found while verifying order" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if ((product.stock_quantity ?? 0) <= 0) {
      return new Response(JSON.stringify({ success: false, error: "Item just went out of stock" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nextStock = Math.max(0, Number(product.stock_quantity) - 1);
    const status = nextStock > 0 ? "available" : "sold_out";

    const { data: updatedRows, error: stockErr } = await supabase
      .from("products")
      .update({ stock_quantity: nextStock, status })
      .eq("id", orderData.product_id)
      .gt("stock_quantity", 0)
      .select("id");
    if (stockErr) throw stockErr;
    if (!updatedRows || updatedRows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Item just went out of stock" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: orderErr } = await supabase.from("orders").insert({
      ...orderData,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_status: "paid",
    });
    if (orderErr) throw orderErr;

    const resendKey = Deno.env.get("VITE_RESEND_API_KEY") ?? "";
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const orderRows = [
          ["Product", orderData.product_name],
          ["Amount", `INR ${orderData.amount}`],
          ["Customer", orderData.customer_name],
          ["Email", orderData.customer_email],
          ["Phone", orderData.customer_phone || "-"],
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
          to: [orderData.customer_email, NOTIFICATION_EMAIL],
          subject: `Order Confirmed - ${orderData.product_name}`,
          html,
        });
      } catch (_) {
        // Email failure should not fail paid order processing.
      }
    }

    return new Response(JSON.stringify({ success: true, nextStock }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
