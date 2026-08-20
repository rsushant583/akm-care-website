import { getSupabaseClient } from "@/lib/supabaseClient";
import { mapCatalogRow, type CatalogListRow } from "@/services/mappers/catalogMapper";
import type { CatalogProduct } from "@/lib/ecommerce/types";

const SEARCH_CACHE = new Map<string, { at: number; items: CatalogProduct[] }>();
const CACHE_TTL_MS = 30_000;

function sanitizeTerm(q: string) {
  return q.replace(/[%_,.()]/g, " ").trim();
}

export async function searchProducts(query: string, limit = 8): Promise<CatalogProduct[]> {
  const q = sanitizeTerm(query);
  if (!q) return [];

  const cacheKey = `${q.toLowerCase()}::${limit}`;
  const cached = SEARCH_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.items;

  const client = getSupabaseClient();
  if (!client) return [];

  // 1) Full-text on products.search_vector
  const { data: ftsHits, error: ftsError } = await client
    .from("products")
    .select("id")
    .not("status", "in", "(draft,archived)")
    .textSearch("search_vector", q, { type: "websearch", config: "simple" })
    .limit(limit);

  let ids: string[] = [];
  if (!ftsError && ftsHits && ftsHits.length > 0) {
    ids = ftsHits.map((h) => String(h.id));
  } else {
    // 2) Partial ILIKE across key fields
    const { data: likeHits, error } = await client
      .from("products")
      .select("id")
      .not("status", "in", "(draft,archived)")
      .or(
        [
          `name.ilike.%${q}%`,
          `sku.ilike.%${q}%`,
          `product_code.ilike.%${q}%`,
          `category.ilike.%${q}%`,
          `category_label.ilike.%${q}%`,
        ].join(","),
      )
      .order("popularity", { ascending: false })
      .limit(limit);

    if (error) throw error;
    ids = (likeHits || []).map((h) => String(h.id));
  }

  if (ids.length === 0) {
    SEARCH_CACHE.set(cacheKey, { at: Date.now(), items: [] });
    return [];
  }

  const { data, error } = await client.from("catalog_product_list").select("*").in("id", ids);
  if (error) throw error;

  const map = new Map(
    (data || []).map((row) => [String((row as CatalogListRow).id), mapCatalogRow(row as CatalogListRow)]),
  );
  const items = ids.map((id) => map.get(id)).filter(Boolean) as CatalogProduct[];
  SEARCH_CACHE.set(cacheKey, { at: Date.now(), items });
  return items;
}

export function clearSearchCache() {
  SEARCH_CACHE.clear();
}
