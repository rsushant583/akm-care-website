import { describe, expect, it } from "vitest";
import { getDraftBlockers, getPublishBlockers } from "@/lib/admin/productPublishValidation";
import { assessProductQuality } from "@/lib/admin/productDataQuality";
import type { AdminProduct } from "@/services/adminCatalogService";

describe("productPublishValidation", () => {
  it("allows incomplete drafts with only a name", () => {
    expect(getDraftBlockers({ name: "Silk Saree" })).toEqual([]);
    expect(getDraftBlockers({ name: "" })[0]).toMatch(/title/i);
  });

  it("blocks publish without category, image, price, stock", () => {
    const blockers = getPublishBlockers({
      name: "Silk Saree",
      category: "",
      akm_care_price: -1,
      stock_quantity: -2,
      images: [],
    });
    expect(blockers.some((b) => /category/i.test(b))).toBe(true);
    expect(blockers.some((b) => /image/i.test(b))).toBe(true);
    expect(blockers.some((b) => /price/i.test(b))).toBe(true);
    expect(blockers.some((b) => /stock/i.test(b))).toBe(true);
  });

  it("blocks selling price above MRP", () => {
    const blockers = getPublishBlockers({
      name: "Gown",
      category: "ladies-gown",
      mrp: 1000,
      selling_price: 1200,
      akm_care_price: 900,
      stock_quantity: 2,
      images: ["https://example.com/a.jpg"],
    });
    expect(blockers.some((b) => /exceed MRP/i.test(b))).toBe(true);
  });
});

describe("productDataQuality", () => {
  const base: AdminProduct = {
    id: "1",
    name: "Test",
    slug: "test",
    sku: null,
    product_code: null,
    price: 100,
    mrp: 200,
    selling_price: 100,
    akm_care_price: 100,
    discount_percent: 50,
    stock_quantity: 3,
    status: "available",
    description: null,
    short_description: null,
    detailed_description: null,
    image_url: null,
    images: [],
    video_url: null,
    category: "apparel",
    category_label: "Apparel",
    brand_id: null,
    category_id: null,
    subcategory_id: null,
    variants: [],
    colors: [],
    gst_percent: 5,
    hsn: null,
    warranty: null,
    shipping_time: null,
    packing_type: null,
    freight_cost: null,
    weight: null,
    dimensions: null,
    seo_title: null,
    seo_description: null,
    is_featured: false,
    is_trending: false,
    is_best_seller: false,
    is_new_arrival: false,
    tags: [],
    display_order: 0,
    created_at: new Date().toISOString(),
  };

  it("flags apparel and missing image without rewriting", () => {
    const issues = assessProductQuality(base, { lowStockThreshold: 5 });
    expect(issues.some((i) => i.code === "legacy_apparel")).toBe(true);
    expect(issues.some((i) => i.code === "missing_image")).toBe(true);
    expect(issues.some((i) => i.code === "low_stock")).toBe(true);
  });
});
