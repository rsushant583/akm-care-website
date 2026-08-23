import { describe, expect, it } from "vitest";
import {
  applyAdminClientFilters,
  adminProductEmptyCopy,
  adminProductFiltersActive,
  adminProductFiltersToSearchParams,
  classifyAdminProductEmptyState,
  parseAdminProductFilters,
  productHasUsableImage,
  DEFAULT_ADMIN_PRODUCT_FILTERS,
} from "./adminProductListFilters";

describe("parseAdminProductFilters", () => {
  it("defaults to all / newest", () => {
    expect(parseAdminProductFilters(new URLSearchParams())).toEqual(DEFAULT_ADMIN_PRODUCT_FILTERS);
  });

  it("maps legacy stock=missing_image into quality", () => {
    const f = parseAdminProductFilters(new URLSearchParams("stock=missing_image"));
    expect(f.stock).toBe("all");
    expect(f.quality).toBe("missing_image");
  });

  it("keeps stock and quality independent", () => {
    const f = parseAdminProductFilters(new URLSearchParams("stock=low_stock&quality=missing_category"));
    expect(f.stock).toBe("low_stock");
    expect(f.quality).toBe("missing_category");
  });
});

describe("adminProductFiltersToSearchParams / active", () => {
  it("omits default keys", () => {
    const params = adminProductFiltersToSearchParams(DEFAULT_ADMIN_PRODUCT_FILTERS);
    expect(params.toString()).toBe("");
    expect(adminProductFiltersActive(DEFAULT_ADMIN_PRODUCT_FILTERS)).toBe(false);
  });

  it("round-trips status + stock + quality", () => {
    const params = adminProductFiltersToSearchParams({
      ...DEFAULT_ADMIN_PRODUCT_FILTERS,
      status: "draft",
      stock: "out_of_stock",
      quality: "missing_image",
      category: "sarees",
      q: "SANI",
      sort: "name_asc",
    });
    expect(parseAdminProductFilters(params)).toEqual({
      q: "SANI",
      status: "draft",
      category: "sarees",
      stock: "out_of_stock",
      quality: "missing_image",
      sort: "name_asc",
    });
    expect(adminProductFiltersActive(parseAdminProductFilters(params))).toBe(true);
  });
});

describe("classifyAdminProductEmptyState", () => {
  const base = {
    loading: false,
    error: null as string | null,
    resultCount: 0,
    catalogHasProducts: true as boolean | null,
    filters: DEFAULT_ADMIN_PRODUCT_FILTERS,
  };

  it("shows first-product copy only when catalog is empty", () => {
    expect(
      classifyAdminProductEmptyState({ ...base, catalogHasProducts: false }),
    ).toBe("catalog_empty");
    expect(adminProductEmptyCopy("catalog_empty").message).toMatch(/Add your first product/);
  });

  it("does not tell staff to add first product when filters match nothing", () => {
    const kind = classifyAdminProductEmptyState({
      ...base,
      filters: { ...DEFAULT_ADMIN_PRODUCT_FILTERS, status: "archived" },
    });
    expect(kind).toBe("no_filters");
    expect(adminProductEmptyCopy(kind!).actionLabel).toBe("clear_filters");
  });

  it("classifies search misses separately", () => {
    const kind = classifyAdminProductEmptyState({
      ...base,
      filters: { ...DEFAULT_ADMIN_PRODUCT_FILTERS, q: "zzzz" },
    });
    expect(kind).toBe("no_search");
  });

  it("prefers error over empty", () => {
    expect(classifyAdminProductEmptyState({ ...base, error: "boom" })).toBe("error");
  });

  it("returns null when results exist", () => {
    expect(classifyAdminProductEmptyState({ ...base, resultCount: 3 })).toBeNull();
  });
});

describe("applyAdminClientFilters", () => {
  const rows = [
    { id: "1", stock_quantity: 0, image_url: "https://x/a.jpg", category: "sarees" },
    { id: "2", stock_quantity: 3, image_url: "", images: [], category: "sarees" },
    { id: "3", stock_quantity: 12, image_url: "https://x/b.jpg", category: "" },
    { id: "4", stock_quantity: 1, image_url: "", images: [{ src: "https://x/c.jpg" }], category: "mens-jeans" },
  ];

  it("filters out of stock", () => {
    expect(applyAdminClientFilters(rows, { stock: "out_of_stock", quality: "", lowStockThreshold: 5 }).map((r) => r.id)).toEqual([
      "1",
    ]);
  });

  it("filters low stock (positive and <= threshold)", () => {
    expect(applyAdminClientFilters(rows, { stock: "low_stock", quality: "", lowStockThreshold: 5 }).map((r) => r.id)).toEqual([
      "2",
      "4",
    ]);
  });

  it("filters missing image including object-shaped images", () => {
    expect(productHasUsableImage(rows[3]!)).toBe(true);
    expect(applyAdminClientFilters(rows, { stock: "all", quality: "missing_image", lowStockThreshold: 5 }).map((r) => r.id)).toEqual([
      "2",
    ]);
  });

  it("filters missing category", () => {
    expect(applyAdminClientFilters(rows, { stock: "all", quality: "missing_category", lowStockThreshold: 5 }).map((r) => r.id)).toEqual([
      "3",
    ]);
  });

  it("ANDs stock + quality", () => {
    expect(
      applyAdminClientFilters(rows, { stock: "low_stock", quality: "missing_image", lowStockThreshold: 5 }).map((r) => r.id),
    ).toEqual(["2"]);
  });
});
