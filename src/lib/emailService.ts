import { ContactSubmission, FeedbackSubmission, ProductInterestSubmission, CareerApplicationSubmission, VendorApplicationSubmission } from "@/lib/types";

const NOTIFICATION_EMAIL = "rsushant583@gmail.com";

type EmailEvent =
  | "contact"
  | "feedback"
  | "product_interest"
  | "career"
  | "vendor"
  | "order_confirmation"
  | "payment_success"
  | "shipping_confirmation"
  | "order_delivered";

async function sendAlert(event: EmailEvent, payload: unknown, to?: string) {
  try {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${baseUrl}/functions/v1/notify`;
    const smtpUrl = `${baseUrl}/functions/v1/notify-smtp`;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return { success: false, error: "Supabase function not configured" };
    }

    const body = {
      event,
      to: to || NOTIFICATION_EMAIL,
      payload,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const smtpResponse = await fetch(smtpUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
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

export async function sendVendorAlert(data: VendorApplicationSubmission & { id?: string }) {
  return sendAlert("vendor", data);
}

/** Customer + ops order lifecycle emails */
export async function sendOrderEmail(
  event: "order_confirmation" | "payment_success" | "shipping_confirmation" | "order_delivered",
  payload: Record<string, unknown> & { customer?: { email?: string } },
) {
  const customerEmail = payload.customer?.email;
  const ops = await sendAlert(event, payload, NOTIFICATION_EMAIL);
  if (customerEmail && customerEmail !== NOTIFICATION_EMAIL) {
    await sendAlert(event, payload, customerEmail);
  }
  return ops;
}
