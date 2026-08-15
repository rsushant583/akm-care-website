import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import {
  getMyOrderDetail,
  prepareReorder,
  type CustomerOrderDetail,
  type ReorderResult,
} from "@/services/customerOrderService";
import { formatINR } from "@/lib/ecommerce/pricing";
import {
  addrField,
  formatCustomerOrderStatus,
  formatCustomerPaymentStatus,
  formatOrderDateTime,
  hasTrackingNumber,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
} from "@/lib/account/orderDisplay";
import { CustomerFulfillmentBadge, CustomerPaymentBadge } from "@/components/account/OrderStatusBadges";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { toast } from "@/components/ui/sonner";
import { customerSafeMessage } from "@/lib/ecommerce/customerCopy";

function paymentRecordedAt(order: CustomerOrderDetail) {
  const status = (order.payment_status || "").toLowerCase();
  if (status !== "paid" && status !== "failed" && status !== "refunded") return null;
  return order.payment?.updated_at || order.payment?.created_at || null;
}

export default function AccountOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [reorderResult, setReorderResult] = useState<ReorderResult | null>(null);

  const load = async (isRefresh = false) => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    if (isRefresh && order) setRefreshing(true);
    else setLoading(true);
    setNotFound(false);
    setError(null);
    try {
      const row = await getMyOrderDetail(id);
      if (!row) {
        setOrder(null);
        setNotFound(true);
      } else {
        setOrder(row);
      }
    } catch (e) {
      setError(customerSafeMessage(e, "Could not load this order. Please try again."));
      if (!isRefresh) {
        setOrder(null);
        setNotFound(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!id) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      setNotFound(false);
      setError(null);
      setReorderResult(null);
      try {
        const row = await getMyOrderDetail(id);
        if (cancelled) return;
        if (!row) {
          setOrder(null);
          setNotFound(true);
        } else {
          setOrder(row);
        }
      } catch (e) {
        if (!cancelled) {
          setOrder(null);
          setNotFound(false);
          setError(customerSafeMessage(e, "Could not load this order. Please try again."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onBuyAgain = async () => {
    if (!order || reordering) return;
    setReordering(true);
    setReorderResult(null);
    try {
      const result = await prepareReorder(order.id, addToCart, order);
      setReorderResult(result);
      if (result.added.length) {
        toast.success(
          result.added.length === 1
            ? `Added ${result.added[0].name} to cart at the current catalog price`
            : `Added ${result.added.length} items to cart at current catalog prices`,
        );
      } else if (result.unavailable.length) {
        toast.message("Nothing could be added to cart");
      }
    } catch (e) {
      toast.error(customerSafeMessage(e, "Could not add these items to cart."));
    } finally {
      setReordering(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="space-y-4" role="status" aria-busy="true">
        <span className="sr-only">Loading order</span>
        <div className="h-8 w-48 rounded bg-white animate-pulse" />
        <div className="h-40 rounded-2xl bg-white border animate-pulse" />
        <div className="h-56 rounded-2xl bg-white border animate-pulse" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center" role="alert">
        <h2 className="font-heading text-xl mb-2">Unable to load order</h2>
        <p className="text-sm text-red-700 mb-5">{error}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex rounded-full bg-[#1A1A1A] text-white font-semibold px-5 py-2.5 text-sm min-h-11 items-center"
          >
            Retry
          </button>
          <Link
            to="/account/orders"
            className="inline-flex rounded-full border border-black/10 bg-white font-semibold px-5 py-2.5 text-sm min-h-11 items-center"
          >
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center">
        <h2 className="font-heading text-xl mb-2">Order not found</h2>
        <p className="text-sm text-[#6B6B6B] mb-5">
          This order does not exist or you do not have access to it.
        </p>
        <Link
          to="/account/orders"
          className="inline-flex rounded-full bg-[#1A1A1A] text-white font-semibold px-5 py-2.5 text-sm min-h-11 items-center"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  const address = order.shipping_address;
  const line1 = addrField(address, ["line1", "address_line1", "street", "area"]);
  const line2 = addrField(address, ["line2", "address_line2", "landmark"]);
  const city = addrField(address, ["city"]);
  const state = addrField(address, ["state"]);
  const pincode = addrField(address, ["pincode", "pin", "postal_code"]);
  const tracking = order.shipping?.tracking_number;
  const showTracking = hasTrackingNumber(tracking);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/account/orders"
            className="text-sm font-semibold text-[#E8621A] min-h-11 inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8621A]"
          >
            ← My Orders
          </Link>
          <h2 className="font-heading text-2xl mt-2">{order.order_number}</h2>
          <p className="text-sm text-[#6B6B6B]">Placed {formatOrderDateTime(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="rounded-full border border-black/10 bg-white font-semibold px-4 py-2.5 text-sm min-h-11 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8621A]"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            disabled={reordering || order.items.length === 0}
            onClick={() => void onBuyAgain()}
            className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 text-sm min-h-11 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A1A]"
          >
            {reordering ? "Checking catalog…" : "Buy again"}
          </button>
        </div>
      </div>

      {refreshing ? (
        <p className="text-xs text-[#6B6B6B]" role="status" aria-live="polite">
          Updating order…
        </p>
      ) : null}

      <section className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <CustomerPaymentBadge value={order.payment_status} />
          <CustomerFulfillmentBadge value={order.status} />
        </div>
        <p className="text-2xl font-bold">{formatINR(order.grand_total)}</p>
        <p className="text-xs text-[#6B6B6B]">
          Payment and order status are separate. Labels reflect the latest saved record.
        </p>
      </section>

      {reorderResult ? (
        <section className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 text-sm" aria-live="polite">
          <h3 className="font-semibold mb-2">Buy again</h3>
          {reorderResult.added.length > 0 ? (
            <ul className="space-y-1 mb-3">
              {reorderResult.added.map((item) => (
                <li key={`added-${item.name}-${item.quantity}`}>
                  Added {item.quantity} × {item.name} at the current catalog price.
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#6B6B6B] mb-3">No items were added to cart.</p>
          )}
          {reorderResult.unavailable.length > 0 ? (
            <div>
              <p className="font-medium mb-1">Could not add</p>
              <ul className="space-y-1 text-[#6B6B6B]">
                {reorderResult.unavailable.map((item) => (
                  <li key={`unavail-${item.name}-${item.reason}`}>
                    {item.name}: {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {reorderResult.added.length > 0 ? (
            <Link
              to="/cart"
              className="inline-flex mt-4 rounded-full bg-[#1A1A1A] text-white font-semibold px-5 py-2.5 text-sm min-h-11 items-center"
            >
              View cart
            </Link>
          ) : null}
        </section>
      ) : null}

      <OrderTimeline
        createdAt={order.created_at}
        fulfillmentStatus={order.status}
        paymentStatus={order.payment_status}
        paymentRecordedAt={paymentRecordedAt(order)}
        shippedAt={order.shipping?.shipped_at}
        deliveredAt={order.shipping?.delivered_at}
        timeline={order.timeline}
      />

      <section className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5">
        <h3 className="font-semibold mb-3">Items</h3>
        <ul className="space-y-3">
          {order.items.map((it) => (
            <li key={it.id} className="flex gap-3 text-sm">
              <div className="h-16 w-14 rounded-lg overflow-hidden bg-[#F5F0EB] shrink-0">
                {it.image_url ? <img src={it.image_url} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{it.product_name}</p>
                {it.sku && <p className="text-xs text-[#6B6B6B]">Code: {it.sku}</p>}
                <p className="text-xs text-[#6B6B6B]">
                  {[it.color_name, it.variant_name].filter(Boolean).join(" · ") || null}
                </p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Qty {it.quantity} · {formatINR(it.unit_price)} each
                </p>
              </div>
              <p className="font-semibold shrink-0">{formatINR(it.line_total)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 text-sm space-y-1">
        <h3 className="font-semibold mb-2">Price summary</h3>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatINR(order.subtotal)}</span>
        </div>
        {order.discount_total > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
            <span>−{formatINR(order.discount_total)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{formatINR(order.shipping_total)}</span>
        </div>
        {order.gst_total > 0 && (
          <div className="flex justify-between text-[#6B6B6B]">
            <span>GST (included display)</span>
            <span>{formatINR(order.gst_total)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold pt-2 border-t border-black/[0.06]">
          <span>Total</span>
          <span>{formatINR(order.grand_total)}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 text-sm space-y-1">
        <h3 className="font-semibold mb-2">Delivery</h3>
        <p className="font-medium">{order.customer_name}</p>
        {order.customer_phone && <p className="text-[#6B6B6B]">{order.customer_phone}</p>}
        <p className="text-[#6B6B6B] pt-1">
          {line1 || "—"}
          {line2 ? `, ${line2}` : ""}
        </p>
        <p className="text-[#6B6B6B]">{[city, state, pincode].filter(Boolean).join(", ") || "—"}</p>
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 text-sm space-y-1">
        <h3 className="font-semibold mb-2">Shipping</h3>
        <p>Method: {order.shipping?.method || order.shipping_method || "—"}</p>
        {order.shipping?.status ? (
          <p>Shipment status: {formatCustomerOrderStatus(order.shipping.status)}</p>
        ) : (
          <p className="text-[#6B6B6B]">No shipment record yet.</p>
        )}
        {order.shipping?.estimated_days != null && <p>Estimated days: {order.shipping.estimated_days}</p>}
        {showTracking ? (
          <p>
            Tracking
            {order.shipping?.carrier ? ` (${order.shipping.carrier})` : ""}: {tracking}
          </p>
        ) : (
          <p className="text-[#6B6B6B]">No tracking number yet.</p>
        )}
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 text-sm space-y-1">
        <h3 className="font-semibold mb-2">Payment</h3>
        <p>Status: {formatCustomerPaymentStatus(order.payment_status)}</p>
        {order.payment?.provider && <p>Provider: {order.payment.provider}</p>}
        {order.payment?.method && <p>Method: {order.payment.method}</p>}
        {order.payment?.razorpay_payment_id && (
          <p className="break-all">Payment ID: {order.payment.razorpay_payment_id}</p>
        )}
        {order.payment?.amount != null && <p>Amount: {formatINR(order.payment.amount)}</p>}
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 text-sm space-y-2">
        <h3 className="font-semibold">Need help with this order?</h3>
        <p className="text-[#6B6B6B]">
          Cancellation, returns, and refunds are handled by support. They are not available as self-serve
          actions here, so payment and fulfillment records stay accurate.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            to="/contact"
            className="inline-flex rounded-full bg-[#1A1A1A] text-white font-semibold px-4 py-2.5 text-sm min-h-11 items-center"
          >
            Contact support
          </Link>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Order ${order.order_number}`)}`}
            className="inline-flex rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold min-h-11 items-center"
          >
            Email {SUPPORT_EMAIL}
          </a>
          <a
            href={`tel:${SUPPORT_PHONE_TEL}`}
            className="inline-flex rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold min-h-11 items-center"
          >
            Call {SUPPORT_PHONE_DISPLAY}
          </a>
        </div>
      </section>
    </div>
  );
}
