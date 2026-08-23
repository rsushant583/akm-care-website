import { describe, expect, it } from "vitest";
import { buildDestinationSnapshot, validateDestinationSnapshot } from "./addressSnapshot";

describe("addressSnapshot", () => {
  it("builds from order header snapshot keys", () => {
    const snap = buildDestinationSnapshot({
      customerName: "Test User",
      customerEmail: "a@b.com",
      customerPhone: "9876543210",
      shippingAddress: {
        fullName: "Test User",
        phone: "9876543210",
        area: "12 MG Road",
        landmark: "Near park",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380001",
        country: "India",
      },
    });
    expect(snap.addressLine1).toBe("12 MG Road");
    expect(snap.postalCode).toBe("380001");
    expect(validateDestinationSnapshot(snap).ok).toBe(true);
  });

  it("rejects incomplete destination", () => {
    const snap = buildDestinationSnapshot({
      customerName: "X",
      customerEmail: "a@b.com",
      shippingAddress: { city: "Ahmedabad" },
    });
    const v = validateDestinationSnapshot(snap);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.missing.length).toBeGreaterThan(0);
  });

  it("does not use saved addresses table — only provided snapshot", () => {
    const snap = buildDestinationSnapshot({
      customerName: "Only Order",
      customerEmail: "o@x.com",
      customerPhone: "9999999999",
      shippingAddress: {
        fullName: "Only Order",
        phone: "9999999999",
        area: "Line1",
        city: "Surat",
        state: "Gujarat",
        pincode: "395003",
        country: "India",
      },
    });
    expect(snap.recipientName).toBe("Only Order");
  });
});
