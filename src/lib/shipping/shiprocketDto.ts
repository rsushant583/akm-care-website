/** Pure Shiprocket create-order DTO builder — shared by adapter + unit tests. */

export type ShiprocketCreateInput = {
  channelOrderId: string;
  orderDate: string;
  paymentMode: "Prepaid";
  pickupLocation: string;
  subTotal: number;
  destination: {
    recipientName: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  parcel: {
    weightKg: number;
    lengthCm: number;
    breadthCm: number;
    heightCm: number;
  };
  items: Array<{
    name: string;
    sku: string;
    units: number;
    sellingPrice: number;
    hsn?: string | null;
  }>;
};

export function buildShiprocketCreateOrderPayload(input: ShiprocketCreateInput): Record<string, unknown> {
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
