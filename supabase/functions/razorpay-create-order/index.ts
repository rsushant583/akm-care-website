import Razorpay from "npm:razorpay@2.9.4";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor, json, publicError } from "../_shared/http.ts";

const DEFAULT_SHIPPING: Record<string, number> = { standard: 49, express: 99 };
const FREE_SHIPPING_ABOVE = 999;

type IncomingItem = {
  productId?: string;
  quantity?: number;
  colorName?: string;
  variantName?: string;
};

type HeaderRow = Record<string, unknown> & {
  id: string;
  order_number: string;
  access_token: string;
  user_id: string | null;
  grand_total: number;
  subtotal?: number;
  gst_total?: number;
  shipping_total?: number;
  discount_total?: number;
  coupon_code?: string | null;
  currency?: string;
  payment_status: string;
  razorpay_order_id?: string | null;
  stock_reserved?: boolean;
  coupon_reserved?: boolean;
  pricing_snapshot?: Record<string, unknown>;
};

/** Rupee catalog price → integer paise. Never trust client money. */
function unitPricePaiseFromProduct(p: Record<string, unknown>): number {
  const candidates = [p.akm_care_price, p.selling_price, p.price];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return Math.round(n * 100);
  }
  return 0;
}

function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

function isCheckoutAttemptKey(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isUniqueViolation(err: unknown) {
  const e = err as { code?: string; message?: string };
  const code = String(e?.code || "");
  const msg = String(e?.message || "");
  return code === "23505" || /duplicate|unique/i.test(msg);
}

function ownershipDenied(header: HeaderRow, userId: string | null) {
  const owner = header.user_id ? String(header.user_id) : null;
  if (owner) return !userId || userId !== owner;
  // Guest order: do not hand it to an authenticated account via the attempt key.
  return Boolean(userId);
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

async function loadByIdempotencyKey(supabase: SupabaseClient, key: string) {
  const { data, error } = await supabase
    .from("order_headers")
    .select("*")
    .eq("checkout_idempotency_key", key)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data || []) as HeaderRow[];
  const active = rows.find((r) => ["pending", "created", "paid"].includes(String(r.payment_status)));
  if (active) return { header: active, consumed: false as const };
  const consumed = rows.find((r) => ["failed", "refunded"].includes(String(r.payment_status)));
  if (consumed) return { header: consumed, consumed: true as const };
  return { header: null, consumed: false as const };
}

async function loadOrderItems(supabase: SupabaseClient, orderId: string) {
  const { data, error } = await supabase
    .from("order_items")
    .select("product_id,product_name,quantity,unit_price")
    .eq("order_id", orderId);
  if (error) throw error;
  return (data || []).map((l) => ({
    productId: String(l.product_id || ""),
    productName: String(l.product_name || ""),
    quantity: Number(l.quantity || 0),
    unitPrice: Number(l.unit_price || 0),
  }));
}

function createSuccessBody(params: {
  keyId: string;
  header: HeaderRow;
  razorpayOrderId: string;
  amountPaise: number;
  items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }>;
  paymentStatus: "created" | "paid";
  duplicate: boolean;
}) {
  const grandTotal = Number(params.header.grand_total);
  return {
    success: true,
    duplicate: params.duplicate,
    paymentStatus: params.paymentStatus,
    keyId: params.keyId,
    order: {
      id: params.razorpayOrderId,
      amount: params.amountPaise,
      currency: String(params.header.currency || "INR"),
    },
    amount: grandTotal,
    amountPaise: params.amountPaise,
    orderHeaderId: params.header.id,
    orderNumber: params.header.order_number,
    accessToken: params.header.access_token,
    totals: {
      subtotal: Number(params.header.subtotal || 0),
      gstTotal: Number(params.header.gst_total || 0),
      shippingTotal: Number(params.header.shipping_total || 0),
      discountTotal: Number(params.header.discount_total || 0),
      grandTotal,
      couponCode: params.header.coupon_code ?? null,
    },
    items: params.items,
  };
}

async function markCreateFailed(supabase: SupabaseClient, orderId: string) {
  await supabase
    .from("order_headers")
    .update({
      status: "failed",
      payment_status: "failed",
      stock_reserved: false,
      coupon_reserved: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .neq("payment_status", "paid");
}

async function ensureRazorpayOrder(params: {
  req: Request;
  supabase: SupabaseClient;
  keyId: string;
  keySecret: string;
  header: HeaderRow;
  duplicate: boolean;
  itemCount?: number;
}) {
  const { supabase, keyId, keySecret, duplicate } = params;
  let header = params.header;
  const items = await loadOrderItems(supabase, header.id);
  const amountPaise = Math.round(Number(header.grand_total) * 100);

  if (header.payment_status === "paid") {
    return json(
      params.req,
      200,
      createSuccessBody({
        keyId,
        header,
        razorpayOrderId: String(header.razorpay_order_id || ""),
        amountPaise,
        items,
        paymentStatus: "paid",
        duplicate: true,
      }),
    );
  }

  if (header.razorpay_order_id) {
    return json(
      params.req,
      200,
      createSuccessBody({
        keyId,
        header,
        razorpayOrderId: String(header.razorpay_order_id),
        amountPaise,
        items,
        paymentStatus: "created",
        duplicate,
      }),
    );
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const rpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: String(header.currency || "INR"),
      receipt: String(header.order_number).slice(0, 40),
      notes: {
        order_header_id: header.id,
        order_number: header.order_number,
        itemCount: String(params.itemCount ?? items.length),
      },
    });

    const snapshot = {
      ...((header.pricing_snapshot as Record<string, unknown> | undefined) || {}),
      razorpay_order_id: rpOrder.id,
    };
    const { data: linked } = await supabase
      .from("order_headers")
      .update({
        razorpay_order_id: rpOrder.id,
        payment_status: "created",
        updated_at: new Date().toISOString(),
        pricing_snapshot: snapshot,
      })
      .eq("id", header.id)
      .is("razorpay_order_id", null)
      .neq("payment_status", "paid")
      .neq("payment_status", "failed")
      .select("*")
      .maybeSingle();

    if (!linked) {
      const { data: fresh } = await supabase.from("order_headers").select("*").eq("id", header.id).maybeSingle();
      const latest = fresh as HeaderRow | null;
      if (!latest || ["failed", "refunded"].includes(String(latest.payment_status))) {
        return json(params.req, 409, {
          success: false,
          error: "This payment attempt has ended. Please try again.",
          code: "new_attempt_required",
        });
      }
      if (latest.razorpay_order_id) {
        return json(
          params.req,
          200,
          createSuccessBody({
            keyId,
            header: latest,
            razorpayOrderId: String(latest.razorpay_order_id),
            amountPaise: Math.round(Number(latest.grand_total) * 100),
            items,
            paymentStatus: latest.payment_status === "paid" ? "paid" : "created",
            duplicate: true,
          }),
        );
      }
      return json(params.req, 409, {
        success: false,
        error: "This payment attempt has ended. Please try again.",
        code: "new_attempt_required",
      });
    }

    header = linked as HeaderRow;
    const { data: existingPay } = await supabase.from("payments").select("id").eq("order_id", header.id).limit(1);
    if (!existingPay || existingPay.length === 0) {
      await supabase.from("payments").insert({
        order_id: header.id,
        provider: "razorpay",
        razorpay_order_id: rpOrder.id,
        amount: Number(header.grand_total),
        currency: String(header.currency || "INR"),
        status: "created",
        raw_response: { create: { id: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency } },
      });
    }

    return json(
      params.req,
      200,
      createSuccessBody({
        keyId,
        header,
        razorpayOrderId: String(rpOrder.id),
        amountPaise,
        items,
        paymentStatus: "created",
        duplicate,
      }),
    );
  } catch {
    if (header.stock_reserved) {
      const { data: lines } = await supabase.from("order_items").select("product_id,quantity").eq("order_id", header.id);
      for (const line of lines || []) {
        await supabase.rpc("release_product_stock", {
          p_product_id: line.product_id,
          p_qty: line.quantity,
        });
      }
    }
    if (header.coupon_reserved && header.coupon_code) {
      await supabase.rpc("release_coupon_usage", { p_code: header.coupon_code });
    }
    await markCreateFailed(supabase, header.id);
    return json(params.req, 500, {
      success: false,
      error: "Unable to create payment order. Please try again.",
      code: "new_attempt_required",
    });
  }
}

async function replayOwnedAttempt(
  req: Request,
  supabase: SupabaseClient,
  keyId: string,
  keySecret: string,
  userId: string | null,
  found: { header: HeaderRow; consumed: boolean },
) {
  if (ownershipDenied(found.header, userId)) {
    return json(req, 403, { success: false, error: "This checkout attempt does not belong to this account." });
  }
  if (found.consumed) {
    return json(req, 409, {
      success: false,
      error: "This payment attempt has ended. Please try again.",
      code: "new_attempt_required",
    });
  }
  return ensureRazorpayOrder({
    req,
    supabase,
    keyId,
    keySecret,
    header: found.header,
    duplicate: true,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeadersFor(req) });
  if (req.method !== "POST") return json(req, 405, { success: false, error: "Method Not Allowed" });

  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!keyId || !keySecret || !supabaseUrl || !serviceRole) {
      return json(req, 500, { success: false, error: "Server env missing for payments" });
    }

    const body = await req.json();
    const items = (body.items || []) as IncomingItem[];
    const customer = body.customer || {};
    const address = body.address || {};
    const shippingMethodRaw = String(body.shippingMethod || "standard").toLowerCase();
    const shippingMethod = shippingMethodRaw === "express" ? "express" : "standard";
    const couponCode = body.couponCode ? String(body.couponCode) : undefined;
    const notes = body.notes ? String(body.notes).slice(0, 2000) : null;
    const idempotencyKey = String(body.idempotencyKey || "").trim().toLowerCase();

    if (!isCheckoutAttemptKey(idempotencyKey)) {
      return json(req, 400, { success: false, error: "This checkout attempt is invalid. Please try again." });
    }

    // Bind user from JWT only — never trust body.userId
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization") || "";
    if (anonKey && authHeader.startsWith("Bearer ") && authHeader !== `Bearer ${anonKey}`) {
      try {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data } = await userClient.auth.getUser();
        if (data.user?.id) userId = data.user.id;
      } catch {
        userId = null;
      }
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    const existing = await loadByIdempotencyKey(supabase, idempotencyKey);
    if (existing.header) {
      return await replayOwnedAttempt(req, supabase, keyId, keySecret, userId, existing);
    }

    if (!Array.isArray(items) || items.length === 0) {
      return json(req, 400, { success: false, error: "Cart is empty" });
    }
    if (!customer?.name || !customer?.email) {
      return json(req, 400, { success: false, error: "Customer name and email are required" });
    }
    const phone = customer.phone ? String(customer.phone).replace(/\s+/g, "") : "";
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return json(req, 400, { success: false, error: "A valid 10-digit Indian mobile number is required" });
    }

    const uniqueProductIds = [...new Set(items.map((i) => String(i.productId || "")).filter(Boolean))];
    if (uniqueProductIds.length === 0) {
      return json(req, 400, { success: false, error: "No valid products in cart" });
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
      color_name: string | null;
      variant_name: string | null;
    }> = [];

    let subtotalPaise = 0;
    let gstTotalPaise = 0;

    for (const raw of items) {
      const productId = String(raw.productId || "");
      const qty = Math.max(1, Math.min(100, Math.floor(Number(raw.quantity || 1))));
      const p = productMap.get(productId);
      if (!p) {
        return json(req, 400, { success: false, error: "One or more items are invalid" });
      }
      if (Number(p.stock_quantity ?? 0) < qty) {
        return json(req, 409, { success: false, error: `${p.name} is no longer available in the requested quantity` });
      }

      const unitPricePaise = unitPricePaiseFromProduct(p as Record<string, unknown>);
      if (!(unitPricePaise > 0)) {
        return json(req, 400, { success: false, error: `${p.name} has no valid server price` });
      }

      const lineTotalPaise = unitPricePaise * qty;
      const gstPercent = Number(p.gst_percent ?? 0);
      subtotalPaise += lineTotalPaise;
      gstTotalPaise += Math.round((lineTotalPaise * gstPercent) / 100);

      normalizedLines.push({
        product_id: p.id,
        product_name: p.name,
        sku: p.sku || null,
        quantity: qty,
        unit_price: paiseToRupees(unitPricePaise),
        mrp: p.mrp != null ? Number(p.mrp) : null,
        gst_percent: gstPercent,
        line_total: paiseToRupees(lineTotalPaise),
        image_url: p.image_url || null,
        color_name: raw.colorName ? String(raw.colorName).slice(0, 80) : null,
        variant_name: raw.variantName ? String(raw.variantName).slice(0, 80) : null,
      });
    }

    const subtotal = paiseToRupees(subtotalPaise);
    const gstTotal = paiseToRupees(gstTotalPaise);

    const shippingCfg = await loadShippingConfig(supabase);
    const coupon = await resolveCouponDiscount(supabase, couponCode, subtotal);

    let shippingTotalPaise =
      Math.round((shippingMethod === "express" ? shippingCfg.express : shippingCfg.standard) * 100);
    if (coupon.freeShipping || subtotal >= shippingCfg.freeAbove) {
      shippingTotalPaise = 0;
    }

    const discountTotalPaise = Math.min(subtotalPaise, Math.max(0, Math.round(coupon.discount * 100)));
    const amountPaise = subtotalPaise + shippingTotalPaise - discountTotalPaise;
    const shippingTotal = paiseToRupees(shippingTotalPaise);
    const discountTotal = paiseToRupees(discountTotalPaise);
    const grandTotal = paiseToRupees(amountPaise);

    if (!(amountPaise > 0)) {
      return json(req, 400, { success: false, error: "Order total must be greater than zero" });
    }

    const reservedLines: Array<{ product_id: string; quantity: number }> = [];
    let couponReserved = false;
    const releaseHolds = async () => {
      for (const line of reservedLines.splice(0)) {
        await supabase.rpc("release_product_stock", {
          p_product_id: line.product_id,
          p_qty: line.quantity,
        });
      }
      if (couponReserved && coupon.code) {
        await supabase.rpc("release_coupon_usage", { p_code: coupon.code });
        couponReserved = false;
      }
    };

    if (coupon.code) {
      const { data: reservedCoupon } = await supabase.rpc("reserve_coupon_usage", { p_code: coupon.code });
      if (!reservedCoupon || reservedCoupon.ok !== true) {
        return json(req, 409, { success: false, error: "This coupon is no longer available" });
      }
      couponReserved = true;
    }

    for (const line of normalizedLines) {
      const { data: reserved } = await supabase.rpc("reserve_product_stock", {
        p_product_id: line.product_id,
        p_qty: line.quantity,
      });
      if (!reserved || reserved.ok !== true) {
        await releaseHolds();
        return json(req, 409, {
          success: false,
          error: `${line.product_name} is no longer available in the requested quantity`,
        });
      }
      reservedLines.push({ product_id: line.product_id, quantity: line.quantity });
    }

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
      stockReserved: true,
      couponReserved,
      lines: normalizedLines.map((l) => ({
        productId: l.product_id,
        quantity: l.quantity,
        unitPrice: l.unit_price,
        lineTotal: l.line_total,
      })),
      amountPaise,
      moneyUnit: "paise",
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
        customer_phone: phone,
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
        stock_reserved: true,
        coupon_reserved: couponReserved,
        checkout_idempotency_key: idempotencyKey,
      })
      .select("*")
      .single();
    if (orderErr) {
      await releaseHolds();
      if (isUniqueViolation(orderErr)) {
        const raced = await loadByIdempotencyKey(supabase, idempotencyKey);
        if (raced.header) {
          return await replayOwnedAttempt(req, supabase, keyId, keySecret, userId, raced);
        }
      }
      throw orderErr;
    }

    const { error: itemsErr } = await supabase.from("order_items").insert(
      normalizedLines.map((l) => ({ ...l, order_id: order.id })),
    );
    if (itemsErr) {
      await releaseHolds();
      await markCreateFailed(supabase, order.id);
      throw itemsErr;
    }

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

    return await ensureRazorpayOrder({
      req,
      supabase,
      keyId,
      keySecret,
      header: order as HeaderRow,
      duplicate: false,
      itemCount: normalizedLines.length,
    });
  } catch (e) {
    return json(req, 500, { success: false, error: publicError(e, "Unable to create payment order. Please try again.") });
  }
});
