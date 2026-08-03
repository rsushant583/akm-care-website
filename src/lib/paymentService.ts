declare global {
  interface Window {
    Razorpay: any;
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

export async function createRazorpayOrder(input: {
  items: CartCheckoutItem[];
  customer: { name: string; email: string; phone?: string };
  address: Record<string, unknown>;
  shippingMethod: "standard" | "express";
  couponCode?: string;
  notes?: string;
  userId?: string | null;
}): Promise<CreateCheckoutResponse> {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      items: input.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      customer: input.customer,
      address: input.address,
      shippingMethod: input.shippingMethod,
      couponCode: input.couponCode,
      notes: input.notes,
      userId: input.userId || null,
    }),
  });
  return response.json();
}

export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderHeaderId: string;
  accessToken: string;
}) {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-verify-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_signature: payload.razorpay_signature,
      orderHeaderId: payload.orderHeaderId,
      accessToken: payload.accessToken,
    }),
  });
  return response.json();
}
