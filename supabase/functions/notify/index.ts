import { Resend } from "npm:resend@4.0.0";

const NOTIFICATION_EMAIL = Deno.env.get("OPS_NOTIFICATION_EMAIL") ?? "rsushant583@gmail.com";

const ALLOWED_EVENTS = new Set([
  "contact",
  "feedback",
  "product_interest",
  "career",
  "vendor",
  "order_confirmation",
  "payment_success",
  "shipping_confirmation",
  "order_delivered",
]);

function escapeHtml(value: unknown) {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, value: unknown) {
  return `<tr><td style="padding:8px 10px;font-weight:600;border:1px solid #eee;">${escapeHtml(label)}</td><td style="padding:8px 10px;border:1px solid #eee;">${escapeHtml(value)}</td></tr>`;
}

function htmlTemplate(title: string, rows: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;">
    <h2 style="color:#b45309;">${escapeHtml(title)}</h2>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
  </div>`;
}

function truncate(value: unknown, max = 2000) {
  const s = String(value ?? "");
  return s.length > max ? s.slice(0, max) : s;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("VITE_RESEND_API_KEY") ?? "";
    if (!resendKey) {
      return Response.json({ success: false, error: "Email not configured" }, { status: 500 });
    }

    const resend = new Resend(resendKey);
    const { event, payload } = await req.json();
    const timestamp = new Date().toISOString();

    if (!ALLOWED_EVENTS.has(String(event || ""))) {
      return Response.json({ success: false, error: "Unsupported event" }, { status: 400 });
    }

    // Never trust client-provided recipient — ops inbox only (C5)
    const to = NOTIFICATION_EMAIL;

    let subject = "AKM Care Notification";
    let html = "";

    if (event === "contact") {
      subject = "New Contact — AKM Care Website";
      html = htmlTemplate("New Contact Submission", [
        row("Name", truncate(payload?.name, 200)),
        row("Email", truncate(payload?.email, 320)),
        row("Phone", truncate(payload?.phone, 40)),
        row("Service Interested In", truncate(payload?.service, 200)),
        row("Message", truncate(payload?.message)),
        row("Timestamp", timestamp),
      ].join(""));
    } else if (event === "feedback") {
      subject = "New Feedback — AKM Care Website";
      html = htmlTemplate("New Feedback", [
        row("Name", truncate(payload?.name, 200)),
        row("Rating", truncate(payload?.rating, 20)),
        row("Message", truncate(payload?.message)),
        row("Page", truncate(payload?.page, 200)),
        row("Timestamp", timestamp),
      ].join(""));
    } else if (event === "product_interest") {
      subject = "Product Interest Alert — AKM Care Shop";
      html = htmlTemplate("New Product Interest", [
        row("Customer Name", truncate(payload?.name, 200)),
        row("Customer Email", truncate(payload?.email, 320)),
        row("Product Name", truncate(payload?.product_name, 300)),
        row("Timestamp", timestamp),
      ].join(""));
    } else if (event === "career") {
      subject = "New Career Application — AKM Care";
      html = htmlTemplate("New Career Application", [
        row("Applicant Name", truncate(payload?.name, 200)),
        row("Email", truncate(payload?.email, 320)),
        row("Phone", truncate(payload?.phone, 40)),
        row("Role interested in", truncate(payload?.role, 200)),
        row("Message", truncate(payload?.message)),
        row("Timestamp", timestamp),
      ].join(""));
    } else if (event === "vendor") {
      subject = "New Vendor Application — AKM Care Marketplace";
      html = htmlTemplate("New Vendor Application", [
        row("Business Name", truncate(payload?.business_name, 300)),
        row("Owner Name", truncate(payload?.owner_name, 200)),
        row("Email", truncate(payload?.email, 320)),
        row("Mobile", truncate(payload?.mobile, 40)),
        row("GST Number", truncate(payload?.gst_number, 40)),
        row("Product Category", truncate(payload?.product_category, 200)),
        row("Business Address", truncate(payload?.business_address)),
        row("Product Description", truncate(payload?.product_description)),
        row("Website / Social Links", truncate(payload?.website_links)),
        row("Documents", truncate(JSON.stringify(payload?.documents ?? []), 1000)),
        row("Timestamp", timestamp),
      ].join(""));
    } else {
      // order_* lifecycle events — ops copy only; no arbitrary HTML from client
      subject = `AKM Care — ${String(event)}`;
      html = htmlTemplate(String(event), [
        row("Order", truncate((payload as { orderNumber?: string })?.orderNumber, 64)),
        row("Customer", truncate((payload as { customer?: { name?: string } })?.customer?.name, 200)),
        row("Email", truncate((payload as { customer?: { email?: string } })?.customer?.email, 320)),
        row("Payload", truncate(JSON.stringify(payload), 3000)),
        row("Timestamp", timestamp),
      ].join(""));
    }

    const result = await resend.emails.send({
      from: "AKM Care <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
