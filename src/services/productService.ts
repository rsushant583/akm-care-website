import type { CatalogProduct, ShopFilters, SortOption } from "@/lib/ecommerce/types";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { mapCatalogRow, type CatalogListRow } from "@/services/mappers/catalogMapper";

export type ProductListParams = {
  page?: number;
  pageSize?: number;
  filters?: Partial<ShopFilters>;
  sort?: SortOption;
  featuredOnly?: boolean;
  bestSellerOnly?: boolean;
  newArrivalOnly?: boolean;
};

export type ProductListResult = {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  source: "supabase" | "empty";
};

const DEFAULT_PAGE_SIZE = 24;

function applySort(query: any, sort: SortOption = "newest") {
  switch (sort) {
    case "price-asc":
      return query.order("akm_care_price", { ascending: true, nullsFirst: false });
    case "price-desc":
      return query.order("akm_care_price", { ascending: false, nullsFirst: false });
    case "popularity":
      return query.order("popularity", { ascending: false });
    case "discount":
      return query.order("discount_percent", { ascending: false });
    case "newest":
    default:
      return query.order("created_at", { ascending: false }).order("display_order", { ascending: true });
  }
}

function applyFilters(query: any, filters?: Partial<ShopFilters>) {
  if (!filters) return query;

  if (filters.category && filters.category !== "all") {
    query = query.or(`category_slug.eq.${filters.category},category_label.ilike.%${filters.category}%`);
  }
  if (filters.priceMin != null) query = query.gte("akm_care_price", filters.priceMin);
  if (filters.priceMax != null) query = query.lte("akm_care_price", filters.priceMax);
  if (filters.availability === "in_stock") query = query.gt("stock_quantity", 0);
  if (filters.availability === "out_of_stock") query = query.eq("stock_quantity", 0);
  if (filters.query?.trim()) {
    const q = filters.query.trim();
    query = query.or(
      [
        `name.ilike.%${q}%`,
        `sku.ilike.%${q}%`,
        `product_code.ilike.%${q}%`,
        `category_label.ilike.%${q}%`,
        `brand_name.ilike.%${q}%`,
        `short_description.ilike.%${q}%`,
      ].join(","),
    );
  }
  return query;
}

export async function listProducts(params: ProductListParams = {}): Promise<ProductListResult> {
  const client = getSupabaseClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (!client) {
    return { items: [], total: 0, page, pageSize, hasMore: false, source: "empty" };
  }

  let query = client.from("catalog_product_list").select("*", { count: "exact" });

  if (params.featuredOnly) query = query.eq("is_featured", true);
  if (params.bestSellerOnly) query = query.eq("is_best_seller", true);
  if (params.newArrivalOnly) query = query.eq("is_new_arrival", true);

  query = applyFilters(query, params.filters);
  query = applySort(query, params.sort);
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data || []) as CatalogListRow[];
  const items = rows.map((row, i) => mapCatalogRow(row, from + i));

  // Client-side color/variant filter (json arrays) when requested
  let filtered = items;
  if (params.filters?.colors?.length) {
    const wanted = new Set(params.filters.colors.map((c) => c.toLowerCase()));
    filtered = filtered.filter((p) => p.colors.some((c) => wanted.has(c.name.toLowerCase())));
  }
  if (params.filters?.variants?.length) {
    const wanted = new Set(params.filters.variants.map((v) => v.toLowerCase()));
    filtered = filtered.filter((p) => p.variants.some((v) => wanted.has(v.name.toLowerCase())));
  }

  const total = count ?? filtered.length;
  return {
    items: filtered,
    total,
    page,
    pageSize,
    hasMore: from + filtered.length < total,
    source: "supabase",
  };
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from("catalog_product_list")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapCatalogRow(data as CatalogListRow);
}

export async function getProductById(id: string): Promise<CatalogProduct | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.from("catalog_product_list").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapCatalogRow(data as CatalogListRow);
}

export async function getFeaturedProducts(limit = 8): Promise<CatalogProduct[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data: featured, error: featuredError } = await client
    .from("featured_products")
    .select("product_id, display_order")
    .eq("is_active", true)
    .eq("slot", "shop")
    .order("display_order", { ascending: true })
    .limit(limit);

  if (!featuredError && featured && featured.length > 0) {
    const ids = featured.map((f) => f.product_id as string);
    const { data, error } = await client.from("catalog_product_list").select("*").in("id", ids);
    if (error) throw error;
    const map = new Map((data || []).map((row) => [String((row as CatalogListRow).id), mapCatalogRow(row as CatalogListRow)]));
    return ids.map((id) => map.get(id)).filter(Boolean) as CatalogProduct[];
  }

  const result = await listProducts({ page: 1, pageSize: limit, featuredOnly: true, sort: "popularity" });
  return result.items;
}

export async function getBestSellerProducts(limit = 8): Promise<CatalogProduct[]> {
  const result = await listProducts({ page: 1, pageSize: limit, bestSellerOnly: true, sort: "popularity" });
  return result.items;
}

export async function getNewArrivalProducts(limit = 8): Promise<CatalogProduct[]> {
  const result = await listProducts({ page: 1, pageSize: limit, newArrivalOnly: true, sort: "newest" });
  return result.items;
}

export async function getRelatedProducts(productId: string, limit = 4): Promise<CatalogProduct[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data: links, error: linkError } = await client
    .from("related_products")
    .select("related_product_id, display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: true })
    .limit(limit);

  if (!linkError && links && links.length > 0) {
    const ids = links.map((l) => l.related_product_id as string);
    const { data, error } = await client.from("catalog_product_list").select("*").in("id", ids);
    if (error) throw error;
    const map = new Map((data || []).map((row) => [String((row as CatalogListRow).id), mapCatalogRow(row as CatalogListRow)]));
    return ids.map((id) => map.get(id)).filter(Boolean) as CatalogProduct[];
  }

  // Fallback: same category bestsellers excluding self
  const current = await getProductById(productId);
  const result = await listProducts({
    page: 1,
    pageSize: limit + 1,
    filters: { category: current?.category || "all", query: "", priceMin: null, priceMax: null, colors: [], variants: [], availability: "all" },
    sort: "popularity",
  });
  return result.items.filter((p) => p.id !== productId).slice(0, limit);
}

export async function getFilterFacets() {
  const client = getSupabaseClient();
  if (!client) {
    return { categories: [], colors: [] as string[], variants: [] as string[], brands: [] as string[], priceRange: { min: 0, max: 0 } };
  }

  const { data, error } = await client
    .from("catalog_product_list")
    .select("category_slug, category_label, brand_name, akm_care_price, colors, variants");

  if (error) throw error;

  const categories = new Map<string, number>();
  const colors = new Set<string>();
  const variants = new Set<string>();
  const brands = new Set<string>();
  let min = Number.POSITIVE_INFINITY;
  let max = 0;

  for (const row of data || []) {
    const r = row as CatalogListRow;
    const cat = r.category_slug || "apparel";
    categories.set(cat, (categories.get(cat) ?? 0) + 1);
    if (r.brand_name) brands.add(r.brand_name);
    const price = Number(r.akm_care_price ?? 0);
    if (price > 0) {
      min = Math.min(min, price);
      max = Math.max(max, price);
    }
    if (Array.isArray(r.colors)) {
      for (const c of r.colors as { name?: string }[]) {
        if (c?.name) colors.add(c.name);
      }
    }
    if (Array.isArray(r.variants)) {
      for (const v of r.variants as { name?: string }[]) {
        if (v?.name) variants.add(v.name);
      }
    }
  }

  return {
    categories: [...categories.entries()].map(([id, count]) => ({ id, count })),
    colors: [...colors].sort(),
    variants: [...variants].sort(),
    brands: [...brands].sort(),
    priceRange: { min: Number.isFinite(min) ? min : 0, max },
  };
}

export async function countCatalogProducts(): Promise<number> {
  const client = getSupabaseClient();
  if (!client) return 0;
  const { count, error } = await client.from("products").select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}
