import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import {
  buildHeroCategoryCollages,
  getHeroCategoryAssetSummary,
  hasUsableProductImage,
  isStorefrontVisibleProduct,
  pickCategoryRailProducts,
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

describe("buildHeroCategoryCollages", () => {
  it("includes categories with 3 products and preserves official order", () => {
    const sarees = [1, 2, 3].map((n) =>
      makeProduct({
        id: `s${n}`,
        category: "sarees",
        categoryLabel: "Sarees",
        createdAt: `2026-08-0${n}T00:00:00.000Z`,
      }),
    );
    const jeans = [1, 2, 3].map((n) =>
      makeProduct({
        id: `j${n}`,
        category: "mens-jeans",
        categoryLabel: "Men's Jeans",
        createdAt: `2026-07-0${n}T00:00:00.000Z`,
      }),
    );

    const collages = buildHeroCategoryCollages([...jeans, ...sarees], 3);
    expect(collages.map((c) => c.categoryId)).toEqual(["sarees", "mens-jeans"]);
    expect(collages[0].tiles).toHaveLength(3);
    expect(new Set(collages[0].tiles.map((t) => t.src)).size).toBe(3);
  });

  it("includes a category with only 2 products", () => {
    const gowns = [1, 2].map((n) =>
      makeProduct({
        id: `g${n}`,
        category: "ladies-gown",
        categoryLabel: "Ladies Gown",
        createdAt: `2026-08-1${n}T00:00:00.000Z`,
      }),
    );
    const collages = buildHeroCategoryCollages(gowns, 3);
    expect(collages).toHaveLength(1);
    expect(collages[0].categoryId).toBe("ladies-gown");
    expect(collages[0].tiles).toHaveLength(2);
  });

  it("uses gallery images when a category has one product with multiple frames", () => {
    const gown = makeProduct({
      id: "semi-1",
      category: "semi-stitched-gown",
      categoryLabel: "Semi Stitched Gown",
      images: [
        { src: "/catalog/semi-1/01.png", alt: "front" },
        { src: "/catalog/semi-1/02.png", alt: "side" },
        { src: "/catalog/semi-1/03.png", alt: "detail" },
      ],
      image_url: "/catalog/semi-1/01.png",
    });
    const collages = buildHeroCategoryCollages([gown], 3);
    expect(collages).toHaveLength(1);
    expect(collages[0].categoryId).toBe("semi-stitched-gown");
    expect(collages[0].tiles.map((t) => t.src)).toEqual([
      "/catalog/semi-1/01.png",
      "/catalog/semi-1/02.png",
      "/catalog/semi-1/03.png",
    ]);
    expect(collages[0].tiles.every((t) => t.href.includes("semi-1"))).toBe(true);
  });

  it("includes a category with a single visual asset", () => {
    const only = makeProduct({
      id: "leh-1",
      category: "stitched-lehenga",
      categoryLabel: "Stitched Lehenga",
    });
    const collages = buildHeroCategoryCollages([only], 3);
    expect(collages).toHaveLength(1);
    expect(collages[0].tiles).toHaveLength(1);
  });

  it("skips categories with zero usable visuals", () => {
    expect(buildHeroCategoryCollages([], 3)).toEqual([]);
    expect(
      buildHeroCategoryCollages(
        [
          makeProduct({
            id: "bad",
            category: "sarees",
            images: [],
            image_url: "",
          }),
        ],
        3,
      ),
    ).toEqual([]);
  });

  it("never mixes categories within a collage", () => {
    const saree = makeProduct({ id: "s1", category: "sarees", categoryLabel: "Sarees" });
    const gown = makeProduct({ id: "g1", category: "ladies-gown", categoryLabel: "Ladies Gown" });
    const collages = buildHeroCategoryCollages([saree, gown], 3);
    expect(collages).toHaveLength(2);
    expect(collages[0].tiles.every((t) => t.href.includes("s1"))).toBe(true);
    expect(collages[1].tiles.every((t) => t.href.includes("g1"))).toBe(true);
  });

  it("dedupes by src and ignores drafts", () => {
    const products = [
      makeProduct({ id: "s1", category: "sarees", createdAt: "2026-08-03T00:00:00.000Z" }),
      makeProduct({
        id: "s-draft",
        category: "sarees",
        status: "draft",
        createdAt: "2026-08-04T00:00:00.000Z",
      }),
      makeProduct({
        id: "s-dup",
        category: "sarees",
        images: [{ src: "/catalog/s1/01.png", alt: "dup" }],
        image_url: "/catalog/s1/01.png",
        createdAt: "2026-08-02T00:00:00.000Z",
      }),
    ];
    const collages = buildHeroCategoryCollages(products, 3);
    expect(collages).toHaveLength(1);
    expect(collages[0].tiles).toHaveLength(1);
    expect(collages[0].tiles[0].href).toContain("s1");
  });

  it("summarizes eligibility for debug/tests", () => {
    const products = [
      makeProduct({ id: "s1", category: "sarees" }),
      makeProduct({
        id: "g1",
        category: "ladies-gown",
        images: [
          { src: "/g/1.png", alt: "a" },
          { src: "/g/2.png", alt: "b" },
        ],
        image_url: "/g/1.png",
      }),
    ];
    const summary = getHeroCategoryAssetSummary(products);
    expect(summary.find((r) => r.categoryId === "sarees")).toMatchObject({
      assetCount: 1,
      eligible: true,
    });
    expect(summary.find((r) => r.categoryId === "ladies-gown")).toMatchObject({
      assetCount: 2,
      eligible: true,
    });
    expect(summary.find((r) => r.categoryId === "mens-jeans")).toMatchObject({
      assetCount: 0,
      eligible: false,
    });
  });
});
