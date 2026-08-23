/**
 * ShippingService — orchestrates provider + DB.
 * NEVER mutates payment_status, payments, or stock.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildDestinationSnapshot,
  validateDestinationSnapshot,
  type ShippingDestinationSnapshot,
} from "./addressSnapshot.ts";
import { resolveParcelProfile, type ParcelProfile } from "./parcelProfile.ts";
import type { ShippingProvider } from "./ShippingProvider.ts";
import {
  canAdvanceFulfillment,
  canAdvanceShippingStatus,
  mapProviderStatusToShipping,
  suggestedFulfillmentFromShipping,
  toProjectionStatus,
  type ShippingStatus,
} from "./statusMap.ts";
import { enqueueShippingNotification, logShippingOps } from "./ops.ts";

export type SanitizedShipment = {
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
  destination_snapshot: ShippingDestinationSnapshot | Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function sanitizeShipment(row: Record<string, unknown>): SanitizedShipment {
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    kind: String(row.kind || "forward"),
    provider: String(row.provider || "shiprocket"),
    provider_order_id: row.provider_order_id != null ? String(row.provider_order_id) : null,
    provider_shipment_id: row.provider_shipment_id != null ? String(row.provider_shipment_id) : null,
    channel_order_id: row.channel_order_id != null ? String(row.channel_order_id) : null,
    awb_code: row.awb_code != null ? String(row.awb_code) : null,
    courier_company_id: row.courier_company_id != null ? String(row.courier_company_id) : null,
    courier_name: row.courier_name != null ? String(row.courier_name) : null,
    tracking_url: row.tracking_url != null ? String(row.tracking_url) : null,
    label_url: row.label_url != null ? String(row.label_url) : null,
    status: String(row.status),
    pickup_status: row.pickup_status != null ? String(row.pickup_status) : null,
    etd: row.etd != null ? String(row.etd) : null,
    weight_kg: row.weight_kg != null ? Number(row.weight_kg) : null,
    length_cm: row.length_cm != null ? Number(row.length_cm) : null,
    breadth_cm: row.breadth_cm != null ? Number(row.breadth_cm) : null,
    height_cm: row.height_cm != null ? Number(row.height_cm) : null,
    last_error: row.last_error != null ? String(row.last_error) : null,
    destination_snapshot: (row.destination_snapshot as Record<string, unknown>) || {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function isProviderEnabled(): boolean {
  return String(Deno.env.get("SHIPPING_PROVIDER_ENABLED") || "false").toLowerCase() === "true";
}

export class ShippingService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly provider: ShippingProvider,
    private readonly pickupLocation: string,
  ) {}

  async getActiveForward(orderId: string): Promise<SanitizedShipment | null> {
    const { data } = await this.supabase
      .from("shipping_shipments")
      .select(
        "id,order_id,kind,provider,provider_order_id,provider_shipment_id,channel_order_id,awb_code,courier_company_id,courier_name,tracking_url,label_url,status,pickup_status,etd,weight_kg,length_cm,breadth_cm,height_cm,last_error,destination_snapshot,created_at,updated_at",
      )
      .eq("order_id", orderId)
      .eq("kind", "forward")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? sanitizeShipment(data as Record<string, unknown>) : null;
  }

  private async loadOrder(orderId: string) {
    const { data: header, error } = await this.supabase
      .from("order_headers")
      .select(
        "id,order_number,status,payment_status,customer_name,customer_email,customer_phone,shipping_address,shipping_method,subtotal,grand_total,shipping_total",
      )
      .eq("id", orderId)
      .maybeSingle();
    if (error) throw error;
    if (!header) throw new Error("Order not found");
    return header as Record<string, unknown>;
  }

  private async loadItems(orderId: string) {
    const { data, error } = await this.supabase
      .from("order_items")
      .select("product_id,product_name,sku,quantity,unit_price,line_total")
      .eq("order_id", orderId);
    if (error) throw error;
    return data || [];
  }

  private async loadParcel(orderId: string, items: Array<{ product_id?: string | null }>): Promise<ParcelProfile> {
    const { data: setting } = await this.supabase
      .from("site_settings")
      .select("value")
      .eq("key", "parcel_profile")
      .maybeSingle();

    let productOverride: Record<string, unknown> | null = null;
    const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))] as string[];
    if (productIds.length === 1) {
      const { data: product } = await this.supabase
        .from("products")
        .select("package_weight_kg,package_length_cm,package_breadth_cm,package_height_cm")
        .eq("id", productIds[0])
        .maybeSingle();
      if (product) productOverride = product as Record<string, unknown>;
    }

    const resolved = resolveParcelProfile({
      storeDefault: setting?.value,
      productOverride,
    });
    if (!resolved.ok) throw new Error(resolved.message);
    return resolved.profile;
  }

  private async syncProjection(
    orderId: string,
    patch: {
      status: string;
      carrier?: string | null;
      tracking_number?: string | null;
      shipped_at?: string | null;
      delivered_at?: string | null;
      method?: string | null;
    },
  ) {
    const { data: existing } = await this.supabase
      .from("shipping")
      .select("id,method")
      .eq("order_id", orderId)
      .maybeSingle();

    const row = {
      status: patch.status,
      carrier: patch.carrier ?? null,
      tracking_number: patch.tracking_number ?? null,
      shipped_at: patch.shipped_at ?? null,
      delivered_at: patch.delivered_at ?? null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await this.supabase.from("shipping").update(row).eq("order_id", orderId);
    } else {
      await this.supabase.from("shipping").insert({
        order_id: orderId,
        method: patch.method || "standard",
        ...row,
      });
    }
  }

  private async maybeAdvanceFulfillment(orderId: string, currentStatus: string, shippingStatus: ShippingStatus) {
    const next = suggestedFulfillmentFromShipping(shippingStatus);
    if (!next) return;
    if (!canAdvanceFulfillment(currentStatus, next)) return;
    const { error } = await this.supabase
      .from("order_headers")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) {
      // Transition trigger may reject; do not fail shipping update.
      logShippingOps("shipping_provider_error", {
        order_id: orderId,
        detail: "fulfillment_transition_skipped",
        from: currentStatus,
        to: next,
      });
      return;
    }
    await this.supabase.from("order_status").insert({
      order_id: orderId,
      status: next,
      note: `Fulfillment advanced from shipping status ${shippingStatus}`,
    });
  }

  private assertProviderEnabled() {
    if (!isProviderEnabled()) {
      throw new Error(
        "Shipping provider is disabled. Set SHIPPING_PROVIDER_ENABLED=true after credentials and parcel profile are configured.",
      );
    }
  }

  async createShipment(orderId: string, adminUserId: string): Promise<SanitizedShipment> {
    this.assertProviderEnabled();
    const existing = await this.getActiveForward(orderId);
    if (existing) {
      logShippingOps("shipment_created", { order_id: orderId, shipment_id: existing.id, replay: true });
      return existing;
    }

    const header = await this.loadOrder(orderId);
    if (String(header.payment_status) !== "paid") {
      throw new Error("Order must be paid before creating a shipment.");
    }
    const fulfillment = String(header.status);
    if (["cancelled", "refunded", "failed", "pending"].includes(fulfillment)) {
      throw new Error("Order fulfillment state does not allow shipment creation.");
    }

    const destination = buildDestinationSnapshot({
      customerName: header.customer_name as string,
      customerEmail: header.customer_email as string,
      customerPhone: header.customer_phone as string | null,
      shippingAddress: header.shipping_address as Record<string, unknown>,
    });
    const destCheck = validateDestinationSnapshot(destination);
    if (!destCheck.ok) {
      throw new Error(`Missing shipping destination fields: ${destCheck.missing.join(", ")}`);
    }

    const items = await this.loadItems(orderId);
    if (!items.length) throw new Error("Order has no line items");
    const parcel = await this.loadParcel(orderId, items);

    try {
      await this.provider.authenticate();
      const created = await this.provider.createShipment({
        channelOrderId: String(header.order_number),
        orderDate: new Date().toISOString().slice(0, 10),
        paymentMode: "Prepaid",
        destination: destCheck.snapshot,
        parcel,
        items: items.map((it: Record<string, unknown>) => ({
          name: String(it.product_name),
          sku: String(it.sku || "SKU"),
          units: Number(it.quantity),
          sellingPrice: Number(it.unit_price),
        })),
        pickupLocation: this.pickupLocation,
        subTotal: Number(header.subtotal || header.grand_total || 0),
      });

      const now = new Date().toISOString();
      const { data: inserted, error } = await this.supabase
        .from("shipping_shipments")
        .insert({
          order_id: orderId,
          kind: "forward",
          provider: "shiprocket",
          provider_order_id: created.providerOrderId,
          provider_shipment_id: created.providerShipmentId,
          channel_order_id: String(header.order_number),
          status: "created",
          weight_kg: parcel.weightKg,
          length_cm: parcel.lengthCm,
          breadth_cm: parcel.breadthCm,
          height_cm: parcel.heightCm,
          destination_snapshot: destCheck.snapshot,
          provider_created_at: now,
          created_by: adminUserId,
          raw_last_response: created.raw,
          updated_at: now,
        })
        .select(
          "id,order_id,kind,provider,provider_order_id,provider_shipment_id,channel_order_id,awb_code,courier_company_id,courier_name,tracking_url,label_url,status,pickup_status,etd,weight_kg,length_cm,breadth_cm,height_cm,last_error,destination_snapshot,created_at,updated_at",
        )
        .single();

      if (error) {
        // Unique race: return existing
        const raced = await this.getActiveForward(orderId);
        if (raced) return raced;
        throw error;
      }

      await this.syncProjection(orderId, {
        status: toProjectionStatus("created"),
        method: (header.shipping_method as string) || "standard",
      });
      await this.supabase.from("order_status").insert({
        order_id: orderId,
        status: fulfillment,
        note: `Shipment created (provider order ${created.providerOrderId})`,
      });

      enqueueShippingNotification({
        event: "shipment_created",
        orderId,
        orderNumber: String(header.order_number),
        shipmentId: String(inserted.id),
      });
      logShippingOps("shipment_created", {
        order_id: orderId,
        shipment_id: String(inserted.id),
        provider_order_id: created.providerOrderId,
      });
      return sanitizeShipment(inserted as Record<string, unknown>);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Shipment creation failed";
      logShippingOps("shipment_failed", { order_id: orderId, error: msg });
      throw e;
    }
  }

  async assignAwb(orderId: string): Promise<SanitizedShipment> {
    this.assertProviderEnabled();
    const shipment = await this.requireActive(orderId);
    if (shipment.awb_code) return shipment;
    if (!shipment.provider_shipment_id) throw new Error("Provider shipment id missing");

    await this.provider.authenticate();
    const assigned = await this.provider.assignCourier(shipment.provider_shipment_id);
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("shipping_shipments")
      .update({
        awb_code: assigned.awbCode,
        courier_company_id: assigned.courierCompanyId,
        courier_name: assigned.courierName,
        tracking_url: assigned.trackingUrl,
        status: "awb_assigned",
        awb_assigned_at: now,
        raw_last_response: assigned.raw,
        last_error: null,
        updated_at: now,
      })
      .eq("id", shipment.id)
      .select(
        "id,order_id,kind,provider,provider_order_id,provider_shipment_id,channel_order_id,awb_code,courier_company_id,courier_name,tracking_url,label_url,status,pickup_status,etd,weight_kg,length_cm,breadth_cm,height_cm,last_error,destination_snapshot,created_at,updated_at",
      )
      .single();
    if (error) throw error;

    await this.syncProjection(orderId, {
      status: toProjectionStatus("awb_assigned"),
      carrier: assigned.courierName,
      tracking_number: assigned.awbCode,
    });
    logShippingOps("awb_assigned", { order_id: orderId, awb: assigned.awbCode });
    return sanitizeShipment(data as Record<string, unknown>);
  }

  async generateLabel(orderId: string): Promise<SanitizedShipment> {
    this.assertProviderEnabled();
    const shipment = await this.requireActive(orderId);
    if (shipment.label_url) return shipment;
    if (!shipment.provider_shipment_id) throw new Error("Provider shipment id missing");
    if (!shipment.awb_code) throw new Error("Assign AWB before generating a label");

    await this.provider.authenticate();
    const label = await this.provider.generateLabel(shipment.provider_shipment_id);
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("shipping_shipments")
      .update({
        label_url: label.labelUrl,
        raw_last_response: label.raw,
        last_error: null,
        updated_at: now,
      })
      .eq("id", shipment.id)
      .select(
        "id,order_id,kind,provider,provider_order_id,provider_shipment_id,channel_order_id,awb_code,courier_company_id,courier_name,tracking_url,label_url,status,pickup_status,etd,weight_kg,length_cm,breadth_cm,height_cm,last_error,destination_snapshot,created_at,updated_at",
      )
      .single();
    if (error) throw error;
    logShippingOps("label_generated", { order_id: orderId, shipment_id: shipment.id });
    return sanitizeShipment(data as Record<string, unknown>);
  }

  async schedulePickup(orderId: string): Promise<SanitizedShipment> {
    this.assertProviderEnabled();
    const shipment = await this.requireActive(orderId);
    if (shipment.status === "pickup_scheduled" || SHIPPING_PAST_PICKUP.has(shipment.status)) {
      return shipment;
    }
    if (!shipment.provider_shipment_id) throw new Error("Provider shipment id missing");
    if (!shipment.awb_code) throw new Error("Assign AWB before scheduling pickup");

    await this.provider.authenticate();
    const pickup = await this.provider.schedulePickup([shipment.provider_shipment_id]);
    const now = new Date().toISOString();
    const nextStatus: ShippingStatus = "pickup_scheduled";
    const { data, error } = await this.supabase
      .from("shipping_shipments")
      .update({
        pickup_status: pickup.pickupStatus,
        status: nextStatus,
        pickup_scheduled_at: now,
        raw_last_response: pickup.raw,
        last_error: null,
        updated_at: now,
      })
      .eq("id", shipment.id)
      .select(
        "id,order_id,kind,provider,provider_order_id,provider_shipment_id,channel_order_id,awb_code,courier_company_id,courier_name,tracking_url,label_url,status,pickup_status,etd,weight_kg,length_cm,breadth_cm,height_cm,last_error,destination_snapshot,created_at,updated_at",
      )
      .single();
    if (error) throw error;
    await this.syncProjection(orderId, {
      status: toProjectionStatus(nextStatus),
      carrier: shipment.courier_name,
      tracking_number: shipment.awb_code,
    });
    logShippingOps("pickup_scheduled", { order_id: orderId, shipment_id: shipment.id });
    return sanitizeShipment(data as Record<string, unknown>);
  }

  async track(orderId: string): Promise<SanitizedShipment> {
    this.assertProviderEnabled();
    const shipment = await this.requireActive(orderId);
    if (!shipment.awb_code) throw new Error("No AWB to track");

    await this.provider.authenticate();
    const tracked = await this.provider.trackShipment(shipment.awb_code);
    const mapped = mapProviderStatusToShipping({
      currentStatus: tracked.currentStatus,
      shipmentStatus: tracked.shipmentStatus,
      currentStatusId: tracked.currentStatusId,
    });

    let nextStatus = shipment.status as ShippingStatus;
    if (mapped && canAdvanceShippingStatus(shipment.status, mapped)) {
      nextStatus = mapped;
    }

    const header = await this.loadOrder(orderId);
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      raw_last_response: tracked.raw,
      last_error: null,
      updated_at: now,
    };
    if (tracked.etd) patch.etd = tracked.etd;
    if (tracked.trackingUrl) patch.tracking_url = tracked.trackingUrl;
    if (tracked.courierName) patch.courier_name = tracked.courierName;
    if (nextStatus !== shipment.status) {
      patch.status = nextStatus;
      if (nextStatus === "picked_up") patch.picked_up_at = now;
      if (nextStatus === "in_transit") patch.in_transit_at = now;
      if (nextStatus === "out_for_delivery") patch.out_for_delivery_at = now;
      if (nextStatus === "delivered") patch.delivered_at = now;
      if (nextStatus === "rto") patch.rto_at = now;
    }

    const { data, error } = await this.supabase
      .from("shipping_shipments")
      .update(patch)
      .eq("id", shipment.id)
      .select(
        "id,order_id,kind,provider,provider_order_id,provider_shipment_id,channel_order_id,awb_code,courier_company_id,courier_name,tracking_url,label_url,status,pickup_status,etd,weight_kg,length_cm,breadth_cm,height_cm,last_error,destination_snapshot,created_at,updated_at",
      )
      .single();
    if (error) throw error;

    await this.syncProjection(orderId, {
      status: toProjectionStatus(nextStatus),
      carrier: (data.courier_name as string) || shipment.courier_name,
      tracking_number: shipment.awb_code,
      shipped_at: nextStatus === "picked_up" || nextStatus === "in_transit" ? now : undefined,
      delivered_at: nextStatus === "delivered" ? now : undefined,
    });
    if (nextStatus !== shipment.status) {
      await this.maybeAdvanceFulfillment(orderId, String(header.status), nextStatus);
      const noteEvent = suggestedFulfillmentFromShipping(nextStatus);
      if (noteEvent) {
        enqueueShippingNotification({
          event: nextStatus === "rto" ? "rto" : (nextStatus as "picked_up" | "in_transit" | "out_for_delivery" | "delivered"),
          orderId,
          orderNumber: String(header.order_number),
          shipmentId: shipment.id,
          awbCode: shipment.awb_code,
        });
      }
    }
    logShippingOps("tracking_refreshed", { order_id: orderId, status: nextStatus });
    return sanitizeShipment(data as Record<string, unknown>);
  }

  async cancel(orderId: string): Promise<SanitizedShipment> {
    this.assertProviderEnabled();
    const shipment = await this.requireActive(orderId);
    if (!canAdvanceShippingStatus(shipment.status, "cancelled")) {
      throw new Error("Cannot cancel shipment after pickup. Use recovery flow if needed.");
    }
    if (shipment.provider_order_id) {
      await this.provider.authenticate();
      await this.provider.cancelShipment([shipment.provider_order_id]);
    }
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("shipping_shipments")
      .update({
        status: "cancelled",
        cancelled_at: now,
        last_error: null,
        updated_at: now,
      })
      .eq("id", shipment.id)
      .select(
        "id,order_id,kind,provider,provider_order_id,provider_shipment_id,channel_order_id,awb_code,courier_company_id,courier_name,tracking_url,label_url,status,pickup_status,etd,weight_kg,length_cm,breadth_cm,height_cm,last_error,destination_snapshot,created_at,updated_at",
      )
      .single();
    if (error) throw error;
    await this.syncProjection(orderId, { status: "cancelled" });
    await this.supabase.from("order_status").insert({
      order_id: orderId,
      status: String((await this.loadOrder(orderId)).status),
      note: "Shipment cancelled via admin",
    });
    return sanitizeShipment(data as Record<string, unknown>);
  }

  async recover(orderId: string, adminUserId: string): Promise<SanitizedShipment> {
    this.assertProviderEnabled();
    const existing = await this.getActiveForward(orderId);
    if (existing?.provider_shipment_id) return existing;

    const header = await this.loadOrder(orderId);
    await this.provider.authenticate();
    const recovered = await this.provider.recoverShipment(String(header.order_number));
    if (!recovered.found || !recovered.providerShipmentId) {
      throw new Error("No provider shipment found for this order number.");
    }

    if (existing) {
      const now = new Date().toISOString();
      const { data, error } = await this.supabase
        .from("shipping_shipments")
        .update({
          provider_order_id: recovered.providerOrderId,
          provider_shipment_id: recovered.providerShipmentId,
          awb_code: recovered.awbCode,
          courier_name: recovered.courierName,
          raw_last_response: recovered.raw,
          last_error: null,
          updated_at: now,
        })
        .eq("id", existing.id)
        .select(
          "id,order_id,kind,provider,provider_order_id,provider_shipment_id,channel_order_id,awb_code,courier_company_id,courier_name,tracking_url,label_url,status,pickup_status,etd,weight_kg,length_cm,breadth_cm,height_cm,last_error,destination_snapshot,created_at,updated_at",
        )
        .single();
      if (error) throw error;
      return sanitizeShipment(data as Record<string, unknown>);
    }

    // Create local row from recovery without calling create again
    const destination = buildDestinationSnapshot({
      customerName: header.customer_name as string,
      customerEmail: header.customer_email as string,
      customerPhone: header.customer_phone as string | null,
      shippingAddress: header.shipping_address as Record<string, unknown>,
    });
    const items = await this.loadItems(orderId);
    const profile = await this.loadParcel(orderId, items);
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("shipping_shipments")
      .insert({
        order_id: orderId,
        kind: "forward",
        provider: "shiprocket",
        provider_order_id: recovered.providerOrderId,
        provider_shipment_id: recovered.providerShipmentId,
        channel_order_id: String(header.order_number),
        awb_code: recovered.awbCode,
        courier_name: recovered.courierName,
        status: recovered.awbCode ? "awb_assigned" : "created",
        weight_kg: profile.weightKg,
        length_cm: profile.lengthCm,
        breadth_cm: profile.breadthCm,
        height_cm: profile.heightCm,
        destination_snapshot: destination,
        created_by: adminUserId,
        provider_created_at: now,
        awb_assigned_at: recovered.awbCode ? now : null,
        raw_last_response: recovered.raw,
        updated_at: now,
      })
      .select(
        "id,order_id,kind,provider,provider_order_id,provider_shipment_id,channel_order_id,awb_code,courier_company_id,courier_name,tracking_url,label_url,status,pickup_status,etd,weight_kg,length_cm,breadth_cm,height_cm,last_error,destination_snapshot,created_at,updated_at",
      )
      .single();
    if (error) {
      const raced = await this.getActiveForward(orderId);
      if (raced) return raced;
      throw error;
    }
    await this.syncProjection(orderId, {
      status: toProjectionStatus(recovered.awbCode ? "awb_assigned" : "created"),
      carrier: recovered.courierName,
      tracking_number: recovered.awbCode,
      method: (header.shipping_method as string) || "standard",
    });
    return sanitizeShipment(data as Record<string, unknown>);
  }

  private async requireActive(orderId: string): Promise<SanitizedShipment> {
    const shipment = await this.getActiveForward(orderId);
    if (!shipment) throw new Error("No active shipment for this order");
    return shipment;
  }
}

const SHIPPING_PAST_PICKUP = new Set([
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "rto",
]);
