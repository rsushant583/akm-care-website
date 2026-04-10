import { useEffect, useState } from "react";
import { services as fallbackServices } from "@/data/fallback";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { ServiceItem } from "@/lib/types";

const mapFallbackServices = () =>
  fallbackServices.map((item, index) => ({
    ...item,
    category: item.category.toLowerCase(),
    icon: item.icon,
    display_order: index,
    is_active: true,
    created_at: new Date().toISOString(),
  }));

export function useServices() {
  const [data, setData] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setData(mapFallbackServices());
      setLoading(false);
      return;
    }

    try {
      const { data: rows, error: dbError } = await client
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (dbError) throw dbError;
      setData(rows && rows.length > 0 ? rows : mapFallbackServices());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
      setData(mapFallbackServices());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel("services_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  return { data, loading, error };
}
