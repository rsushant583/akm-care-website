import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import {
  buildLookbookSlides,
  hasUsableProductImage,
  isStorefrontVisibleProduct,
  pickCategoryRailProducts,
  pickLatestSpotlightProducts,
  pickLookbookSupporting,
  pickNewestArrivals,
} from "@/lib/ecommerce/merchandising";

function makeProduct(overrides: Partial<CatalogProduct> & { id: string }): CatalogProduct {
  return {
    id: overrides.id,
    slug: overrides.slug ?? overrides.id,
    name: overrides.name ?? `Product ${overrides.id}`,
    shortDescription: "",
    detailedDescription: "",
    images: overrides.images ?? [{ src: `/catalog/${overrides.id}/01.png`, alt: overrides.id }],
    sku: overrides.sku ?? overrides.id,
    productCode: overrides.productCode ?? overrides.id,
    quantity: overrides.quantity ?? 5,
    dimensions: "",
    variants: [],
    colors: [],
    mrp: overrides.mrp ?? 2000,
    sellingPrice: overrides.sellingPrice ?? 1500,
    akmCarePrice: overrides.akmCarePrice ?? 1400,
    discountPercent: overrides.discountPercent ?? 0,
    gstPercent: 5,
    hsn: "",
    shippingTime: "",
    warranty: "",
    status: overrides.status ?? "available",
    category: overrides.category ?? "sarees",
    categoryLabel: overrides.categoryLabel ?? "Sarees",
    tags: [],
    displayOrder: overrides.displayOrder ?? 0,
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
    price: overrides.price ?? 1400,
    image_url: overrides.image_url ?? `/catalog/${overrides.id}/01.png`,
    stock_quantity: overrides.stock_quantity ?? 5,
    description: "",
    ...overrides,
  };
}

describe("isStorefrontVisibleProduct", () => {
  it("excludes draft and archived", () => {
    expect(isStorefrontVisibleProduct(makeProduct({ id: "a", status: "draft" }))).toBe(false);
    expect(
      isStorefrontVisibleProduct(makeProduct({ id: "b", status: "archived" as CatalogProduct["status"] })),
    ).toBe(false);
    expect(isStorefrontVisibleProduct(makeProduct({ id: "c", status: "available" }))).toBe(true);
    expect(isStorefrontVisibleProduct(makeProduct({ id: "d", status: "sold_out" }))).toBe(true);
  });
});

describe("hasUsableProductImage", () => {
  it("rejects missing and placeholder images", () => {
    expect(
      hasUsableProductImage(
        makeProduct({ id: "x", images: [], image_url: "" }),
      ),
    ).toBe(false);
    expect(
      hasUsableProductImage(
        makeProduct({ id: "y", images: [{ src: "/placeholder.svg", alt: "" }], image_url: "/placeholder.svg" }),
      ),
    ).toBe(false);
    expect(hasUsableProductImage(makeProduct({ id: "z" }))).toBe(true);
  });
});

describe("pickLatestSpotlightProducts", () => {
  it("prioritizes fashion categories and newest first within priority", () => {
    const jeans = makeProduct({
      id: "jeans-new",
      category: "mens-jeans",
      categoryLabel: "Men's Jeans",
      createdAt: "2026-08-20T00:00:00.000Z",
    });
    const oldSaree = makeProduct({
      id: "saree-old",
      category: "sarees",
      categoryLabel: "Sarees",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const newSaree = makeProduct({
      id: "saree-new",
      category: "sarees",
      categoryLabel: "Sarees",
      createdAt: "2026-08-22T00:00:00.000Z",
    });
    const gown = makeProduct({
      id: "gown-1",
      category: "ladies-gown",
      categoryLabel: "Ladies Gown",
      createdAt: "2026-08-21T00:00:00.000Z",
    });

    const result = pickLatestSpotlightProducts([jeans, oldSaree, newSaree, gown], 4);
    // Fashion first by newest date; jeans only as fill after fashion slots.
    expect(result.map((p) => p.id)).toEqual(["saree-new", "gown-1", "saree-old", "jeans-new"]);
  });

  it("excludes draft, archived, and products without usable images", () => {
    const good = makeProduct({ id: "good", createdAt: "2026-08-01T00:00:00.000Z" });
    const draft = makeProduct({ id: "draft", status: "draft", createdAt: "2026-08-22T00:00:00.000Z" });
    const noImg = makeProduct({
      id: "no-img",
      images: [],
      image_url: "",
      createdAt: "2026-08-22T00:00:00.000Z",
    });

    const result = pickLatestSpotlightProducts([draft, noImg, good], 5);
    expect(result.map((p) => p.id)).toEqual(["good"]);
  });

  it("returns empty when nothing eligible", () => {
    expect(pickLatestSpotlightProducts([], 8)).toEqual([]);
    expect(
      pickLatestSpotlightProducts(
        [makeProduct({ id: "d", status: "draft" })],
        8,
      ),
    ).toEqual([]);
  });

  it("dedupes by image src and respects limit", () => {
    const a = makeProduct({
      id: "a",
      images: [{ src: "/same.png", alt: "a" }],
      image_url: "/same.png",
      createdAt: "2026-08-22T00:00:00.000Z",
    });
    const b = makeProduct({
      id: "b",
      images: [{ src: "/same.png", alt: "b" }],
      image_url: "/same.png",
      createdAt: "2026-08-21T00:00:00.000Z",
    });
    const c = makeProduct({
      id: "c",
      category: "ladies-gown",
      categoryLabel: "Ladies Gown",
      createdAt: "2026-08-20T00:00:00.000Z",
    });

    const result = pickLatestSpotlightProducts([a, b, c], 2);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("a");
    expect(result.map((p) => p.id)).not.toContain("b");
  });
});

describe("buildLookbookSlides / pickLookbookSupporting", () => {
  it("builds one slide per pool product with featured + supporting", () => {
    const saree = makeProduct({ id: "s1", category: "sarees", categoryLabel: "Sarees" });
    const gown = makeProduct({ id: "g1", category: "ladies-gown", categoryLabel: "Ladies Gown" });
    const lehenga = makeProduct({
      id: "l1",
      category: "stitched-lehenga",
      categoryLabel: "Stitched Lehenga",
    });
    const slides = buildLookbookSlides([saree, gown, lehenga], 3);
    expect(slides).toHaveLength(3);
    expect(slides[0].featured.id).toBe("s1");
    expect(slides[0].supporting.map((p) => p.id)).toEqual(["g1", "l1"]);
    expect(slides[0].supporting.map((p) => p.id)).not.toContain("s1");
  });

  it("prefers category diversity in supporting looks", () => {
    const s1 = makeProduct({ id: "s1", category: "sarees", categoryLabel: "Sarees" });
    const s2 = makeProduct({ id: "s2", category: "sarees", categoryLabel: "Sarees" });
    const gown = makeProduct({ id: "g1", category: "ladies-gown", categoryLabel: "Ladies Gown" });
    const lehenga = makeProduct({
      id: "l1",
      category: "stitched-lehenga",
      categoryLabel: "Stitched Lehenga",
    });

    const supports = pickLookbookSupporting([s1, s2, gown, lehenga], s1, 3);
    expect(supports.map((p) => p.id)).toEqual(["g1", "l1", "s2"]);
    expect(new Set(supports.map((p) => p.category)).size).toBeGreaterThanOrEqual(2);
  });

  it("never duplicates the featured product", () => {
    const a = makeProduct({ id: "a", category: "sarees" });
    const b = makeProduct({ id: "b", category: "ladies-gown" });
    const supports = pickLookbookSupporting([a, b], a, 3);
    expect(supports.every((p) => p.id !== "a")).toBe(true);
  });

  it("falls back gracefully with fewer than 3 usable products", () => {
    const only = makeProduct({ id: "only", category: "sarees" });
    expect(buildLookbookSlides([only], 3)).toEqual([{ featured: only, supporting: [] }]);

    const a = makeProduct({ id: "a", category: "sarees" });
    const b = makeProduct({ id: "b", category: "ladies-gown" });
    const slides = buildLookbookSlides([a, b], 3);
    expect(slides[0].supporting).toHaveLength(1);
    expect(slides[0].supporting[0].id).toBe("b");
  });

  it("returns empty slides for empty pool", () => {
    expect(buildLookbookSlides([], 3)).toEqual([]);
    expect(pickLookbookSupporting([], makeProduct({ id: "x" }), 3)).toEqual([]);
  });
});

describe("pickNewestArrivals", () => {
  it("orders by createdAt descending and skips unpublished", () => {
    const older = makeProduct({ id: "older", createdAt: "2026-01-01T00:00:00.000Z" });
    const newer = makeProduct({ id: "newer", createdAt: "2026-08-01T00:00:00.000Z" });
    const draft = makeProduct({
      id: "draft",
      status: "draft",
      createdAt: "2026-08-22T00:00:00.000Z",
    });

    expect(pickNewestArrivals([older, newer, draft], 8).map((p) => p.id)).toEqual(["newer", "older"]);
  });
});

describe("pickCategoryRailProducts", () => {
  it("returns empty when fewer than minItems", () => {
    const one = makeProduct({ id: "s1", category: "sarees", categoryLabel: "Sarees" });
    expect(pickCategoryRailProducts([one], ["sarees"], 8)).toEqual([]);
  });

  it("returns products for matching categories only", () => {
    const s1 = makeProduct({ id: "s1", category: "sarees", categoryLabel: "Sarees" });
    const s2 = makeProduct({ id: "s2", category: "sarees", categoryLabel: "Sarees" });
    const g1 = makeProduct({
      id: "g1",
      category: "ladies-gown",
      categoryLabel: "Ladies Gown",
    });

    const rail = pickCategoryRailProducts([s1, s2, g1], ["sarees"], 8);
    expect(rail.map((p) => p.id).sort()).toEqual(["s1", "s2"]);
  });

  it("aggregates lehenga slugs", () => {
    const a = makeProduct({
      id: "l1",
      category: "stitched-lehenga",
      categoryLabel: "Stitched Lehenga",
    });
    const b = makeProduct({
      id: "l2",
      category: "unstitched-lehenga",
      categoryLabel: "Unstitched Lehenga",
    });
    const rail = pickCategoryRailProducts([a, b], ["stitched-lehenga", "unstitched-lehenga"], 8);
    expect(rail).toHaveLength(2);
  });
});
