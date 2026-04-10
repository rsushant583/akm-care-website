import { useEffect, useState } from "react";
import { faqs as fallbackFaqs } from "@/data/fallback";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { FAQItem } from "@/lib/types";

const mapFallbackFaqs = () =>
  fallbackFaqs.map((item, index) => ({
    ...item,
    category: item.category.toLowerCase(),
    display_order: index,
    is_active: true,
    created_at: new Date().toISOString(),
  }));

export function useFAQ() {
  const [data, setData] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setData(mapFallbackFaqs());
      setLoading(false);
      return;
    }

    try {
      const { data: rows, error: dbError } = await client
        .from("faq")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (dbError) throw dbError;
      setData(rows && rows.length > 0 ? rows : mapFallbackFaqs());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load FAQs");
      setData(mapFallbackFaqs());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel("faq_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "faq" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  return { data, loading, error };
}
