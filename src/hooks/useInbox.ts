import { useEffect, useState } from "react";
import { getSupabaseAdminClient } from "@/lib/supabaseClient";

interface InboxState {
  contacts: any[];
  feedback: any[];
  interests: any[];
  applications: any[];
}

export function useInbox() {
  const [data, setData] = useState<InboxState>({
    contacts: [],
    feedback: [],
    interests: [],
    applications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      setLoading(false);
      return;
    }
    try {
      const [contacts, feedback, interests, applications] = await Promise.all([
        adminClient.from("contact_submissions").select("*").order("created_at", { ascending: false }),
        adminClient.from("feedback_submissions").select("*").order("created_at", { ascending: false }),
        adminClient.from("product_interests").select("*").order("created_at", { ascending: false }),
        adminClient.from("career_applications").select("*").order("created_at", { ascending: false }),
      ]);

      if (contacts.error) throw contacts.error;
      if (feedback.error) throw feedback.error;
      if (interests.error) throw interests.error;
      if (applications.error) throw applications.error;

      setData({
        contacts: contacts.data || [],
        feedback: feedback.data || [],
        interests: interests.data || [],
        applications: applications.data || [],
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) return;

    const channel = adminClient
      .channel("inbox_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_submissions" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "feedback_submissions" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "product_interests" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "career_applications" }, fetchData)
      .subscribe();

    return () => {
      adminClient.removeChannel(channel);
    };
  }, []);

  return { data, loading, error, refetch: fetchData };
}
