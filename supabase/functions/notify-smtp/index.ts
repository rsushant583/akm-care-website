import nodemailer from "npm:nodemailer@6.9.15";

const NOTIFICATION_EMAIL = "rsushant583@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function html(title: string, payload: Record<string, unknown>) {
  const rows = Object.entries(payload)
    .map(([k, v]) => `<tr><td style="padding:8px 10px;font-weight:600;border:1px solid #eee;">${k}</td><td style="padding:8px 10px;border:1px solid #eee;">${String(v ?? "-")}</td></tr>`)
    .join("");
  return `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;">
    <h2 style="color:#b45309;">${title}</h2>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  try {
    const smtpUser = Deno.env.get("SMTP_USER") ?? "";
    const smtpPass = Deno.env.get("SMTP_PASS") ?? "";
    if (!smtpUser || !smtpPass) {
      return new Response(JSON.stringify({ success: false, error: "SMTP env missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { event, payload } = await req.json();
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const titleMap: Record<string, string> = {
      contact: "New Contact Submission",
      feedback: "New Feedback Submission",
      product_interest: "New Product Interest Submission",
      career: "New Career Application",
      order_paid: "New Paid Order",
    };

    await transporter.sendMail({
      from: `"AKM Care" <${smtpUser}>`,
      to: NOTIFICATION_EMAIL,
      subject: `AKM Alert: ${titleMap[event] ?? "Website Notification"}`,
      html: html(titleMap[event] ?? "Website Notification", {
        ...(payload || {}),
        timestamp: new Date().toISOString(),
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
