import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Download, AlertCircle } from "lucide-react";
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
      "AKM CARE — ORDER RECEIPT",
      `Order: ${order.order_number}`,
      `Date: ${new Date(order.created_at).toLocaleString("en-IN")}`,
      `Customer: ${order.customer_name}`,
      `Email: ${order.customer_email}`,
      `Phone: ${order.customer_phone || "-"}`,
      "",
      "Items:",
      ...items.map(
        (i: {
          product_name?: string;
          quantity?: number;
          unit_price?: number;
          line_total?: number;
          color_name?: string;
          variant_name?: string;
        }) => {
          const meta = [i.color_name, i.variant_name].filter(Boolean).join(" / ");
          return `- ${i.product_name}${meta ? ` (${meta})` : ""} x${i.quantity} @ ${i.unit_price} = ${i.line_total}`;
        },
      ),
      "",
      `Subtotal: ${order.subtotal}`,
      `GST (reference): ${order.gst_total}`,
      `Shipping: ${order.shipping_total}`,
      `Discount: ${order.discount_total}`,
      `Grand Total: ${order.grand_total} INR`,
      `Payment: ${order.payment_status}`,
      `Order status: ${order.status}`,
    ];
    return lines.join("\n");
  }, [payload]);

  const downloadInvoice = () => {
    const blob = new Blob([invoiceText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${orderNumber || "akm-order"}-receipt.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const paid =
    payload &&
    (String(payload.order.payment_status).toLowerCase() === "paid" ||
      String(payload.order.status).toLowerCase() === "paid");

  return (
    <>
      <SEO
        title={paid ? "Order Confirmed" : "Order Receipt"}
        description="Your AKM Care order receipt."
        canonical="/order-success"
        robots="noindex, follow"
      />
      <section className="section-padding bg-[#FAF8F5] min-h-[70vh] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-16">
        <div className="container-premium max-w-2xl mx-auto text-center">
          {loading ? (
            <p className="text-sm text-[#6B6B6B]" role="status">
              Loading order summary…
            </p>
          ) : payload ? (
            <>
              <CheckCircle2
                className={`mx-auto mb-4 ${paid ? "text-emerald-600" : "text-[#E8621A]"}`}
                size={48}
                aria-hidden
              />
              <h1 className="font-heading text-3xl sm:text-4xl mb-2">
                {paid ? "Order placed successfully" : "Order receipt"}
              </h1>
              <p className="text-[#6B6B6B] mb-8">
                Order <span className="font-semibold text-[#1A1A1A]">{payload.order.order_number}</span>
                {paid ? " is confirmed." : ` · Payment status: ${payload.order.payment_status}`}
              </p>

              <div className="rounded-2xl border border-[#E8E4DE] bg-white p-6 text-left mb-8">
                <div className="flex flex-wrap gap-4 justify-between text-sm mb-4">
                  <div>
                    <p className="text-[#6B6B6B]">Grand total</p>
                    <p className="font-heading text-2xl text-[#1A1A1A]">
                      {formatINR(Number(payload.order.grand_total))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6B6B6B]">Payment</p>
                    <p className="font-semibold capitalize">{payload.order.payment_status}</p>
                  </div>
                  {payload.shipping && (
                    <div>
                      <p className="text-[#6B6B6B]">Shipping</p>
                      <p className="font-semibold capitalize">
                        {String((payload.shipping as { method?: string }).method || "standard")}
                      </p>
                    </div>
                  )}
                </div>
                <ul className="space-y-2 text-sm border-t border-[#E8E4DE] pt-4">
                  {payload.items.map(
                    (i: {
                      id?: string;
                      product_name?: string;
                      quantity?: number;
                      line_total?: number;
                      color_name?: string;
                      variant_name?: string;
                    }) => (
                      <li key={String(i.id || i.product_name)} className="flex justify-between gap-4">
                        <span>
                          {i.product_name} × {i.quantity}
                          {[i.color_name, i.variant_name].filter(Boolean).length > 0 && (
                            <span className="block text-xs text-[#6B6B6B]">
                              {[i.color_name, i.variant_name].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </span>
                        <span>{formatINR(Number(i.line_total || 0))}</span>
                      </li>
                    ),
                  )}
                </ul>
                <div className="mt-4 pt-4 border-t border-[#E8E4DE] text-sm space-y-1 text-[#6B6B6B]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatINR(Number(payload.order.subtotal))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{formatINR(Number(payload.order.shipping_total))}</span>
                  </div>
                  {Number(payload.order.discount_total) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount</span>
                      <span>−{formatINR(Number(payload.order.discount_total))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-[#1A1A1A] pt-1">
                    <span>Total paid</span>
                    <span>{formatINR(Number(payload.order.grand_total))}</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-[#6B6B6B]">
                  {payload.order.customer_name} · {payload.order.customer_email}
                  {payload.order.customer_phone ? ` · ${payload.order.customer_phone}` : ""}
                </p>
                <button
                  type="button"
                  onClick={downloadInvoice}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#E8E4DE] px-4 py-2 text-sm font-semibold hover:bg-[#FAF8F5]"
                >
                  <Download size={16} aria-hidden /> Download receipt
                </button>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="mx-auto text-[#E8621A] mb-4" size={48} aria-hidden />
              <h1 className="font-heading text-3xl sm:text-4xl mb-2">Receipt unavailable</h1>
              <p className="text-sm text-[#6B6B6B] mb-6">
                {!orderNumber || !accessToken
                  ? "This receipt link is incomplete. Use the confirmation link from checkout."
                  : "We could not load this order. Check the link or view orders from your account."}
              </p>
            </>
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
