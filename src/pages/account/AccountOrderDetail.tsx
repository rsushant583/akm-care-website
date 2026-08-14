import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import {
  getMyOrderDetail,
  prepareReorder,
  type CustomerOrderDetail,
} from "@/services/customerOrderService";
import { formatINR } from "@/lib/ecommerce/pricing";
import {
  addrField,
  formatCustomerOrderStatus,
  formatCustomerPaymentStatus,
  orderBadgeClass,
  paymentBadgeClass,
} from "@/lib/account/orderDisplay";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export default function AccountOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setNotFound(false);
      try {
        const row = await getMyOrderDetail(id);
        if (cancelled) return;
        if (!row) {
          setOrder(null);
          setNotFound(true);
        } else {
          setOrder(row);
        }
      } catch {
        if (!cancelled) {
          setOrder(null);
          setNotFound(true);
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
    try {
      const result = await prepareReorder(order.id, addToCart);
      if (result.added.length) {
        toast.success(
          result.added.length === 1
            ? `Added ${result.added[0].name} to cart`
            : `Added ${result.added.length} items to cart`,
        );
      }
      if (result.unavailable.length) {
        toast.message("Some items unavailable", {
          description: result.unavailable.map((u) => `${u.name}: ${u.reason}`).join(" · "),
        });
      }
      if (result.added.length) navigate("/cart");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reorder");
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-busy="true">
        <div className="h-8 w-48 rounded bg-white animate-pulse" />
        <div className="h-40 rounded-2xl bg-white border animate-pulse" />
        <div className="h-56 rounded-2xl bg-white border animate-pulse" />
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

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/account/orders" className="text-sm font-semibold text-[#E8621A]">
            ← My Orders
          </Link>
          <h2 className="font-heading text-2xl mt-2">{order.order_number}</h2>
          <p className="text-sm text-[#6B6B6B]">
            {new Date(order.created_at).toLocaleString("en-IN")}
          </p>
        </div>
        <button
          type="button"
          disabled={reordering || order.items.length === 0}
          onClick={() => void onBuyAgain()}
          className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 text-sm min-h-11 disabled:opacity-50"
        >
          {reordering ? "Adding…" : "Buy again"}
        </button>
      </div>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <span
            className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", paymentBadgeClass(order.payment_status))}
          >
            Payment: {formatCustomerPaymentStatus(order.payment_status)}
          </span>
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
              orderBadgeClass(order.status),
            )}
          >
            Order: {formatCustomerOrderStatus(order.status)}
          </span>
        </div>
        <p className="text-2xl font-bold">{formatINR(order.grand_total)}</p>
      </section>

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
        <p className="text-[#6B6B6B]">
          {[city, state, pincode].filter(Boolean).join(", ") || "—"}
        </p>
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 text-sm space-y-1">
        <h3 className="font-semibold mb-2">Shipping</h3>
        <p>Method: {order.shipping?.method || order.shipping_method || "—"}</p>
        <p>Status: {order.shipping?.status || "—"}</p>
        {order.shipping?.estimated_days != null && (
          <p>Estimated days: {order.shipping.estimated_days}</p>
        )}
        {order.shipping?.tracking_number ? (
          <p>
            Tracking
            {order.shipping.carrier ? ` (${order.shipping.carrier})` : ""}:{" "}
            {order.shipping.tracking_number}
          </p>
        ) : (
          <p className="text-[#6B6B6B]">Tracking information will appear here once available.</p>
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

      <section className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5">
        <h3 className="font-semibold mb-3">Order timeline</h3>
        {order.timeline.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">No tracking updates yet.</p>
        ) : (
          <ol className="space-y-3">
            {order.timeline.map((ev) => (
              <li key={ev.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-[#E8621A] shrink-0" aria-hidden />
                <div>
                  <p className="font-medium capitalize">{formatCustomerOrderStatus(ev.status)}</p>
                  <p className="text-xs text-[#6B6B6B]">
                    {new Date(ev.created_at).toLocaleString("en-IN")}
                  </p>
                  {ev.note && <p className="text-xs text-[#6B6B6B] mt-0.5">{ev.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
