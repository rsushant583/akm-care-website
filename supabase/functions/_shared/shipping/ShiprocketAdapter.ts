/**
 * ShiprocketAdapter — all Shiprocket HTTP calls live here.
 * Never import this from frontend. Credentials from Edge secrets only.
 */
import type {
  AssignCourierResult,
  CancelResult,
  CreateShipmentInput,
  LabelResult,
  PickupResult,
  ProviderShipmentResult,
  RecoverResult,
  ShippingProvider,
  TrackResult,
} from "./ShippingProvider.ts";

const BASE = "https://apiv2.shiprocket.in/v1/external";

function buildCreateOrderPayload(input: CreateShipmentInput): Record<string, unknown> {
  const d = input.destination;
  return {
    order_id: input.channelOrderId,
    order_date: input.orderDate,
    pickup_location: input.pickupLocation,
    billing_customer_name: d.recipientName,
    billing_last_name: "",
    billing_address: d.addressLine1,
    billing_address_2: d.addressLine2 || "",
    billing_city: d.city,
    billing_pincode: d.postalCode,
    billing_state: d.state,
    billing_country: d.country,
    billing_email: d.email || "orders@akmcare.in",
    billing_phone: d.phone.replace(/\D/g, "").slice(-10),
    shipping_is_billing: true,
    order_items: input.items.map((it) => ({
      name: it.name,
      sku: it.sku || "SKU",
      units: it.units,
      selling_price: it.sellingPrice,
      hsn: it.hsn || undefined,
    })),
    payment_method: input.paymentMode,
    sub_total: input.subTotal,
    length: input.parcel.lengthCm,
    breadth: input.parcel.breadthCm,
    height: input.parcel.heightCm,
    weight: input.parcel.weightKg,
  };
}

export class ShiprocketAdapter implements ShippingProvider {
  private token: string | null = null;

  constructor(
    private readonly email: string,
    private readonly password: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  buildCreateOrderPayload(input: CreateShipmentInput): Record<string, unknown> {
    return buildCreateOrderPayload(input);
  }

  async authenticate(): Promise<void> {
    const res = await this.fetchImpl(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.token) {
      throw new Error("Shiprocket authentication failed");
    }
    this.token = String(body.token);
  }

  private async authHeaders(): Promise<Record<string, string>> {
    if (!this.token) await this.authenticate();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    };
  }

  private async request(
    path: string,
    init: RequestInit,
  ): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
    const headers = await this.authHeaders();
    const res = await this.fetchImpl(`${BASE}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers || {}) },
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 401) {
      this.token = null;
      const headers2 = await this.authHeaders();
      const retry = await this.fetchImpl(`${BASE}${path}`, {
        ...init,
        headers: { ...headers2, ...(init.headers || {}) },
      });
      const body2 = (await retry.json().catch(() => ({}))) as Record<string, unknown>;
      return { ok: retry.ok, status: retry.status, body: body2 };
    }
    return { ok: res.ok, status: res.status, body };
  }

  async createShipment(input: CreateShipmentInput): Promise<ProviderShipmentResult> {
    const payload = buildCreateOrderPayload(input);
    const { ok, body } = await this.request("/orders/create/adhoc", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const orderId = body.order_id;
    const shipmentId = body.shipment_id;
    if (!ok || orderId == null || shipmentId == null) {
      throw new Error(String(body.message || body.error || "Shiprocket create shipment failed"));
    }
    return {
      providerOrderId: String(orderId),
      providerShipmentId: String(shipmentId),
      status: "created",
      raw: body,
    };
  }

  async assignCourier(providerShipmentId: string, courierId?: string | null): Promise<AssignCourierResult> {
    const payload: Record<string, unknown> = {
      shipment_id: Number(providerShipmentId) || providerShipmentId,
    };
    if (courierId) payload.courier_id = Number(courierId) || courierId;
    const { ok, body } = await this.request("/courier/assign/awb", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const response = (body.response as Record<string, unknown> | undefined) || body;
    const data = (response.data as Record<string, unknown> | undefined) || response;
    const awb = data.awb_code ?? body.awb_code;
    if (!ok || awb == null || String(awb).trim() === "") {
      throw new Error(String(body.message || body.error || "AWB assignment failed"));
    }
    return {
      awbCode: String(awb),
      courierCompanyId: data.courier_company_id != null ? String(data.courier_company_id) : null,
      courierName: data.courier_name != null ? String(data.courier_name) : null,
      trackingUrl: data.tracking_url != null ? String(data.tracking_url) : null,
      raw: body,
    };
  }

  async generateLabel(providerShipmentId: string): Promise<LabelResult> {
    const { ok, body } = await this.request("/courier/generate/label", {
      method: "POST",
      body: JSON.stringify({ shipment_id: [Number(providerShipmentId) || providerShipmentId] }),
    });
    const labelUrl =
      body.label_url ||
      ((body.response as Record<string, unknown> | undefined)?.label_url as string | undefined);
    if (!ok || !labelUrl) {
      throw new Error(String(body.message || body.error || "Label generation failed"));
    }
    return { labelUrl: String(labelUrl), raw: body };
  }

  async schedulePickup(providerShipmentIds: string[]): Promise<PickupResult> {
    const { ok, body } = await this.request("/courier/generate/pickup", {
      method: "POST",
      body: JSON.stringify({
        shipment_id: providerShipmentIds.map((id) => Number(id) || id),
      }),
    });
    if (!ok) {
      throw new Error(String(body.message || body.error || "Pickup scheduling failed"));
    }
    const pickupStatus = String(
      body.pickup_status ||
        (body.response as Record<string, unknown> | undefined)?.pickup_status ||
        "scheduled",
    );
    return { pickupStatus, raw: body };
  }

  async trackShipment(awbCode: string): Promise<TrackResult> {
    const { ok, body } = await this.request(`/courier/track/awb/${encodeURIComponent(awbCode)}`, {
      method: "GET",
    });
    if (!ok) {
      throw new Error(String(body.message || body.error || "Tracking failed"));
    }
    const tracking = (body.tracking_data as Record<string, unknown> | undefined) || body;
    const trackStatus = (tracking.track_status as number | undefined) ?? null;
    const shipmentTrack = Array.isArray(tracking.shipment_track)
      ? (tracking.shipment_track[0] as Record<string, unknown> | undefined)
      : undefined;
    return {
      currentStatus: shipmentTrack?.current_status != null ? String(shipmentTrack.current_status) : null,
      shipmentStatus: trackStatus != null ? String(trackStatus) : null,
      currentStatusId: shipmentTrack?.sr_status != null ? String(shipmentTrack.sr_status) : null,
      etd: tracking.etd != null ? String(tracking.etd) : null,
      trackingUrl: tracking.track_url != null ? String(tracking.track_url) : null,
      courierName: shipmentTrack?.courier_name != null ? String(shipmentTrack.courier_name) : null,
      raw: body,
    };
  }

  async cancelShipment(providerOrderIds: string[]): Promise<CancelResult> {
    const { ok, body } = await this.request("/orders/cancel", {
      method: "POST",
      body: JSON.stringify({ ids: providerOrderIds.map((id) => Number(id) || id) }),
    });
    if (!ok) {
      throw new Error(String(body.message || body.error || "Cancel shipment failed"));
    }
    return { cancelled: true, raw: body };
  }

  async recoverShipment(channelOrderId: string): Promise<RecoverResult> {
    const { ok, body } = await this.request(`/orders?search=${encodeURIComponent(channelOrderId)}`, {
      method: "GET",
    });
    if (!ok) return { found: false, raw: body };
    const data = Array.isArray(body.data) ? body.data : [];
    const match = data.find(
      (row: Record<string, unknown>) => String(row.channel_order_id || row.order_id || "") === channelOrderId,
    ) as Record<string, unknown> | undefined;
    if (!match) return { found: false, raw: body };
    const shipments = Array.isArray(match.shipments) ? match.shipments : [];
    const first = (shipments[0] as Record<string, unknown> | undefined) || match;
    return {
      found: true,
      providerOrderId: match.id != null ? String(match.id) : null,
      providerShipmentId:
        first.id != null ? String(first.id) : match.shipment_id != null ? String(match.shipment_id) : null,
      awbCode: first.awb != null ? String(first.awb) : null,
      courierName: first.courier != null ? String(first.courier) : null,
      statusLabel: match.status != null ? String(match.status) : null,
      raw: body,
    };
  }
}
