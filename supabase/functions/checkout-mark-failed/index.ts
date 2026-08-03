import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Method Not Allowed" });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRole) {
      return json(500, { success: false, error: "Server env missing" });
    }

    const body = await req.json();
    const orderHeaderId = String(body.orderHeaderId || "");
    const accessToken = String(body.accessToken || "");
    const note = String(body.note || "Payment failed").slice(0, 500);

    if (!orderHeaderId || !accessToken) {
      return json(400, { success: false, error: "orderHeaderId and accessToken required" });
    }

    const supabase = createClient(supabaseUrl, serviceRole);
    const { data: header, error } = await supabase
      .from("order_headers")
      .select("id, payment_status, status")
      .eq("id", orderHeaderId)
      .eq("access_token", accessToken)
      .maybeSingle();
    if (error) throw error;
    if (!header) return json(404, { success: false, error: "Order not found" });
    if (header.payment_status === "paid") {
      return json(400, { success: false, error: "Paid orders cannot be marked failed" });
    }

    await supabase
      .from("order_headers")
      .update({
        status: "failed",
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderHeaderId)
      .eq("access_token", accessToken);

    await supabase.from("order_status").insert({
      order_id: orderHeaderId,
      status: "failed",
      note,
    });

    await supabase
      .from("payments")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("order_id", orderHeaderId)
      .neq("status", "captured");

    return json(200, { success: true });
  } catch (e) {
    return json(500, { success: false, error: String(e) });
  }
});
