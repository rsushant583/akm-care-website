import { describe, expect, it } from "vitest";
import { getProductCompleteness } from "@/lib/admin/productCompleteness";
import { buildPublicContact, FALLBACK_PUBLIC_CONTACT } from "@/lib/storefront/publicContact";
import { mergeSpecifications } from "@/lib/ecommerce/productPresentation";

describe("productCompleteness", () => {
  it("scores core gaps and lists missing presentation fields", () => {
    const result = getProductCompleteness({
      name: "AKMC SANI - 1007",
      category: "sarees",
      mrp: 500,
      akm_care_price: 468,
      stock_quantity: 2,
      images: ["https://example.com/a.jpg"],
      spec_colour: "",
      spec_fabric: "",
      spec_care: "",
    });
    expect(result.percent).toBeGreaterThan(0);
    expect(result.percent).toBeLessThan(100);
    expect(result.missing.some((m) => m.id === "fabric")).toBe(true);
    expect(result.tips.some((t) => /code|title/i.test(t))).toBe(true);
  });
});

describe("publicContact", () => {
  it("falls back to approved constants when settings empty", () => {
    const info = buildPublicContact({});
    expect(info.email).toBe(FALLBACK_PUBLIC_CONTACT.email);
    expect(info.whatsappHref).toContain(FALLBACK_PUBLIC_CONTACT.whatsappWaMe);
    expect(info.fromSettings).toBe(false);
  });

  it("prefers site_settings contact and catalog whatsapp", () => {
    const info = buildPublicContact({
      contact: { phones: ["+91 99999 88888"], emails: ["hello@akmcare.in"], address: "Test Address" },
      catalog: { whatsapp: "9999988888", business_hours: "Mon–Fri 10–6" },
    });
    expect(info.email).toBe("hello@akmcare.in");
    expect(info.whatsappWaMe).toBe("919999988888");
    expect(info.businessHours).toBe("Mon–Fri 10–6");
    expect(info.fromSettings).toBe(true);
  });
});

describe("mergeSpecifications safety", () => {
  it("preserves unrelated keys when updating care", () => {
    const next = mergeSpecifications(
      { colour: "Turquoise", blouse: "Matching", packing: "Box", care: "Old" },
      { care: "Dry clean only" },
    );
    expect(next.colour).toBe("Turquoise");
    expect(next.blouse).toBe("Matching");
    expect(next.packing).toBe("Box");
    expect(next.care).toBe("Dry clean only");
  });
});
