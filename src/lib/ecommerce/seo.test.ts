import { describe, expect, it } from "vitest";
import { productFactFaqs, productSeo } from "./seo";
import type { CatalogProduct } from "./types";

function sample(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "1",
    slug: "silk-saree",
    name: "Turquoise Zari Silk Saree",
    shortDescription: "A festive silk saree with zari work.",
    detailedDescription: "Woven silk saree listed in the AKM Care catalog.",
    images: [{ src: "/catalog/saree.png", alt: "Turquoise zari silk saree" }],
    sku: "AKMCTQZ",
    productCode: "AKMCTQZ",
    quantity: 5,
    dimensions: "6.2 Mtrs APX",
    variants: [],
    colors: [],
    mrp: 4290,
    sellingPrice: 3699,
    akmCarePrice: 3699,
    discountPercent: 14,
    gstPercent: 5,
    hsn: "540752",
    shippingTime: "3–5 business days",
    warranty: "NA",
    status: "available",
    category: "sarees",
    categoryLabel: "Sarees",
    brand: "AKM Care",
    returnPolicy: "7 days return policy — unused product with original packing",
    tags: ["saree"],
    reviewCount: 0,
    displayOrder: 0,
    createdAt: "2026-01-01",
    price: 3699,
    image_url: "/catalog/saree.png",
    stock_quantity: 5,
    description: "A festive silk saree with zari work.",
    ...overrides,
  };
}

describe("productSeo", () => {
  it("uses the product name in the title and does not fabricate ratings", () => {
    const seo = productSeo(sample({ rating: 4.5, reviewCount: 0 }));
    expect(seo.title).toBe("Turquoise Zari Silk Saree");
    expect(seo.canonical).toBe("/shop/product/silk-saree");
    expect(seo.schema.aggregateRating).toBeUndefined();
    expect(seo.schema.offers.price).toBe("3699");
    expect(seo.schema.sku).toBe("AKMCTQZ");
  });

  it("omits sku and ratings when they are not real", () => {
    const seo = productSeo(sample({ sku: "NA", productCode: "-", rating: undefined, reviewCount: 0 }));
    expect(seo.schema.sku).toBeUndefined();
    expect(seo.schema.aggregateRating).toBeUndefined();
  });

  it("includes aggregateRating only when reviewCount is present", () => {
    const seo = productSeo(sample({ rating: 4.6, reviewCount: 12 }));
    expect(seo.schema.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: "4.6",
      reviewCount: "12",
    });
  });

  it("includes colour in Product schema when catalog colours exist", () => {
    const seo = productSeo(
      sample({
        colors: [{ id: "c1", name: "Turquoise", hex: "#40E0D0" }],
      }),
    );
    expect(seo.schema.color).toBe("Turquoise");
  });

  it("serializes Product JSON-LD without fabricating GTIN or reviews", () => {
    const seo = productSeo(sample({ reviewCount: 0 }));
    const json = JSON.stringify(seo.schema);
    expect(json).not.toMatch(/gtin/i);
    expect(json).not.toMatch(/aggregateRating/);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("includes material only from real specifications", () => {
    const seo = productSeo(sample({ specifications: { Fabric: "Silk", Origin: "India" } }));
    expect(seo.schema.material).toBe("Silk");
    const names = (seo.schema.additionalProperty as { name: string }[]).map((p) => p.name);
    expect(names).toContain("Fabric");
    expect(names).toContain("Origin");
  });
});

describe("productFactFaqs", () => {
  it("answers from catalog fields only", () => {
    const faqs = productFactFaqs(sample());
    expect(faqs.some((f) => f.question.includes("cost"))).toBe(true);
    expect(faqs.some((f) => f.answer.includes("6.2 Mtrs"))).toBe(true);
    expect(faqs.some((f) => /7 days/i.test(f.answer))).toBe(true);
  });
});
