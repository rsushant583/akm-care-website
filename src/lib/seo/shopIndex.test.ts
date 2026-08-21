import { describe, expect, it } from "vitest";
import { resolveShopIndexPolicy } from "./shopIndex";

describe("resolveShopIndexPolicy", () => {
  it("self-canonicalizes known category URLs", () => {
    expect(
      resolveShopIndexPolicy({
        category: "sarees",
        query: "",
        collection: null,
        isKnownCategory: true,
      }),
    ).toEqual({
      canonical: "/shop?category=sarees",
      robots: "index, follow, max-image-preview:large",
      indexable: true,
    });
  });

  it("noindexes unknown categories and canonicalizes to /shop, not homepage", () => {
    expect(
      resolveShopIndexPolicy({
        category: "not-a-real-category",
        query: "",
        collection: null,
        isKnownCategory: false,
      }),
    ).toEqual({
      canonical: "/shop",
      robots: "noindex, follow",
      indexable: false,
    });
  });

  it("noindexes search results", () => {
    const policy = resolveShopIndexPolicy({
      category: "sarees",
      query: "zari",
      collection: null,
      isKnownCategory: true,
    });
    expect(policy.robots).toMatch(/noindex/);
    expect(policy.canonical).toBe("/shop");
  });

  it("noindexes extra filter parameters while keeping official category canonical", () => {
    expect(
      resolveShopIndexPolicy({
        category: "sarees",
        query: "",
        collection: null,
        isKnownCategory: true,
        hasExtraFilters: true,
      }),
    ).toEqual({
      canonical: "/shop?category=sarees",
      robots: "noindex, follow",
      indexable: false,
    });
  });
});
