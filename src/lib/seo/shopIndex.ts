export type ShopIndexInput = {
  category: string;
  query: string;
  collection: string | null | undefined;
  isKnownCategory: boolean;
  hasExtraFilters?: boolean;
};

export type ShopIndexPolicy = {
  canonical: string;
  robots: string;
  indexable: boolean;
};

const INDEXABLE_ROBOTS = "index, follow, max-image-preview:large";
const NOINDEX_ROBOTS = "noindex, follow";

/**
 * Canonical + robots for /shop including ?category= and ?q=.
 * Unknown category slugs are noindex and canonicalize to /shop (not homepage).
 * Sort/price/colour/search parameter combinations are noindex; official category-only URLs stay indexable.
 */
export function resolveShopIndexPolicy(input: ShopIndexInput): ShopIndexPolicy {
  if (input.query.trim()) {
    return { canonical: "/shop", robots: NOINDEX_ROBOTS, indexable: false };
  }

  if (input.category !== "all" && !input.isKnownCategory) {
    return { canonical: "/shop", robots: NOINDEX_ROBOTS, indexable: false };
  }

  if (input.hasExtraFilters) {
    const canonical =
      input.category !== "all" && input.isKnownCategory && !input.collection
        ? `/shop?category=${encodeURIComponent(input.category)}`
        : "/shop";
    return { canonical, robots: NOINDEX_ROBOTS, indexable: false };
  }

  if (input.category !== "all" && !input.collection && input.isKnownCategory) {
    return {
      canonical: `/shop?category=${encodeURIComponent(input.category)}`,
      robots: INDEXABLE_ROBOTS,
      indexable: true,
    };
  }

  return { canonical: "/shop", robots: INDEXABLE_ROBOTS, indexable: true };
}
