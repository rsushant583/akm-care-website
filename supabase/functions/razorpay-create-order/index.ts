import Razorpay from "npm:razorpay@2.9.4";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SHIPPING: Record<string, number> = { standard: 49, express: 99 };
const FREE_SHIPPING_ABOVE = 999;

type IncomingItem = { productId?: string; quantity?: number };

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function unitPriceFromProduct(p: Record<string, unknown>): number {
  const candidates = [p.akm_care_price, p.selling_price, p.price];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

async function loadShippingConfig(supabase: SupabaseClient) {
  const { data } = await supabase.from("site_settings").select("value").eq("key", "shipping").maybeSingle();
  const value = (data?.value || {}) as Record<string, unknown>;
  return {
    standard: Number(value.standard ?? DEFAULT_SHIPPING.standard),
    express: Number(value.express ?? DEFAULT_SHIPPING.express),
    freeAbove: Number(value.free_above ?? FREE_SHIPPING_ABOVE),
  };
}

async function resolveCouponDiscount(
  supabase: SupabaseClient,
  code: string | undefined,
  subtotal: number,
): Promise<{ discount: number; code: string | null; freeShipping: boolean }> {
  if (!code || !String(code).trim()) return { discount: 0, code: null, freeShipping: false };
  const normalized = String(code).trim().toUpperCase();
  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (!coupon) return { discount: 0, code: null, freeShipping: false };

  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return { discount: 0, code: null, freeShipping: false };
  }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) {
    return { discount: 0, code: null, freeShipping: false };
  }
  if (coupon.usage_limit != null && Number(coupon.used_count ?? 0) >= Number(coupon.usage_limit)) {
    return { discount: 0, code: null, freeShipping: false };
  }
  if (subtotal < Number(coupon.min_purchase ?? 0)) {
    return { discount: 0, code: null, freeShipping: false };
  }

  if (coupon.discount_type === "free_shipping") {
    return { discount: 0, code: normalized, freeShipping: true };
  }
  if (coupon.discount_type === "percentage") {
    const pct = Math.max(0, Math.min(100, Number(coupon.discount_value ?? 0)));
    return { discount: Math.round((subtotal * pct) / 100), code: normalized, freeShipping: false };
  }
  if (coupon.discount_type === "flat") {
    return {
      discount: Math.min(subtotal, Math.max(0, Number(coupon.discount_value ?? 0))),
      code: normalized,
      freeShipping: false,
    };
  }
  return { discount: 0, code: null, freeShipping: false };
}

function orderNumber() {
  const stamp = new Date();
  const y = stamp.getFullYear().toString().slice(2);
  const m = String(stamp.getMonth() + 1).padStart(2, "0");
  const d = String(stamp.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return `AKM${y}${m}${d}${rand}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Method Not Allowed" });

  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!keyId || !keySecret || !supabaseUrl || !serviceRole) {
      return json(500, { success: false, error: "Server env missing for payments" });
    }

    const body = await req.json();
    const items = (body.items || []) as IncomingItem[];
    const customer = body.customer || {};
    const address = body.address || {};
    const shippingMethodRaw = String(body.shippingMethod || "standard").toLowerCase();
    const shippingMethod = shippingMethodRaw === "express" ? "express" : "standard";
    const couponCode = body.couponCode ? String(body.couponCode) : undefined;
    const notes = body.notes ? String(body.notes).slice(0, 2000) : null;
    const userId = body.userId && typeof body.userId === "string" ? body.userId : null;

    if (!Array.isArray(items) || items.length === 0) {
      return json(400, { success: false, error: "Cart is empty" });
    }
    if (!customer?.name || !customer?.email) {
      return json(400, { success: false, error: "Customer name and email are required" });
    }

    const supabase = createClient(supabaseUrl, serviceRole);
    const uniqueProductIds = [...new Set(items.map((i) => String(i.productId || "")).filter(Boolean))];
    if (uniqueProductIds.length === 0) {
      return json(400, { success: false, error: "No valid products in cart" });
    }

    const { data: products, error } = await supabase
      .from("products")
      .select("id,name,sku,price,akm_care_price,selling_price,mrp,gst_percent,stock_quantity,image_url")
      .in("id", uniqueProductIds);
    if (error) throw error;

    const productMap = new Map((products || []).map((p) => [p.id, p]));
    const normalizedLines: Array<{
      product_id: string;
      product_name: string;
      sku: string | null;
      quantity: number;
      unit_price: number;
      mrp: number | null;
      gst_percent: number;
      line_total: number;
      image_url: string | null;
    }> = [];

    let subtotal = 0;
    let gstTotal = 0;

    for (const raw of items) {
      const productId = String(raw.productId || "");
      const qty = Math.max(1, Math.min(100, Math.floor(Number(raw.quantity || 1))));
      const p = productMap.get(productId);
      if (!p) {
        return json(400, { success: false, error: "One or more items are invalid" });
      }
      if (Number(p.stock_quantity ?? 0) < qty) {
        return json(409, { success: false, error: `${p.name} is low on stock` });
      }

      const unitPrice = unitPriceFromProduct(p as Record<string, unknown>);
      if (!(unitPrice > 0)) {
        return json(400, { success: false, error: `${p.name} has no valid server price` });
      }

      const lineTotal = unitPrice * qty;
      const gstPercent = Number(p.gst_percent ?? 0);
      subtotal += lineTotal;
      gstTotal += Math.round((lineTotal * gstPercent) / 100);

      normalizedLines.push({
        product_id: p.id,
        product_name: p.name,
        sku: p.sku || null,
        quantity: qty,
        unit_price: unitPrice,
        mrp: p.mrp != null ? Number(p.mrp) : null,
        gst_percent: gstPercent,
        line_total: lineTotal,
        image_url: p.image_url || null,
      });
    }

    const shippingCfg = await loadShippingConfig(supabase);
    const coupon = await resolveCouponDiscount(supabase, couponCode, subtotal);

    let shippingTotal = shippingMethod === "express" ? shippingCfg.express : shippingCfg.standard;
    if (coupon.freeShipping || subtotal >= shippingCfg.freeAbove) {
      shippingTotal = 0;
    }

    const discountTotal = Math.min(subtotal, Math.max(0, coupon.discount));
    const grandTotal = Math.round((subtotal + shippingTotal - discountTotal) * 100) / 100;

    if (!(grandTotal > 0)) {
      return json(400, { success: false, error: "Order total must be greater than zero" });
    }

    const amountPaise = Math.round(grandTotal * 100);
    const generatedOrderNumber = orderNumber();
    const accessToken = crypto.randomUUID();

    const pricingSnapshot = {
      subtotal,
      gstTotal,
      shippingTotal,
      discountTotal,
      grandTotal,
      shippingMethod,
      couponCode: coupon.code,
      currency: "INR",
      lines: normalizedLines.map((l) => ({
        productId: l.product_id,
        quantity: l.quantity,
        unitPrice: l.unit_price,
        lineTotal: l.line_total,
      })),
      amountPaise,
      computedAt: new Date().toISOString(),
    };

    const { data: order, error: orderErr } = await supabase
      .from("order_headers")
      .insert({
        order_number: generatedOrderNumber,
        access_token: accessToken,
        user_id: userId,
        customer_name: String(customer.name).slice(0, 200),
        customer_email: String(customer.email).slice(0, 320),
        customer_phone: customer.phone ? String(customer.phone).slice(0, 40) : null,
        shipping_address: address,
        subtotal,
        gst_total: gstTotal,
        shipping_total: shippingTotal,
        discount_total: discountTotal,
        coupon_code: coupon.code,
        grand_total: grandTotal,
        currency: "INR",
        status: "pending",
        payment_status: "pending",
        shipping_method: shippingMethod,
        notes,
        pricing_snapshot: pricingSnapshot,
      })
      .select("*")
      .single();
    if (orderErr) throw orderErr;

    const { error: itemsErr } = await supabase.from("order_items").insert(
      normalizedLines.map((l) => ({ ...l, order_id: order.id })),
    );
    if (itemsErr) throw itemsErr;

    await supabase.from("order_status").insert({
      order_id: order.id,
      status: "pending",
      note: "Order created by server checkout",
    });

    await supabase.from("shipping").insert({
      order_id: order.id,
      method: shippingMethod,
      status: "pending",
      estimated_days: shippingMethod === "express" ? 2 : 5,
    });

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const rpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: order.order_number.slice(0, 40),
      notes: {
        order_header_id: order.id,
        order_number: order.order_number,
        itemCount: String(normalizedLines.length),
        customerEmail: String(customer.email || ""),
      },
    });

    const { error: linkErr } = await supabase
      .from("order_headers")
      .update({
        razorpay_order_id: rpOrder.id,
        payment_status: "created",
        updated_at: new Date().toISOString(),
        pricing_snapshot: { ...pricingSnapshot, razorpay_order_id: rpOrder.id },
      })
      .eq("id", order.id);
    if (linkErr) throw linkErr;

    await supabase.from("payments").insert({
      order_id: order.id,
      provider: "razorpay",
      razorpay_order_id: rpOrder.id,
      amount: grandTotal,
      currency: "INR",
      status: "created",
      raw_response: { create: rpOrder },
    });

    return json(200, {
      success: true,
      keyId,
      order: rpOrder,
      amount: grandTotal,
      amountPaise,
      orderHeaderId: order.id,
      orderNumber: order.order_number,
      accessToken: order.access_token,
      totals: {
        subtotal,
        gstTotal,
        shippingTotal,
        discountTotal,
        grandTotal,
        couponCode: coupon.code,
      },
      items: normalizedLines.map((l) => ({
        productId: l.product_id,
        productName: l.product_name,
        quantity: l.quantity,
        unitPrice: l.unit_price,
      })),
    });
  } catch (e) {
    return json(500, { success: false, error: String(e) });
  }
});
