import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  buildDestinationSnapshot,
  validateDestinationSnapshot,
} from "@/lib/shipping/addressSnapshot";
import { PACKAGE_REQUIRED_MESSAGE, parseParcelProfile, PARCEL_PROFILE_SETTINGS_KEY } from "@/lib/shipping/parcelProfile";

export type AdminShipmentView = {
  id: string;
  order_id: string;
  kind: string;
  provider: string;
  provider_order_id: string | null;
  provider_shipment_id: string | null;
  channel_order_id: string | null;
  awb_code: string | null;
  courier_company_id: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  label_url: string | null;
  status: string;
  pickup_status: string | null;
  etd: string | null;
  weight_kg: number | null;
  length_cm: number | null;
  breadth_cm: number | null;
  height_cm: number | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type ShippingAction =
  | "create"
  | "assign_awb"
  | "generate_label"
  | "schedule_pickup"
  | "track"
  | "cancel"
  | "recover"
  | "get";

export type ShippingAdminResponse = {
  success: boolean;
  enabled?: boolean;
  shipment?: AdminShipmentView | null;
  error?: string;
};

async function invokeShippingAdmin(
  action: ShippingAction,
  orderId: string,
): Promise<ShippingAdminResponse> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const { data: sessionData } = await client.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Admin sign-in required");

  const { data, error } = await client.functions.invoke("shipping-admin", {
    body: { action, orderId },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) {
    const msg = error.message || "Shipping action failed";
    // Functions may return JSON error body
    throw new Error(msg);
  }
  const body = (data || {}) as ShippingAdminResponse;
  if (!body.success) {
    throw new Error(body.error || "Shipping action failed");
  }
  return body;
}

export async function getAdminShipment(orderId: string): Promise<ShippingAdminResponse> {
  return invokeShippingAdmin("get", orderId);
}

export async function runShippingAction(
  action: Exclude<ShippingAction, "get">,
  orderId: string,
): Promise<ShippingAdminResponse> {
  return invokeShippingAdmin(action, orderId);
}

export type CreateShipmentReadiness = {
  canCreate: boolean;
  reasons: string[];
  providerEnabled: boolean | null;
  parcelConfigured: boolean;
  destinationOk: boolean;
};

export async function assessCreateShipmentReadiness(order: {
  payment_status: string;
  status: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  shipping_address?: Record<string, unknown> | null;
}): Promise<CreateShipmentReadiness> {
  const reasons: string[] = [];
  if (String(order.payment_status) !== "paid") reasons.push("Order must be paid.");
  if (["cancelled", "refunded", "failed", "pending"].includes(String(order.status))) {
    reasons.push("Order fulfillment state does not allow shipment creation.");
  }

  const dest = buildDestinationSnapshot({
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    shippingAddress: order.shipping_address,
  });
  const destCheck = validateDestinationSnapshot(dest);
  if (!destCheck.ok) {
    reasons.push(`Missing shipping destination: ${destCheck.missing.join(", ")}`);
  }

  let parcelConfigured = false;
  const client = getSupabaseClient();
  if (client) {
    const { data } = await client
      .from("site_settings")
      .select("value")
      .eq("key", PARCEL_PROFILE_SETTINGS_KEY)
      .maybeSingle();
    parcelConfigured = Boolean(parseParcelProfile(data?.value));
  }
  if (!parcelConfigured) reasons.push(PACKAGE_REQUIRED_MESSAGE);

  return {
    canCreate: reasons.length === 0,
    reasons,
    providerEnabled: null,
    parcelConfigured,
    destinationOk: destCheck.ok,
  };
}
