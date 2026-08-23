import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { getHeroDisplayTitle, getHeroFactualMeta } from "@/lib/ecommerce/productPresentation";

function makeProduct(overrides: Partial<CatalogProduct> & { id: string }): CatalogProduct {
  return {
    id: overrides.id,
    slug: overrides.slug ?? overrides.id,
    name: overrides.name ?? overrides.id,
    shortDescription: overrides.shortDescription ?? "",
    detailedDescription: "",
    images: overrides.images ?? [{ src: `/catalog/${overrides.id}/01.png`, alt: overrides.id }],
    sku: overrides.sku ?? overrides.id,
    productCode: overrides.productCode ?? overrides.id,
    quantity: 5,
    dimensions: "",
    variants: [],
    colors: [],
    mrp: 2000,
    sellingPrice: 1500,
    akmCarePrice: 1400,
    discountPercent: 0,
    gstPercent: 5,
    hsn: "",
    shippingTime: "",
    warranty: "",
    status: "available",
    category: overrides.category ?? "sarees",
    categoryLabel: overrides.categoryLabel ?? "Sarees",
    tags: [],
    displayOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    price: 1400,
    image_url: `/catalog/${overrides.id}/01.png`,
    stock_quantity: 5,
    description: "",
    ...overrides,
  };
}

describe("getHeroDisplayTitle", () => {
  it("never returns a SKU-like string as the hero headline", () => {
    const p = makeProduct({
      id: "sku1",
      name: "AKMC WSOMF - MAER",
      shortDescription: "",
      category: "sarees",
      categoryLabel: "Sarees",
    });
    expect(getHeroDisplayTitle(p)).toBe("Sarees");
    expect(getHeroDisplayTitle(p)).not.toMatch(/AKMC/i);
  });

  it("prefers short_description phrase for SKU-like names", () => {
    const p = makeProduct({
      id: "sku2",
      name: "AKMC SANI - 1007",
      shortDescription: "Chanderi Print Saree with unstitched Blouse",
      category: "sarees",
      categoryLabel: "Sarees",
    });
    expect(getHeroDisplayTitle(p).toLowerCase()).toContain("saree");
    expect(getHeroDisplayTitle(p)).not.toMatch(/^AKMC/i);
  });

  it("keeps descriptive human titles", () => {
    const p = makeProduct({
      id: "human",
      name: "Turquoise Zari Silk Saree",
      category: "sarees",
    });
    expect(getHeroDisplayTitle(p)).toMatch(/Saree/i);
  });
});

describe("getHeroFactualMeta", () => {
  it("omits SKU codes and returns colour · fabric when present", () => {
    const p = makeProduct({
      id: "m1",
      name: "AKMC X - 1",
      productCode: "AKMC-X-1",
      specifications: { colour: "Ivory", fabric: "Silk" },
    });
    expect(getHeroFactualMeta(p)).toBe("Ivory · Silk");
  });

  it("returns undefined when no fashion attributes exist", () => {
    const p = makeProduct({
      id: "m2",
      name: "AKMC Y - 2",
      productCode: "CODE-2",
      specifications: {},
    });
    expect(getHeroFactualMeta(p)).toBeUndefined();
  });
});
