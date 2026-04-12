import { useEffect, useState } from "react";
import { motivationQuotes as fallbackQuotes } from "@/data/fallback";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { MotivationQuote } from "@/lib/types";

const emergencyFallback: MotivationQuote = {
  id: "fallback-motivation",
  quote: "The strength of the team is each individual member. The strength of each member is the team.",
  source: "Phil Jackson",
  is_active: true,
  created_at: new Date().toISOString(),
};

export function useMotivation() {
  const [data, setData] = useState<MotivationQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setData([emergencyFallback, ...fallbackQuotes.map((item) => ({ ...item, is_active: true }))]);
      setLoading(false);
      return;
    }

    try {
      const { data: latest, error: latestError } = await client
        .from("motivation_quotes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: allRows, error: allRowsError } = await client
        .from("motivation_quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (latestError || !latest) {
        setData([emergencyFallback]);
      } else if (allRowsError || !allRows || allRows.length === 0) {
        setData([latest]);
      } else {
        const rest = allRows.filter((item) => item.id !== latest.id);
        setData([latest, ...rest]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load motivation");
      setData([emergencyFallback, ...fallbackQuotes.map((item) => ({ ...item, is_active: true }))]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel("motivation")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "motivation_quotes" },
        (payload) => {
          setData((prev) => {
            const inserted = payload.new as MotivationQuote;
            if (!inserted?.id) return prev;
            return [inserted, ...prev.filter((item) => item.id !== inserted.id)];
          });
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  return { data, loading, error };
}
