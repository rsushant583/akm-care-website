/**
 * Pure helpers for Admin Products list filters / empty states.
 * Keeps filter semantics testable without React or Supabase.
 */

export type AdminProductStatusFilter = "all" | "available" | "sold_out" | "draft" | "archived";
export type AdminProductStockFilter = "all" | "low_stock" | "out_of_stock";
export type AdminProductQualityFilter = "" | "missing_image" | "missing_category";
export type AdminProductSort = "newest" | "oldest" | "name_asc" | "name_desc";

export type AdminProductListFilters = {
  q: string;
  status: AdminProductStatusFilter;
  category: string;
  stock: AdminProductStockFilter;
  quality: AdminProductQualityFilter;
  sort: AdminProductSort;
};

export const DEFAULT_ADMIN_PRODUCT_FILTERS: AdminProductListFilters = {
  q: "",
  status: "all",
  category: "",
  stock: "all",
  quality: "",
  sort: "newest",
};

/** Legacy URL values that used to live under ?stock= */
const LEGACY_STOCK_AS_QUALITY = new Set(["missing_image", "missing_category"]);

export function parseAdminProductFilters(params: URLSearchParams): AdminProductListFilters {
  const rawStatus = params.get("status") || "all";
  const status = (
    ["all", "available", "sold_out", "draft", "archived"].includes(rawStatus) ? rawStatus : "all"
  ) as AdminProductStatusFilter;

  const rawStock = params.get("stock") || "all";
  let stock: AdminProductStockFilter = "all";
  let quality: AdminProductQualityFilter = "";

  if (LEGACY_STOCK_AS_QUALITY.has(rawStock)) {
    quality = rawStock as AdminProductQualityFilter;
    stock = "all";
  } else if (rawStock === "low_stock" || rawStock === "out_of_stock") {
    stock = rawStock;
  }

  const rawQuality = params.get("quality") || "";
  if (rawQuality === "missing_image" || rawQuality === "missing_category") {
    quality = rawQuality;
  }

  const rawSort = params.get("sort") || "newest";
  const sort = (
    ["newest", "oldest", "name_asc", "name_desc"].includes(rawSort) ? rawSort : "newest"
  ) as AdminProductSort;

  return {
    q: (params.get("q") || "").trim(),
    status,
    category: (params.get("category") || "").trim(),
    stock,
    quality,
    sort,
  };
}

export function adminProductFiltersActive(f: AdminProductListFilters): boolean {
  return (
    Boolean(f.q) ||
    f.status !== "all" ||
    Boolean(f.category) ||
    f.stock !== "all" ||
    Boolean(f.quality) ||
    f.sort !== "newest"
  );
}

export function adminProductFiltersToSearchParams(f: AdminProductListFilters): URLSearchParams {
  const next = new URLSearchParams();
  if (f.q) next.set("q", f.q);
  if (f.status !== "all") next.set("status", f.status);
  if (f.category) next.set("category", f.category);
  if (f.stock !== "all") next.set("stock", f.stock);
  if (f.quality) next.set("quality", f.quality);
  if (f.sort !== "newest") next.set("sort", f.sort);
  return next;
}

export type AdminProductEmptyKind = "loading" | "catalog_empty" | "no_search" | "no_filters" | "error";

export function classifyAdminProductEmptyState(opts: {
  loading: boolean;
  error: string | null;
  resultCount: number;
  catalogHasProducts: boolean | null;
  filters: AdminProductListFilters;
}): AdminProductEmptyKind | null {
  if (opts.loading) return "loading";
  if (opts.error) return "error";
  if (opts.resultCount > 0) return null;
  if (opts.catalogHasProducts === false) return "catalog_empty";
  if (opts.filters.q) return "no_search";
  if (adminProductFiltersActive({ ...opts.filters, q: "" })) return "no_filters";
  // Unknown catalog emptiness or filters cleared but zero rows — treat as filtered/empty catalog carefully
  if (opts.catalogHasProducts === true) return "no_filters";
  return "catalog_empty";
}

export function adminProductEmptyCopy(kind: AdminProductEmptyKind): {
  message: string;
  actionLabel?: "clear_filters" | "clear_search" | "retry";
} {
  switch (kind) {
    case "catalog_empty":
      return { message: "No products found. Add your first product." };
    case "no_search":
      return { message: "No products match your search.", actionLabel: "clear_search" };
    case "no_filters":
      return { message: "No products match these filters.", actionLabel: "clear_filters" };
    case "error":
      return { message: "Couldn't load products.", actionLabel: "retry" };
    case "loading":
      return { message: "Loading products…" };
  }
}

export type AdminListProductLite = {
  stock_quantity?: number | null;
  image_url?: string | null;
  images?: unknown;
  category?: string | null;
};

export function productHasUsableImage(p: AdminListProductLite): boolean {
  if (String(p.image_url || "").trim()) return true;
  if (Array.isArray(p.images)) {
    return (p.images as unknown[]).some((u) => {
      if (typeof u === "string") return Boolean(u.trim());
      if (u && typeof u === "object") {
        const row = u as Record<string, unknown>;
        return Boolean(String(row.src ?? row.url ?? "").trim());
      }
      return false;
    });
  }
  return false;
}

/** Client-side stock + quality filters applied after the server query. */
export function applyAdminClientFilters<T extends AdminListProductLite>(
  rows: T[],
  opts: { stock: AdminProductStockFilter; quality: AdminProductQualityFilter; lowStockThreshold: number },
): T[] {
  let next = rows;
  const low = opts.lowStockThreshold;

  if (opts.stock === "out_of_stock") {
    next = next.filter((p) => Number(p.stock_quantity ?? 0) <= 0);
  } else if (opts.stock === "low_stock") {
    next = next.filter((p) => {
      const n = Number(p.stock_quantity ?? 0);
      return n > 0 && n <= low;
    });
  }

  if (opts.quality === "missing_image") {
    next = next.filter((p) => !productHasUsableImage(p));
  } else if (opts.quality === "missing_category") {
    next = next.filter((p) => !String(p.category || "").trim());
  }

  return next;
}
