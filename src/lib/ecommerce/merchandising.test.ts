import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import {
  buildHeroCategoryCollages,
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
  it("requires 3 same-category products and never mixes categories", () => {
    const sarees = [1, 2, 3].map((n) =>
      makeProduct({
        id: `s${n}`,
        category: "sarees",
        categoryLabel: "Sarees",
        createdAt: `2026-08-0${n}T00:00:00.000Z`,
      }),
    );
    const gowns = [1, 2].map((n) =>
      makeProduct({
        id: `g${n}`,
        category: "ladies-gown",
        categoryLabel: "Ladies Gown",
        createdAt: `2026-08-1${n}T00:00:00.000Z`,
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

    const collages = buildHeroCategoryCollages([...sarees, ...gowns, ...jeans], 3);
    expect(collages.map((c) => c.categoryId)).toEqual(["sarees", "mens-jeans"]);
    expect(collages.find((c) => c.categoryId === "ladies-gown")).toBeUndefined();

    const sareeSlide = collages.find((c) => c.categoryId === "sarees")!;
    expect(sareeSlide.tiles).toHaveLength(3);
    expect(new Set(sareeSlide.tiles.map((t) => t.src)).size).toBe(3);
  });

  it("skips draft / unusable images and dedupes by src", () => {
    const products = [
      makeProduct({ id: "s1", category: "sarees", createdAt: "2026-08-03T00:00:00.000Z" }),
      makeProduct({ id: "s2", category: "sarees", createdAt: "2026-08-02T00:00:00.000Z" }),
      makeProduct({
        id: "s3-draft",
        category: "sarees",
        status: "draft",
        createdAt: "2026-08-04T00:00:00.000Z",
      }),
      makeProduct({
        id: "s4",
        category: "sarees",
        images: [{ src: "/catalog/s1/01.png", alt: "dup" }],
        image_url: "/catalog/s1/01.png",
        createdAt: "2026-08-01T00:00:00.000Z",
      }),
      makeProduct({ id: "s5", category: "sarees", createdAt: "2026-07-01T00:00:00.000Z" }),
    ];
    const collages = buildHeroCategoryCollages(products, 3);
    expect(collages).toHaveLength(1);
    expect(collages[0].tiles.map((t) => t.href)).toEqual([
      "/shop/product/s1",
      "/shop/product/s2",
      "/shop/product/s5",
    ]);
  });

  it("returns empty when no category has 3 usable images", () => {
    expect(buildHeroCategoryCollages([], 3)).toEqual([]);
    expect(
      buildHeroCategoryCollages(
        [makeProduct({ id: "only", category: "sarees" })],
        3,
      ),
    ).toEqual([]);
  });
});
