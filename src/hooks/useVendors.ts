import { useEffect, useState } from "react";
import { getSupabaseAdminClient } from "@/lib/supabaseClient";
import type { VendorApplication } from "@/lib/types";

export function useVendors() {
  const [data, setData] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      setLoading(false);
      return;
    }
    try {
      const { data: rows, error: queryError } = await adminClient
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
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) return;

    const channel = adminClient
      .channel("vendors_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "vendor_applications" }, fetchData)
      .subscribe();

    return () => {
      adminClient.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (
    id: string,
    status: "approved" | "rejected" | "pending",
    adminNotes?: string,
  ) => {
    const adminClient = getSupabaseAdminClient();
    if (!adminClient) return { success: false, error: "Admin client unavailable" };

    const payload: Record<string, unknown> = {
      status,
      reviewed_at: new Date().toISOString(),
      is_read: true,
    };
    if (adminNotes !== undefined) payload.admin_notes = adminNotes;

    const { error: updateError } = await adminClient
      .from("vendor_applications")
      .update(payload)
      .eq("id", id);

    if (updateError) return { success: false, error: updateError.message };

    if (status === "approved") {
      const application = data.find((v) => v.id === id);
      if (application) {
        await adminClient.from("vendors").upsert(
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
