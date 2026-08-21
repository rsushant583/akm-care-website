import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Download, AlertCircle, Clock } from "lucide-react";
import { SEO } from "@/components/SEO";
import { getOrderReceipt } from "@/services/orderService";
import { formatINR } from "@/lib/ecommerce/pricing";
import {
  formatCustomerOrderStatus,
  formatCustomerPaymentStatus,
} from "@/lib/account/orderDisplay";
import { CustomerFulfillmentBadge, CustomerPaymentBadge } from "@/components/account/OrderStatusBadges";
import { trackPurchaseFromReceipt } from "@/lib/analytics/events";

type Receipt = Awaited<ReturnType<typeof getOrderReceipt>>;

export default function OrderSuccessPage() {
  const [params] = useSearchParams();
  const orderNumber = params.get("order") || "";
  const accessToken = params.get("token") || "";
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<Receipt>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!orderNumber || !accessToken) {
      setLoading(false);
      setPayload(null);
      setLoadError(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    const load = async (isPoll: boolean) => {
      try {
        const row = await getOrderReceipt(orderNumber, accessToken);
        if (cancelled) return;
        setPayload(row);
        setLoadError(!row);
        setLoading(false);

        const pay = String(row?.order?.payment_status || "").toLowerCase();
        const confirming = Boolean(row) && (pay === "pending" || pay === "created");
        // Light reconciliation poll while webhook/verify may still settle.
        if (confirming && attempts < 12) {
          attempts += 1;
          timer = window.setTimeout(() => void load(true), isPoll ? 2500 : 2000);
        }
      } catch {
        if (cancelled) return;
        setPayload(null);
        setLoadError(true);
        setLoading(false);
      }
    };

    void load(false);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [orderNumber, accessToken]);

  useEffect(() => {
    if (!payload) return;
    trackPurchaseFromReceipt(payload);
  }, [payload]);

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

  const paymentStatus = payload ? String(payload.order.payment_status || "").toLowerCase() : "";
  const paymentPaid = paymentStatus === "paid";
  const paymentFailed = paymentStatus === "failed";
  const paymentRefunded = paymentStatus === "refunded";
  const paymentConfirming = paymentStatus === "pending" || paymentStatus === "created";

  let title = "Order receipt";
  let heading = "Order receipt";
  let subtitle = "";
  if (payload) {
    if (paymentFailed) {
      title = "Payment wasn't completed";
      heading = "Payment wasn't completed";
      subtitle = `Order ${payload.order.order_number} is saved. You can retry checkout from your cart.`;
    } else if (paymentRefunded) {
      title = "Refund recorded";
      heading = "Refund recorded";
      subtitle = `Order ${payload.order.order_number}. Payment: ${formatCustomerPaymentStatus(payload.order.payment_status)}. Order: ${formatCustomerOrderStatus(payload.order.status)}.`;
    } else if (paymentPaid) {
      title = "Payment received";
      heading = "Payment received";
      subtitle = `Order ${payload.order.order_number}. Payment: Paid. Order: ${formatCustomerOrderStatus(payload.order.status)}.`;
    } else if (paymentConfirming) {
      title = "Confirming your payment";
      heading = "Confirming your payment";
      subtitle = `Order ${payload.order.order_number}. We're confirming the payment with our provider. This page updates automatically.`;
    } else {
      title = "Order receipt";
      heading = "Order receipt";
      subtitle = `Order ${payload.order.order_number}. Payment: ${formatCustomerPaymentStatus(payload.order.payment_status)}. Order: ${formatCustomerOrderStatus(payload.order.status)}.`;
    }
  }

  const StatusIcon = paymentFailed ? AlertCircle : paymentPaid ? CheckCircle2 : Clock;

  return (
    <>
      <SEO title={title} description="Your AKM Care order receipt." canonical="/order-success" robots="noindex, follow" />
      <section className="section-padding bg-[#FAF8F5] min-h-[70vh] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-16">
        <div className="container-premium max-w-2xl mx-auto text-center">
          {loading ? (
            <p className="text-sm text-[#6B6B6B]" role="status">
              Loading order summary…
            </p>
          ) : payload ? (
            <>
              <StatusIcon
                className={`mx-auto mb-4 ${paymentFailed ? "text-red-600" : paymentPaid ? "text-emerald-600" : "text-[#E8621A]"}`}
                size={48}
                aria-hidden
              />
              <h1 className="font-heading text-3xl sm:text-4xl mb-2">{heading}</h1>
              <p className="text-[#6B6B6B] mb-6" role="status">
                {subtitle}
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                <CustomerPaymentBadge value={payload.order.payment_status} />
                <CustomerFulfillmentBadge value={payload.order.status} />
              </div>

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
                    <p className="font-semibold">{formatCustomerPaymentStatus(payload.order.payment_status)}</p>
                  </div>
                  {payload.shipping && (
                    <div>
                      <p className="text-[#6B6B6B]">Shipping</p>
                      <p className="font-semibold">
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
                    <span>{paymentPaid ? "Total paid" : "Order total"}</span>
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
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#E8E4DE] px-4 py-2.5 text-sm font-semibold hover:bg-[#FAF8F5] min-h-11"
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
                  : loadError
                    ? "We could not load this order. Check the link or view orders from your account."
                    : "We could not load this order. Check the link or view orders from your account."}
              </p>
            </>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            {paymentFailed ? (
              <Link to="/checkout" className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-3 min-h-11 inline-flex items-center">
                Retry payment
              </Link>
            ) : (
              <Link to="/shop" className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-3 min-h-11 inline-flex items-center">
                Continue shopping
              </Link>
            )}
            <Link
              to="/account/orders"
              className="rounded-full border border-[#E8E4DE] font-semibold px-5 py-3 min-h-11 inline-flex items-center"
            >
              My orders
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
