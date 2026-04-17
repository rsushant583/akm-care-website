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

/** Match titles case-insensitively so Supabase rows override the same service from fallback. */
function normalizeTitle(title: string) {
  return title.trim().toLowerCase();
}

/**
 * Supabase may only contain a subset (e.g. Policy Formation). Merge DB rows with the full
 * fallback list so every catalog service still appears; DB wins when titles match.
 */
function mergeServicesWithFallback(rows: ServiceItem[]): ServiceItem[] {
  const byTitle = new Map<string, ServiceItem>();
  for (const r of rows) {
    byTitle.set(normalizeTitle(r.title), r);
  }

  const merged: ServiceItem[] = [];
  const consumedDbIds = new Set<string>();

  fallbackServices.forEach((fb, index) => {
    const fromDb = byTitle.get(normalizeTitle(fb.title));
    if (fromDb) {
      merged.push(fromDb);
      consumedDbIds.add(fromDb.id);
    } else {
      merged.push({
        ...fb,
        category: fb.category.toLowerCase(),
        icon: fb.icon,
        display_order: index,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
  });

  for (const r of rows) {
    if (!consumedDbIds.has(r.id)) {
      merged.push(r);
    }
  }

  return merged;
}

function removeLogisticsServices(items: ServiceItem[]): ServiceItem[] {
  return items.filter((item) => {
    const category = String(item.category ?? "").toLowerCase();
    const title = String(item.title ?? "").toLowerCase();
    const description = String(item.description ?? "").toLowerCase();
    return !(
      category.includes("logistics") ||
      title.includes("logistics") ||
      title.includes("freight") ||
      description.includes("logistics") ||
      description.includes("freight")
    );
  });
}

export function useServices() {
  const [data, setData] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setData(removeLogisticsServices(mapFallbackServices()));
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
      const merged = rows && rows.length > 0 ? mergeServicesWithFallback(rows) : mapFallbackServices();
      setData(removeLogisticsServices(merged));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
      setData(removeLogisticsServices(mapFallbackServices()));
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
