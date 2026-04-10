import { useEffect, useState } from "react";
import { products as fallbackProducts } from "@/data/fallback";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { ProductItem } from "@/lib/types";

const mapFallbackProducts = () =>
  fallbackProducts.map((item, index) => ({
    ...item,
    image_url: "",
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
      setData(rows && rows.length > 0 ? rows : mapFallbackProducts());
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
