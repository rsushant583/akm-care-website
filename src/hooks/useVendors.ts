import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { VendorApplication } from "@/lib/types";

export function useVendors() {
  const [data, setData] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }
    try {
      const { data: rows, error: queryError } = await client
        .from("vendor_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      setData((rows as VendorApplication[]) || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendor applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel("vendors_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "vendor_applications" }, fetchData)
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (
    id: string,
    status: "approved" | "rejected" | "pending",
    adminNotes?: string,
  ) => {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: "Supabase client unavailable" };

    const payload: Record<string, unknown> = {
      status,
      reviewed_at: new Date().toISOString(),
      is_read: true,
    };
    if (adminNotes !== undefined) payload.admin_notes = adminNotes;

    const { error: updateError } = await client.from("vendor_applications").update(payload).eq("id", id);

    if (updateError) return { success: false, error: updateError.message };

    if (status === "approved") {
      const application = data.find((v) => v.id === id);
      if (application) {
        await client.from("vendors").upsert(
          {
            application_id: id,
            business_name: application.business_name,
            owner_name: application.owner_name,
            email: application.email,
            mobile: application.mobile,
            gst_number: application.gst_number,
            product_category: application.product_category,
            status: "active",
          },
          { onConflict: "application_id" },
        );
      }
    }

    await fetchData();
    return { success: true };
  };

  return { data, loading, error, refetch: fetchData, updateStatus };
}
