import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Download } from "lucide-react";
import { SEO } from "@/components/SEO";
import { getOrderByNumber } from "@/services/orderService";
import { formatINR } from "@/lib/ecommerce/pricing";

export default function OrderSuccessPage() {
  const [params] = useSearchParams();
  const orderNumber = params.get("order") || "";
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof getOrderByNumber>>>(null);

  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }
    void getOrderByNumber(orderNumber)
      .then(setPayload)
      .catch(() => setPayload(null))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const invoiceText = useMemo(() => {
    if (!payload) return "";
    const { order, items } = payload;
    const lines = [
      "AKM CARE — TAX INVOICE",
      `Order: ${order.order_number}`,
      `Date: ${new Date(order.created_at).toLocaleString("en-IN")}`,
      `Customer: ${order.customer_name}`,
      `Email: ${order.customer_email}`,
      `Phone: ${order.customer_phone || "-"}`,
      "",
      "Items:",
      ...items.map(
        (i: { product_name: string; quantity: number; unit_price: number; line_total: number }) =>
          `- ${i.product_name} x${i.quantity} @ ${i.unit_price} = ${i.line_total}`,
      ),
      "",
      `Subtotal: ${order.subtotal}`,
      `GST: ${order.gst_total}`,
      `Shipping: ${order.shipping_total}`,
      `Discount: ${order.discount_total}`,
      `Grand Total: ${order.grand_total} INR`,
      `Status: ${order.status} / ${order.payment_status}`,
    ];
    return lines.join("\n");
  }, [payload]);

  const downloadInvoice = () => {
    const blob = new Blob([invoiceText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${orderNumber || "akm-order"}-invoice.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SEO title="Order Confirmed" description="Your AKM Care order was placed successfully." canonical="/order-success" robots="noindex, follow" />
      <section className="section-padding bg-[#FAF8F5] min-h-[70vh]">
        <div className="container-premium max-w-2xl mx-auto text-center">
          <CheckCircle2 className="mx-auto text-emerald-600 mb-4" size={48} />
          <h1 className="font-heading text-3xl sm:text-4xl mb-2">Thank you for your order</h1>
          <p className="text-[#6B6B6B] mb-8">
            {orderNumber ? (
              <>
                Order <span className="font-semibold text-[#1A1A1A]">{orderNumber}</span> is confirmed.
              </>
            ) : (
              "Your order has been recorded."
            )}
          </p>

          {loading && <p className="text-sm text-[#6B6B6B]">Loading order summary…</p>}

          {!loading && payload && (
            <div className="text-left rounded-2xl border border-black/[0.06] bg-white p-6 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatINR(Number(payload.order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST</span>
                <span>{formatINR(Number(payload.order.gst_total))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{formatINR(Number(payload.order.shipping_total))}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t border-black/5 pt-3">
                <span>Total paid</span>
                <span className="text-[#E8621A]">{formatINR(Number(payload.order.grand_total))}</span>
              </div>
              <ul className="pt-2 space-y-2 border-t border-black/5">
                {payload.items.map((item: { id: string; product_name: string; quantity: number; line_total: number }) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    <span>{formatINR(Number(item.line_total))}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={downloadInvoice}
              disabled={!invoiceText}
              className="inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] text-white font-semibold px-5 py-3 disabled:opacity-50"
            >
              <Download size={16} /> Download invoice
            </button>
            <Link to="/shop" className="inline-flex items-center rounded-full bg-[#E8621A] text-white font-semibold px-5 py-3">
              Continue shopping
            </Link>
            <Link to="/account" className="inline-flex items-center rounded-full border border-black/10 bg-white font-semibold px-5 py-3">
              My orders
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
