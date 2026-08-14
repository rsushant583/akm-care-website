import { useCallback, useEffect, useMemo, useState } from "react";
import type { CatalogProduct } from "@/lib/ecommerce/types";
import { getProductBySlug } from "@/services/productService";
import { allCatalogProducts } from "@/data/catalog/products";
import { getSupabaseClient } from "@/lib/supabaseClient";

/** PDP-focused loader — single product by slug from Supabase (offline fallback). */
export function useCatalogProduct(slug: string) {
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    if (!slug) {
      setProduct(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const client = getSupabaseClient();
    if (!client) {
      const local = allCatalogProducts.find((p) => p.slug === slug) ?? null;
      setProduct(local);
      setOffline(true);
      setLoading(false);
      return;
    }

    try {
      const remote = await getProductBySlug(slug);
      if (remote) {
        setProduct(remote);
        setOffline(false);
      } else {
        const local = allCatalogProducts.find((p) => p.slug === slug) ?? null;
        setProduct(local);
        setOffline(Boolean(local));
        if (!local) setError("Product not found");
      }
    } catch {
      const local = allCatalogProducts.find((p) => p.slug === slug) ?? null;
      setProduct(local);
      setOffline(true);
      if (!local) setError("Unable to load this product right now.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  return { product, loading, error, offline, refetch: load };
}

export function useOfflineFallbackCatalog() {
  return useMemo(() => allCatalogProducts, []);
}
