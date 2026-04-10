import { OrderItem, ProductItem } from "@/lib/types";

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

export async function createRazorpayOrder(product: ProductItem, customer: { name: string; email: string; phone?: string }) {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      productId: product.id,
      productName: product.name,
      amount: Number(product.price),
      customer,
    }),
  });
  return response.json();
}

export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderData: OrderItem;
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
