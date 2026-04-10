import { Resend } from "npm:resend@4.0.0";

const NOTIFICATION_EMAIL = "rsushant583@gmail.com";

function row(label: string, value: string | number | undefined | null) {
  return `<tr><td style="padding:8px 10px;font-weight:600;border:1px solid #eee;">${label}</td><td style="padding:8px 10px;border:1px solid #eee;">${value ?? "-"}</td></tr>`;
}

function htmlTemplate(title: string, rows: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;">
    <h2 style="color:#b45309;">${title}</h2>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const resend = new Resend(Deno.env.get("VITE_RESEND_API_KEY") ?? "");
    const { event, payload } = await req.json();
    const timestamp = new Date().toISOString();

    let subject = "AKM Care Notification";
    let html = "";

    if (event === "contact") {
      subject = "New Contact — AKM Care Website";
      html = htmlTemplate("New Contact Submission", [
        row("Name", payload?.name),
        row("Email", payload?.email),
        row("Phone", payload?.phone),
        row("Service Interested In", payload?.service),
        row("Message", payload?.message),
        row("Timestamp", timestamp),
      ].join(""));
    } else if (event === "feedback") {
      subject = "New Feedback — AKM Care Website";
      html = htmlTemplate("New Feedback", [
        row("Name", payload?.name),
        row("Rating", payload?.rating),
        row("Message", payload?.message),
        row("Page", payload?.page),
        row("Timestamp", timestamp),
      ].join(""));
    } else if (event === "product_interest") {
      subject = "Product Interest Alert — AKM Care Shop";
      html = htmlTemplate("New Product Interest", [
        row("Customer Name", payload?.name),
        row("Customer Email", payload?.email),
        row("Product Name", payload?.product_name),
        row("Timestamp", timestamp),
      ].join(""));
    } else if (event === "career") {
      subject = "New Career Application — AKM Care";
      html = htmlTemplate("New Career Application", [
        row("Applicant Name", payload?.name),
        row("Email", payload?.email),
        row("Phone", payload?.phone),
        row("Role interested in", payload?.role),
        row("Message", payload?.message),
        row("Timestamp", timestamp),
      ].join(""));
    }

    const result = await resend.emails.send({
      from: "AKM Care <onboarding@resend.dev>",
      to: NOTIFICATION_EMAIL,
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
