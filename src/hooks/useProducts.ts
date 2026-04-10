import { useEffect, useState } from "react";
import { products as fallbackProducts } from "@/data/fallback";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { ProductItem } from "@/lib/types";

const mapFallbackProducts = () =>
  fallbackProducts.map((item, index) => ({
    ...item,
    image_url: item.image_url || "",
    stock_quantity: Math.min(50, Math.max(0, item.stock_quantity ?? 0)),
    status: (item.stock_quantity ?? 0) > 0 ? "available" : "sold_out",
    display_order: index,
    created_at: new Date().toISOString(),
  }));

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
        .order("display_order", { ascending: true });
      if (dbError) throw dbError;
      const normalized = (rows || []).map((item) => {
        const stock = Math.min(50, Math.max(0, Number(item.stock_quantity ?? 0)));
        return {
          ...item,
          stock_quantity: stock,
          status: stock > 0 ? "available" : "sold_out",
        };
      });
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
