import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export function useOrders() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }
    try {
      const { data: rows, error: dbError } = await client
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (dbError) throw dbError;
      setData(rows || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const client = getSupabaseClient();
    if (!client) return;
    const channel = client
      .channel("orders_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchData)
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  return { data, loading, error, refetch: fetchData };
}
