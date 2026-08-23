import { describe, expect, it } from "vitest";
import { buildShiprocketCreateOrderPayload } from "./shiprocketDto";

describe("Shiprocket create DTO", () => {
  it("builds prepaid create-order payload from AKM snapshot", () => {
    const payload = buildShiprocketCreateOrderPayload({
      channelOrderId: "AKM20260823001",
      orderDate: "2026-08-23",
      paymentMode: "Prepaid",
      pickupLocation: "Primary",
      subTotal: 1999,
      destination: {
        recipientName: "Asha",
        phone: "+91 98765 43210",
        email: "a@x.com",
        addressLine1: "12 Ring Road",
        addressLine2: "",
        city: "Ahmedabad",
        state: "Gujarat",
        postalCode: "380001",
        country: "India",
      },
      parcel: { weightKg: 0.5, lengthCm: 30, breadthCm: 20, heightCm: 5 },
      items: [{ name: "Saree", sku: "SKU1", units: 1, sellingPrice: 1999 }],
    });
    expect(payload.order_id).toBe("AKM20260823001");
    expect(payload.payment_method).toBe("Prepaid");
    expect(payload.weight).toBe(0.5);
    expect(payload.length).toBe(30);
    expect(payload.billing_phone).toBe("9876543210");
    expect(payload.shipping_is_billing).toBe(true);
  });
});
