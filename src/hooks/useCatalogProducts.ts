import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogProduct, ShopFilters, SortOption } from "@/lib/ecommerce/types";
import { DEFAULT_FILTERS } from "@/lib/ecommerce/filters";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  countCatalogProducts,
  getBestSellerProducts,
  getFeaturedProducts,
  getFilterFacets,
  getNewArrivalProducts,
  getProductBySlug,
  getRelatedProducts,
  listProducts,
} from "@/services/productService";
import { allCatalogProducts } from "@/data/catalog/products";

type CatalogState = {
  data: CatalogProduct[];
  total: number;
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  offline: boolean;
  source: "supabase" | "offline-fallback" | "empty";
};

const PAGE_SIZE = 24;

/**
 * Database-driven catalog hook.
 * Falls back to local seed only when Supabase is unavailable or returns zero rows (offline / pre-seed).
 */
export function useCatalogProducts(options?: {
  filters?: ShopFilters;
  sort?: SortOption;
  pageSize?: number;
  enablePagination?: boolean;
}) {
  const filters = options?.filters ?? DEFAULT_FILTERS;
  const sort = options?.sort ?? "newest";
  const pageSize = options?.pageSize ?? PAGE_SIZE;
  const enablePagination = options?.enablePagination ?? true;

  const [state, setState] = useState<CatalogState>({
    data: [],
    total: 0,
    page: 1,
    hasMore: false,
    loading: true,
    loadingMore: false,
    error: null,
    offline: false,
    source: "empty",
  });

  const filtersKey = useMemo(() => JSON.stringify({ filters, sort, pageSize }), [filters, sort, pageSize]);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      const id = ++requestId.current;
      const client = getSupabaseClient();

      if (!client) {
        setState({
          data: allCatalogProducts,
          total: allCatalogProducts.length,
          page: 1,
          hasMore: false,
          loading: false,
          loadingMore: false,
          error: null,
          offline: true,
          source: "offline-fallback",
        });
        return;
      }

      if (append) {
        setState((s) => ({ ...s, loadingMore: true, error: null }));
      } else {
        setState((s) => ({ ...s, loading: true, error: null }));
      }

      try {
        const result = await listProducts({
          page,
          pageSize: enablePagination ? pageSize : 500,
          filters,
          sort,
        });

        if (id !== requestId.current) return;

        // Pre-seed / empty remote → offline fallback so shop still works
        if (result.total === 0 && page === 1) {
          const remoteCount = await countCatalogProducts().catch(() => 0);
          if (remoteCount === 0) {
            setState({
              data: allCatalogProducts,
              total: allCatalogProducts.length,
              page: 1,
              hasMore: false,
              loading: false,
              loadingMore: false,
              error: null,
              offline: true,
              source: "offline-fallback",
            });
            return;
          }
        }

        setState((prev) => ({
          data: append ? [...prev.data, ...result.items] : result.items,
          total: result.total,
          page: result.page,
          hasMore: result.hasMore,
          loading: false,
          loadingMore: false,
          error: null,
          offline: false,
          source: "supabase",
        }));
      } catch (err) {
        if (id !== requestId.current) return;
        setState({
          data: allCatalogProducts,
          total: allCatalogProducts.length,
          page: 1,
          hasMore: false,
          loading: false,
          loadingMore: false,
          error: err instanceof Error ? err.message : "Failed to load products",
          offline: true,
          source: "offline-fallback",
        });
      }
    },
    [enablePagination, filters, pageSize, sort],
  );

  useEffect(() => {
    void fetchPage(1, false);
  }, [filtersKey, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.loadingMore || state.loading || state.offline) return;
    await fetchPage(state.page + 1, true);
  }, [fetchPage, state.hasMore, state.loadingMore, state.loading, state.offline, state.page]);

  const refetch = useCallback(() => fetchPage(1, false), [fetchPage]);

  const bySlug = useMemo(() => {
    const map = new Map<string, CatalogProduct>();
    for (const p of state.data) map.set(p.slug, p);
    // Include offline fallback map for PDP deep links when list isn't loaded
    if (state.offline) {
      for (const p of allCatalogProducts) map.set(p.slug, p);
    }
    return map;
  }, [state.data, state.offline]);

  const getBySlug = useCallback(
    (slug: string) => bySlug.get(slug),
    [bySlug],
  );

  const resolveBySlug = useCallback(async (slug: string) => {
    const cached = bySlug.get(slug);
    if (cached) return cached;
    try {
      return await getProductBySlug(slug);
    } catch {
      return allCatalogProducts.find((p) => p.slug === slug) ?? null;
    }
  }, [bySlug]);

  return {
    data: state.data,
    total: state.total,
    page: state.page,
    hasMore: state.hasMore,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    offline: state.offline,
    source: state.source,
    getBySlug,
    resolveBySlug,
    loadMore,
    refetch,
  };
}

export function useCatalogMerchandising() {
  const [featured, setFeatured] = useState<CatalogProduct[]>([]);
  const [bestSellers, setBestSellers] = useState<CatalogProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const client = getSupabaseClient();
        if (!client) {
          if (!cancelled) {
            setFeatured(allCatalogProducts.filter((p) => p.isFeatured).slice(0, 4));
            setBestSellers(allCatalogProducts.filter((p) => p.isBestSeller).slice(0, 4));
            setNewArrivals(allCatalogProducts.filter((p) => p.isNewArrival).slice(0, 4));
          }
          return;
        }
        const [f, b, n] = await Promise.all([
          getFeaturedProducts(4),
          getBestSellerProducts(4),
          getNewArrivalProducts(4),
        ]);
        if (cancelled) return;
        setFeatured(f.length ? f : allCatalogProducts.filter((p) => p.isFeatured).slice(0, 4));
        setBestSellers(b.length ? b : allCatalogProducts.filter((p) => p.isBestSeller).slice(0, 4));
        setNewArrivals(n.length ? n : allCatalogProducts.filter((p) => p.isNewArrival).slice(0, 4));
      } catch {
        if (!cancelled) {
          setFeatured(allCatalogProducts.filter((p) => p.isFeatured).slice(0, 4));
          setBestSellers(allCatalogProducts.filter((p) => p.isBestSeller).slice(0, 4));
          setNewArrivals(allCatalogProducts.filter((p) => p.isNewArrival).slice(0, 4));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { featured, bestSellers, newArrivals, loading };
}

export function useCatalogFacets() {
  const [facets, setFacets] = useState({
    categories: [] as { id: string; count: number }[],
    colors: [] as string[],
    variants: [] as string[],
    brands: [] as string[],
    priceRange: { min: 0, max: 0 },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getFilterFacets();
        if (!cancelled) setFacets(data);
      } catch {
        /* keep empty — UI filters still work client-side on loaded page */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return facets;
}

export function useRelatedCatalogProducts(productId?: string, limit = 4) {
  const [items, setItems] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    (async () => {
      try {
        const related = await getRelatedProducts(productId, limit);
        if (!cancelled) setItems(related);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, limit]);

  return items;
}
