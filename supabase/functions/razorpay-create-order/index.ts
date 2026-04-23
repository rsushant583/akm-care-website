import Razorpay from "npm:razorpay@2.9.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!keyId || !keySecret || !supabaseUrl || !serviceRole) {
      return new Response(JSON.stringify({ success: false, error: "Server env missing for payments" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { items, customer } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Cart is empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRole);
    const uniqueProductIds = [...new Set(items.map((i: { productId: string }) => i.productId))];
    const { data: products, error } = await supabase
      .from("products")
      .select("id,name,price,stock_quantity")
      .in("id", uniqueProductIds);
    if (error) throw error;

    const productMap = new Map((products || []).map((p) => [p.id, p]));
    let total = 0;
    const normalizedItems: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }> = [];
    for (const raw of items) {
      const qty = Math.max(1, Math.min(10, Number(raw.quantity || 1)));
      const p = productMap.get(raw.productId);
      if (!p) {
        return new Response(JSON.stringify({ success: false, error: "One or more items are invalid" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (Number(p.stock_quantity ?? 0) < qty) {
        return new Response(JSON.stringify({ success: false, error: `${p.name} is low on stock` }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const unitPrice = Number(p.price);
      total += unitPrice * qty;
      normalizedItems.push({
        productId: p.id,
        productName: p.name,
        quantity: qty,
        unitPrice,
      });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: `akm_${Date.now()}`,
      notes: { itemCount: String(normalizedItems.length), customerEmail: String(customer?.email || "") },
    });

    return new Response(JSON.stringify({ success: true, order, keyId, items: normalizedItems, amount: total }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
