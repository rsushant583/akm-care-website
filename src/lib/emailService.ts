import { ContactSubmission, FeedbackSubmission, ProductInterestSubmission, CareerApplicationSubmission } from "@/lib/types";

const NOTIFICATION_EMAIL = "rsushant583@gmail.com";

type EmailEvent = "contact" | "feedback" | "product_interest" | "career";

async function sendAlert(event: EmailEvent, payload: unknown) {
  try {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${baseUrl}/functions/v1/notify`;
    const smtpUrl = `${baseUrl}/functions/v1/notify-smtp`;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return { success: false, error: "Supabase function not configured" };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        event,
        to: NOTIFICATION_EMAIL,
        payload,
      }),
    });

    if (!response.ok) {
      const smtpResponse = await fetch(smtpUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          event,
          to: NOTIFICATION_EMAIL,
          payload,
        }),
      });
      if (!smtpResponse.ok) {
        const errorText = await smtpResponse.text();
        return { success: false, error: errorText };
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown email error",
    };
  }
}

export async function sendContactAlert(data: ContactSubmission) {
  return sendAlert("contact", data);
}

export async function sendFeedbackAlert(data: FeedbackSubmission) {
  return sendAlert("feedback", data);
}

export async function sendProductInterestAlert(data: ProductInterestSubmission) {
  return sendAlert("product_interest", data);
}

export async function sendCareerAlert(data: CareerApplicationSubmission) {
  return sendAlert("career", data);
}
