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

export type CartCheckoutItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

export async function createRazorpayOrder(
  items: CartCheckoutItem[],
  customer: { name: string; email: string; phone?: string },
) {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      items,
      customer,
    }),
  });
  return response.json();
}

export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderPayload: {
    items: CartCheckoutItem[];
    totalAmount: number;
    customer: { name: string; email: string; phone?: string };
  };
}) {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-verify-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}
