declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (resp: { error?: { description?: string } }) => void) => void;
    };
  }
}

export async function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/** Client may send productId + quantity only — server recomputes all money fields. */
export type CartCheckoutItem = {
  productId: string;
  quantity: number;
  colorName?: string;
  variantName?: string;
};

export type CreateCheckoutResponse = {
  success: boolean;
  error?: string;
  keyId?: string;
  order?: { id: string; amount: number; currency: string };
  amount?: number;
  amountPaise?: number;
  orderHeaderId?: string;
  orderNumber?: string;
  accessToken?: string;
  totals?: {
    subtotal: number;
    gstTotal: number;
    shippingTotal: number;
    discountTotal: number;
    grandTotal: number;
    couponCode: string | null;
  };
  items?: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }>;
};

async function readJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return { success: false, error: "Unexpected server response. Please try again." };
  }
}

function friendlyHttpError(status: number, fallback?: string) {
  if (status === 409) return fallback || "Some items are no longer available.";
  if (status === 400) return fallback || "Please check your details and try again.";
  if (status >= 500) {
    if (fallback && /server env missing for payments/i.test(fallback)) {
      return "Online payments are temporarily unavailable. Your cart is safe — please try again later.";
    }
    return fallback || "We couldn't start the payment. Please try again.";
  }
  return fallback || "Something went wrong. Please try again.";
}

export async function createRazorpayOrder(input: {
  items: CartCheckoutItem[];
  customer: { name: string; email: string; phone?: string };
  address: Record<string, unknown>;
  shippingMethod: "standard" | "express";
  couponCode?: string;
  notes?: string;
  /** Optional user JWT — server binds user_id from auth, never from client body */
  accessToken?: string | null;
}): Promise<CreateCheckoutResponse> {
  const bearer = input.accessToken || import.meta.env.VITE_SUPABASE_ANON_KEY;
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        items: input.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          colorName: i.colorName,
          variantName: i.variantName,
        })),
        customer: input.customer,
        address: input.address,
        shippingMethod: input.shippingMethod,
        couponCode: input.couponCode,
        notes: input.notes,
      }),
    });
    const data = (await readJsonSafe(response)) as CreateCheckoutResponse;
    if (!response.ok && !data.error) {
      return { success: false, error: friendlyHttpError(response.status) };
    }
    if (!response.ok && data.error) {
      return { success: false, error: friendlyHttpError(response.status, data.error) };
    }
    return data;
  } catch {
    return { success: false, error: "Network error. Check your connection and try again." };
  }
}

export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderHeaderId: string;
  accessToken: string;
}) {
  if (!payload.orderHeaderId || !payload.accessToken) {
    return { success: false, error: "Missing order verification credentials." };
  }
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        razorpay_order_id: payload.razorpay_order_id,
        razorpay_payment_id: payload.razorpay_payment_id,
        razorpay_signature: payload.razorpay_signature,
        orderHeaderId: payload.orderHeaderId,
        accessToken: payload.accessToken,
      }),
    });
    const data = await readJsonSafe(response);
    if (!response.ok && !data.error) {
      return { success: false, error: friendlyHttpError(response.status, "Payment verification failed.") };
    }
    return data;
  } catch {
    return {
      success: false,
      error: "Payment verification is taking longer than expected. Check My Account or contact support.",
    };
  }
}
