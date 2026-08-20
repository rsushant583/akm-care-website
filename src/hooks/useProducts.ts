import { useEffect, useState } from "react";
import { products as fallbackProducts } from "@/data/fallback";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { ProductItem } from "@/lib/types";

/** Normalize stock from DB — never force zero (legacy bug). */
function normalizeProduct(item: Record<string, unknown>, index = 0): ProductItem {
  const stock = Math.max(0, Math.floor(Number(item.stock_quantity ?? 0)));
  return {
    ...(item as unknown as ProductItem),
    image_url: String(item.image_url ?? ""),
    stock_quantity: stock,
    status: stock > 0 ? "available" : "sold_out",
    display_order: Number(item.display_order ?? index),
    created_at: String(item.created_at ?? new Date().toISOString()),
  };
}

const mapFallbackProducts = () =>
  fallbackProducts.map((item, index) =>
    normalizeProduct({ ...item, image_url: item.image_url || "" }, index),
  );

/**
 * Legacy products hook. Prefer useCatalogProducts / useCatalogMerchandising for storefront.
 * Stock must match products.stock_quantity — do not zero it out.
 */
export function useProducts() {
  const [data, setData] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setData(mapFallbackProducts());
      setLoading(false);
      return;
    }

    try {
      const { data: rows, error: dbError } = await client
        .from("products")
        .select("*")
        .not("status", "in", "(draft,archived)")
        .order("display_order", { ascending: true });
      if (dbError) throw dbError;
      const normalized = (rows || []).map((item, index) =>
        normalizeProduct(item as Record<string, unknown>, index),
      );
      setData(normalized.length > 0 ? normalized : mapFallbackProducts());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
      setData(mapFallbackProducts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel("products_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  return { data, loading, error };
}
