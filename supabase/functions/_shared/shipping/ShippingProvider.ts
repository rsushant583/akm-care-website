import type { ParcelProfile } from "./parcelProfile.ts";
import type { ShippingDestinationSnapshot } from "./addressSnapshot.ts";
import type { ShippingStatus } from "./statusMap.ts";

export type CreateShipmentInput = {
  channelOrderId: string;
  orderDate: string;
  paymentMode: "Prepaid";
  destination: ShippingDestinationSnapshot;
  parcel: ParcelProfile;
  items: Array<{
    name: string;
    sku: string;
    units: number;
    sellingPrice: number;
    hsn?: string | null;
  }>;
  pickupLocation: string;
  subTotal: number;
};

export type ProviderShipmentResult = {
  providerOrderId: string;
  providerShipmentId: string;
  status: ShippingStatus;
  raw: Record<string, unknown>;
};

export type AssignCourierResult = {
  awbCode: string;
  courierCompanyId?: string | null;
  courierName?: string | null;
  trackingUrl?: string | null;
  raw: Record<string, unknown>;
};

export type LabelResult = {
  labelUrl: string;
  raw: Record<string, unknown>;
};

export type PickupResult = {
  pickupStatus: string;
  raw: Record<string, unknown>;
};

export type TrackResult = {
  currentStatus?: string | null;
  shipmentStatus?: string | null;
  currentStatusId?: string | number | null;
  etd?: string | null;
  trackingUrl?: string | null;
  courierName?: string | null;
  raw: Record<string, unknown>;
};

export type CancelResult = {
  cancelled: boolean;
  raw: Record<string, unknown>;
};

export type RecoverResult = {
  found: boolean;
  providerOrderId?: string | null;
  providerShipmentId?: string | null;
  awbCode?: string | null;
  courierName?: string | null;
  statusLabel?: string | null;
  raw: Record<string, unknown>;
};

export interface ShippingProvider {
  authenticate(): Promise<void>;
  createShipment(input: CreateShipmentInput): Promise<ProviderShipmentResult>;
  assignCourier(providerShipmentId: string, courierId?: string | null): Promise<AssignCourierResult>;
  generateLabel(providerShipmentId: string): Promise<LabelResult>;
  schedulePickup(providerShipmentIds: string[]): Promise<PickupResult>;
  trackShipment(awbCode: string): Promise<TrackResult>;
  cancelShipment(providerOrderIds: string[]): Promise<CancelResult>;
  recoverShipment(channelOrderId: string): Promise<RecoverResult>;
}
