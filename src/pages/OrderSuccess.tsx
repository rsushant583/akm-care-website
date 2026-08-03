import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Download } from "lucide-react";
import { SEO } from "@/components/SEO";
import { getOrderReceipt } from "@/services/orderService";
import { formatINR } from "@/lib/ecommerce/pricing";

export default function OrderSuccessPage() {
  const [params] = useSearchParams();
  const orderNumber = params.get("order") || "";
  const accessToken = params.get("token") || "";
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof getOrderReceipt>>>(null);

  useEffect(() => {
    if (!orderNumber || !accessToken) {
      setLoading(false);
      setPayload(null);
      return;
    }
    void getOrderReceipt(orderNumber, accessToken)
      .then(setPayload)
      .catch(() => setPayload(null))
      .finally(() => setLoading(false));
  }, [orderNumber, accessToken]);

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
        (i: { product_name?: string; quantity?: number; unit_price?: number; line_total?: number }) =>
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

          {!loading && !payload && (
            <p className="text-sm text-[#6B6B6B] mb-6">
              {!accessToken
                ? "This receipt link is incomplete. Use the link from your checkout confirmation."
                : "We could not load this order. Check the link or view orders from your account."}
            </p>
          )}

          {payload && (
            <div className="rounded-2xl border border-[#E8E4DE] bg-white p-6 text-left mb-8">
              <div className="flex flex-wrap gap-4 justify-between text-sm mb-4">
                <div>
                  <p className="text-[#6B6B6B]">Grand total</p>
                  <p className="font-heading text-2xl text-[#1A1A1A]">{formatINR(Number(payload.order.grand_total))}</p>
                </div>
                <div>
                  <p className="text-[#6B6B6B]">Payment</p>
                  <p className="font-semibold capitalize">{payload.order.payment_status}</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm border-t border-[#E8E4DE] pt-4">
                {payload.items.map((i: { id?: string; product_name?: string; quantity?: number; line_total?: number }) => (
                  <li key={String(i.id || i.product_name)} className="flex justify-between gap-4">
                    <span>
                      {i.product_name} × {i.quantity}
                    </span>
                    <span>{formatINR(Number(i.line_total || 0))}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={downloadInvoice}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#E8E4DE] px-4 py-2 text-sm font-semibold hover:bg-[#FAF8F5]"
              >
                <Download size={16} /> Download invoice
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/shop" className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-3">
              Continue shopping
            </Link>
            <Link to="/account" className="rounded-full border border-[#E8E4DE] font-semibold px-5 py-3">
              My account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
