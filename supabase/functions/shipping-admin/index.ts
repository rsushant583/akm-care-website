import { corsHeadersFor, json, publicError } from "../_shared/http.ts";
import { serviceClient } from "../_shared/adminAuth.ts";
import { requireShippingAdmin, createShiprocketFromEnv } from "../_shared/shipping/adminGate.ts";
import { ShiprocketAdapter } from "../_shared/shipping/ShiprocketAdapter.ts";
import { ShippingService } from "../_shared/shipping/ShippingService.ts";
import { logShippingOps } from "../_shared/shipping/ops.ts";

type Action =
  | "create"
  | "assign_awb"
  | "generate_label"
  | "schedule_pickup"
  | "track"
  | "cancel"
  | "recover"
  | "get";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeadersFor(req) });
  if (req.method !== "POST") return json(req, 405, { success: false, error: "Method Not Allowed" });

  try {
    const service = serviceClient();
    const auth = await requireShippingAdmin(req, service);
    if (!auth.ok) return auth.response;

    const body = (await req.json().catch(() => ({}))) as { action?: string; orderId?: string };
    const action = String(body.action || "").toLowerCase() as Action;
    const orderId = String(body.orderId || "").trim();
    if (!orderId) return json(req, 400, { success: false, error: "orderId is required" });

    const allowed: Action[] = [
      "create",
      "assign_awb",
      "generate_label",
      "schedule_pickup",
      "track",
      "cancel",
      "recover",
      "get",
    ];
    if (!allowed.includes(action)) {
      return json(req, 400, { success: false, error: "Unsupported action" });
    }

    // Read-only get does not require provider enabled
    if (action === "get") {
      const { email, password, pickup } = createShiprocketFromEnv();
      const adapter = new ShiprocketAdapter(email || "disabled@local", password || "disabled");
      const svc = new ShippingService(service, adapter, pickup || "Primary");
      const shipment = await svc.getActiveForward(orderId);
      const enabled = String(Deno.env.get("SHIPPING_PROVIDER_ENABLED") || "false").toLowerCase() === "true";
      return json(req, 200, {
        success: true,
        enabled,
        shipment,
      });
    }

    const { enabled, email, password, pickup } = createShiprocketFromEnv();
    if (!enabled) {
      return json(req, 503, {
        success: false,
        error:
          "Shipping provider is disabled. Set SHIPPING_PROVIDER_ENABLED=true after credentials and parcel profile are configured.",
        enabled: false,
      });
    }
    if (!email || !password || !pickup) {
      return json(req, 503, {
        success: false,
        error: "Shiprocket credentials or pickup location are not configured on the server.",
      });
    }

    const adapter = new ShiprocketAdapter(email, password);
    const svc = new ShippingService(service, adapter, pickup);
    const adminId = auth.admin.user.id;

    let shipment;
    switch (action) {
      case "create":
        shipment = await svc.createShipment(orderId, adminId);
        break;
      case "assign_awb":
        shipment = await svc.assignAwb(orderId);
        break;
      case "generate_label":
        shipment = await svc.generateLabel(orderId);
        break;
      case "schedule_pickup":
        shipment = await svc.schedulePickup(orderId);
        break;
      case "track":
        shipment = await svc.track(orderId);
        break;
      case "cancel":
        shipment = await svc.cancel(orderId);
        break;
      case "recover":
        shipment = await svc.recover(orderId, adminId);
        break;
      default:
        return json(req, 400, { success: false, error: "Unsupported action" });
    }

    return json(req, 200, { success: true, enabled: true, shipment });
  } catch (e) {
    const msg = publicError(e, "Shipping action failed");
    logShippingOps("shipping_provider_error", { error: msg });
    return json(req, 400, { success: false, error: msg });
  }
});
