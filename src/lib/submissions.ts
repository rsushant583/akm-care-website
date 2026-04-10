import { getSupabaseClient } from "@/lib/supabaseClient";
import { sendCareerAlert, sendContactAlert, sendFeedbackAlert, sendProductInterestAlert } from "@/lib/emailService";
import { CareerApplicationSubmission, ContactSubmission, FeedbackSubmission, ProductInterestSubmission } from "@/lib/types";

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

export async function submitContact(data: ContactSubmission) {
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
