/** Shared paid-order fulfillment — used by browser verify and Razorpay webhooks. */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const NOTIFICATION_EMAIL = Deno.env.get("OPS_NOTIFICATION_EMAIL") ?? "rsushant583@gmail.com";

export function escapeHtml(value: unknown) {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendWhatsAppOrderNotification(payload: Record<string, unknown>) {
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
  } catch {
    /* ignore */
  }
}

type HeaderRow = Record<string, unknown> & {
  id: string;
  order_number: string;
  access_token: string;
  grand_total: number;
  payment_status: string;
  status: string;
  stock_reserved?: boolean;
  coupon_reserved?: boolean;
  coupon_code?: string | null;
  fulfillment_notified_at?: string | null;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string | null;
  user_id?: string | null;
};

export async function fulfillPaidOrder(params: {
  supabase: SupabaseClient;
  header: HeaderRow;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string | null;
  rpPayment: Record<string, unknown>;
  source: "verify" | "webhook";
}): Promise<{ duplicate: boolean; legacyOrderIds: string[]; notified: boolean }> {
  const { supabase, razorpayOrderId, razorpayPaymentId, razorpaySignature, rpPayment, source } = params;

  const { data: fresh, error: freshErr } = await supabase
    .from("order_headers")
    .select("*")
    .eq("id", params.header.id)
    .maybeSingle();
  if (freshErr) throw freshErr;
  const header = (fresh || params.header) as HeaderRow;

  if (header.payment_status === "paid" || header.status === "paid") {
    return { duplicate: true, legacyOrderIds: [], notified: Boolean(header.fulfillment_notified_at) };
  }

  const { data: paidExisting } = await supabase
    .from("payments")
    .select("id")
    .eq("razorpay_payment_id", razorpayPaymentId)
    .eq("status", "captured")
    .limit(1);
  if (paidExisting && paidExisting.length > 0) {
    return { duplicate: true, legacyOrderIds: [], notified: Boolean(header.fulfillment_notified_at) };
  }

  const { data: lines, error: linesErr } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", header.id);
  if (linesErr) throw linesErr;
  if (!lines || lines.length === 0) {
    throw new Error("Order has no line items");
  }

  const alreadyReserved = Boolean(header.stock_reserved);
  const productIds = [...new Set(lines.map((l: { product_id: string }) => l.product_id).filter(Boolean))];
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id,name,stock_quantity")
    .in("id", productIds);
  if (pErr) throw pErr;
  const pMap = new Map((products || []).map((p: { id: string }) => [p.id, p]));

  if (!alreadyReserved) {
    for (const line of lines) {
      const qty = Number(line.quantity);
      const { data: reserved, error: rErr } = await supabase.rpc("reserve_product_stock", {
        p_product_id: line.product_id,
        p_qty: qty,
      });
      if (rErr) throw rErr;
      if (!reserved || reserved.ok !== true) {
        throw new Error(`${line.product_name} went out of stock`);
      }
    }
  }

  const legacyOrderIds: string[] = [];
  for (const line of lines) {
    const qty = Number(line.quantity);
    const p = pMap.get(line.product_id) as { stock_quantity?: number } | undefined;
    const prevStock = Number(p?.stock_quantity ?? 0);
    const newStock = alreadyReserved ? prevStock : Math.max(0, prevStock - qty);

    const { data: existingLegacy } = await supabase
      .from("orders")
      .select("id")
      .eq("razorpay_payment_id", razorpayPaymentId)
      .eq("product_id", line.product_id)
      .limit(1);
    if (existingLegacy && existingLegacy.length > 0) {
      legacyOrderIds.push(existingLegacy[0].id);
      continue;
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
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature || null,
        order_group_id: razorpayOrderId,
        order_header_id: header.id,
        user_id: header.user_id,
        payment_status: "paid",
        notes: { itemCount: lines.length, order_number: header.order_number, source },
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
      reason: alreadyReserved ? `Razorpay ${source} (held at create)` : `Razorpay ${source}`,
    });
  }

  const nextStatus = ["pending", "failed", "cancelled", "paid"].includes(String(header.status))
    ? "confirmed"
    : String(header.status);

  await supabase
    .from("order_headers")
    .update({
      status: nextStatus,
      payment_status: "paid",
      stock_reserved: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", header.id);

  await supabase
    .from("payments")
    .update({
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature || null,
      status: "captured",
      method: rpPayment.method || "razorpay",
      amount: Number(header.grand_total),
      raw_response: {
        source,
        payment_id: razorpayPaymentId,
        order_id: razorpayOrderId,
        status: rpPayment.status,
        method: rpPayment.method,
        amount: rpPayment.amount,
        currency: rpPayment.currency,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", header.id)
    .eq("razorpay_order_id", razorpayOrderId);

  await supabase.from("order_status").insert({
    order_id: header.id,
    status: "confirmed",
    note: `Payment captured via ${source}`,
  });

  if (header.coupon_code && !header.coupon_reserved) {
    await supabase.rpc("reserve_coupon_usage", { p_code: header.coupon_code });
    await supabase
      .from("order_headers")
      .update({ coupon_reserved: true, updated_at: new Date().toISOString() })
      .eq("id", header.id);
  }

  let notified = Boolean(header.fulfillment_notified_at);
  if (!notified) {
    const { data: claimed } = await supabase
      .from("order_headers")
      .update({ fulfillment_notified_at: new Date().toISOString() })
      .eq("id", header.id)
      .is("fulfillment_notified_at", null)
      .select("id")
      .maybeSingle();

    if (claimed) {
      await sendWhatsAppOrderNotification({
        order_number: header.order_number,
        amount: `INR ${header.grand_total}`,
        customer: header.customer_name,
        email: header.customer_email,
        phone: header.customer_phone || "-",
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        source,
        timestamp: new Date().toISOString(),
      });

      const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
      if (resendKey && header.customer_email) {
        try {
          const resend = new Resend(resendKey);
          const orderRows = [
            ["Order", header.order_number],
            ["Amount", `INR ${header.grand_total}`],
            ["Customer", header.customer_name],
            ["Email", header.customer_email],
            ["Phone", header.customer_phone || "-"],
            ["Razorpay Order ID", razorpayOrderId],
            ["Razorpay Payment ID", razorpayPaymentId],
          ];
          const rowsHtml = orderRows
            .map(
              ([k, v]) =>
                `<tr><td style="padding:8px 10px;font-weight:600;border:1px solid #eee;">${escapeHtml(k)}</td><td style="padding:8px 10px;border:1px solid #eee;">${escapeHtml(v)}</td></tr>`,
            )
            .join("");
          const html =
            `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;"><h2 style="color:#b45309;">Payment received</h2><table style="width:100%;border-collapse:collapse;">${rowsHtml}</table></div>`;
          await resend.emails.send({
            from: "AKM Care <onboarding@resend.dev>",
            to: [String(header.customer_email), NOTIFICATION_EMAIL],
            subject: `Payment received - ${header.order_number}`,
            html,
          });
        } catch {
          /* Email failure must not reverse payment. */
        }
      }
      notified = true;
    }
  }

  return { duplicate: false, legacyOrderIds, notified };
}

export async function releaseCheckoutHolds(supabase: SupabaseClient, header: HeaderRow) {
  if (header.payment_status === "paid") return;

  if (header.stock_reserved) {
    const { data: lines } = await supabase.from("order_items").select("product_id, quantity").eq("order_id", header.id);
    for (const line of lines || []) {
      await supabase.rpc("release_product_stock", {
        p_product_id: line.product_id,
        p_qty: Number(line.quantity),
      });
    }
  }

  if (header.coupon_reserved && header.coupon_code) {
    await supabase.rpc("release_coupon_usage", { p_code: header.coupon_code });
  }

  await supabase
    .from("order_headers")
    .update({
      stock_reserved: false,
      coupon_reserved: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", header.id)
    .neq("payment_status", "paid");
}
