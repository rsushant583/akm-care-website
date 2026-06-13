import { getSupabaseClient } from "@/lib/supabaseClient";
import { sendCareerAlert, sendContactAlert, sendFeedbackAlert, sendProductInterestAlert, sendVendorAlert } from "@/lib/emailService";
import { CareerApplicationSubmission, ContactSubmission, FeedbackSubmission, ProductInterestSubmission, VendorApplicationSubmission } from "@/lib/types";
import { uploadVendorDocuments } from "@/lib/vendorStorage";

async function insertRow(table: string, payload: Record<string, unknown>) {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Supabase not configured" };
  }
  try {
    const { error } = await client.from(table).insert(payload);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown DB error" };
  }
}

function isLikelySpam(input: { message?: string; email?: string; website?: string }) {
  if (input.website && input.website.trim().length > 0) return true;
  const message = (input.message || "").toLowerCase();
  const blockedTokens = ["http://", "https://", "viagra", "casino", "crypto"];
  return blockedTokens.some((token) => message.includes(token));
}

export async function submitContact(data: ContactSubmission) {
  if (isLikelySpam({ message: data.message, email: data.email, website: (data as any).website })) {
    return { success: false, error: "Spam detected" };
  }
  const save = await insertRow("contact_submissions", data);
  if (!save.success) return save;
  await sendContactAlert(data);
  return save;
}

export async function submitFeedback(data: FeedbackSubmission) {
  const save = await insertRow("feedback_submissions", data);
  if (!save.success) return save;
  await sendFeedbackAlert(data);
  return save;
}

export async function submitProductInterest(data: ProductInterestSubmission) {
  const save = await insertRow("product_interests", data);
  if (!save.success) return save;
  await sendProductInterestAlert(data);
  return save;
}

export async function submitCareerApplication(data: CareerApplicationSubmission) {
  const save = await insertRow("career_applications", data);
  if (!save.success) return save;
  await sendCareerAlert(data);
  return save;
}

export async function submitVendorApplication(
  data: VendorApplicationSubmission,
  files: File[] = [],
) {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: "Supabase not configured" };
  }

  const { documents: _, ...payload } = data;
  const { data: row, error: insertError } = await client
    .from("vendor_applications")
    .insert({ ...payload, documents: [], status: "pending" })
    .select("id")
    .single();

  if (insertError || !row?.id) {
    return { success: false, error: insertError?.message || "Could not save application" };
  }

  let documents = data.documents || [];
  if (files.length > 0) {
    const upload = await uploadVendorDocuments(files, row.id);
    if (upload.error && upload.documents.length === 0) {
      documents = files.map((f) => ({ name: f.name, path: "", type: f.type, size: f.size }));
    } else {
      documents = upload.documents;
      if (upload.error) {
        return { success: false, error: upload.error };
      }
    }

    await client.from("vendor_applications").update({ documents }).eq("id", row.id);
  }

  const alertPayload = { ...data, documents, id: row.id };
  await sendVendorAlert(alertPayload);
  return { success: true, id: row.id };
}
