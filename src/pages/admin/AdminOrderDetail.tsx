import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/AdminUI";
import { FulfillmentBadge, PaymentBadge } from "@/components/admin/AdminOrderBadges";
import {
  getAdminOrderDetail,
  updateOrderStatus,
  type AdminOrderDetail,
  type OrderStatus,
} from "@/services/adminOrdersService";
import { canManageOrders } from "@/services/adminAuthService";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminOrderAlerts } from "@/context/AdminOrderAlertsContext";
import { formatINR } from "@/lib/ecommerce/pricing";
import { formatOrderStatus, statusOptionsFor } from "@/lib/admin/orderFulfillment";
import { AdminShippingPanel } from "@/components/admin/AdminShippingPanel";

function addrField(address: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!address) return "";
  for (const k of keys) {
    const v = address[k];
    if (v != null && String(v).trim()) return String(v);
  }
  return "";
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAdminAuth();
  const canEdit = canManageOrders(role || "staff");
  const { markSeen, lastEvent } = useAdminOrderAlerts();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const row = await getAdminOrderDetail(id);
      setOrder(row);
      if (row) markSeen(row.id);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Unable to load order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id || !lastEvent) return;
    if (lastEvent.type === "update" && lastEvent.id === id) {
      void getAdminOrderDetail(id).then((row) => {
        if (row) setOrder(row);
      });
    }
  }, [lastEvent, id]);

  const onStatusChange = async (next: string) => {
    if (!order) return;
    setUpdating(true);
    toast.message("Updating…");
    try {
      await updateOrderStatus(order.id, next as OrderStatus, role);
      toast.success("Order status updated");
      const row = await getAdminOrderDetail(order.id);
      if (row) setOrder(row);
    } catch {
      toast.error("Unable to update order status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading order…</p>;
  }
  if (!order) {
    return (
      <div>
        <AdminPageHeader title="Order" subtitle="Not found or not authorized." />
        <AdminEmpty message="This order could not be loaded." />
        <Link to="/admin/orders" className="inline-block mt-4 text-sm font-semibold text-orange-600">
          Back to orders
        </Link>
      </div>
    );
  }

  const address = order.shipping_address || {};
  const line1 = addrField(address, ["line1", "address_line1", "street", "area"]);
  const line2 = addrField(address, ["line2", "address_line2", "landmark"]);
  const city = addrField(address, ["city"]);
  const state = addrField(address, ["state"]);
  const pincode = addrField(address, ["pincode", "pin", "postal_code"]);
  const country = addrField(address, ["country"]);

  return (
    <div className="space-y-4 max-w-3xl">
      <AdminPageHeader
        title={`Order ${order.order_number}`}
        subtitle={`Created ${new Date(order.created_at).toLocaleString("en-IN")}`}
        actions={
          <Link to="/admin/orders" className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold">
            Back to orders
          </Link>
        }
      />

      <section className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <PaymentBadge value={order.payment_status} />
          <FulfillmentBadge value={order.status} />
        </div>
        <p className="text-2xl font-bold">{formatINR(Number(order.grand_total || 0))}</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium" htmlFor="detail-status">
            Fulfillment
          </label>
          <select
            id="detail-status"
            className="rounded-xl border px-3 py-2 text-sm"
            value={order.status}
            disabled={!canEdit || updating}
            aria-label="Update fulfillment status"
            onChange={(e) => void onStatusChange(e.target.value)}
          >
            {statusOptionsFor(order.status).map((s) => (
              <option key={s} value={s}>
                {formatOrderStatus(s)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4">
        <h2 className="font-semibold mb-2">Customer</h2>
        <p className="text-sm">{order.customer_name}</p>
        <p className="text-sm text-slate-600">{order.customer_email}</p>
        <p className="text-sm text-slate-600">{order.customer_phone || "—"}</p>
      </section>

      <section className="rounded-2xl border bg-white p-4">
        <h2 className="font-semibold mb-3">Items</h2>
        <ul className="space-y-3">
          {(order.order_items || []).map((it) => (
            <li key={it.id} className="flex gap-3">
              {it.image_url ? (
                <img src={it.image_url} alt="" className="h-14 w-12 rounded-lg object-cover bg-slate-100" />
              ) : (
                <div className="h-14 w-12 rounded-lg bg-slate-100" aria-hidden />
              )}
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{it.product_name}</p>
                {it.sku && <p className="text-xs text-slate-500">Code: {it.sku}</p>}
                <p className="text-xs text-slate-500">
                  {[it.color_name, it.variant_name].filter(Boolean).join(" · ") || "—"}
                </p>
                <p className="text-xs text-slate-500">
                  Qty {it.quantity} · {formatINR(Number(it.unit_price || 0))} each
                </p>
              </div>
              <p className="text-sm font-semibold">{formatINR(Number(it.line_total || 0))}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border bg-white p-4 text-sm space-y-1">
        <h2 className="font-semibold mb-2">Price</h2>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatINR(Number(order.subtotal || 0))}</span>
        </div>
        {Number(order.discount_total || 0) > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
            <span>−{formatINR(Number(order.discount_total))}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{formatINR(Number(order.shipping_total || 0))}</span>
        </div>
        {Number(order.gst_total || 0) > 0 && (
          <div className="flex justify-between text-slate-500">
            <span>GST (included display)</span>
            <span>{formatINR(Number(order.gst_total))}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold pt-2 border-t">
          <span>Grand total</span>
          <span>{formatINR(Number(order.grand_total || 0))}</span>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 text-sm space-y-1">
        <h2 className="font-semibold mb-2">Shipping address</h2>
        <p>
          {line1 || "—"}
          {line2 ? `, ${line2}` : ""}
        </p>
        <p>
          {[city, state, pincode].filter(Boolean).join(", ") || "—"}
          {country ? ` · ${country}` : ""}
        </p>
        <p>Method: {order.shipping?.method || order.shipping_method || "—"}</p>
        <p>Projection status: {order.shipping?.status || "—"}</p>
        {order.shipping?.estimated_days != null && <p>Estimated days: {order.shipping.estimated_days}</p>}
        {order.shipping?.tracking_number ? (
          <p>
            Tracking: {order.shipping.carrier ? `${order.shipping.carrier} · ` : ""}
            {order.shipping.tracking_number}
          </p>
        ) : null}
      </section>

      <AdminShippingPanel
        order={order}
        canEdit={canEdit}
        onChanged={() => {
          void getAdminOrderDetail(order.id).then((row) => {
            if (row) setOrder(row);
          });
        }}
      />

      <section className="rounded-2xl border bg-white p-4 text-sm space-y-1">
        <h2 className="font-semibold mb-2">Payment</h2>
        <p>Provider: {order.payment?.provider || "razorpay"}</p>
        <p>Payment status: {order.payment_status}</p>
        {order.payment?.status && <p>Provider status: {order.payment.status}</p>}
        {order.payment?.razorpay_payment_id && <p>Payment ID: {order.payment.razorpay_payment_id}</p>}
        {(order.payment?.razorpay_order_id || order.razorpay_order_id) && (
          <p>Razorpay order ID: {order.payment?.razorpay_order_id || order.razorpay_order_id}</p>
        )}
        <p>Amount: {formatINR(Number(order.payment?.amount ?? order.grand_total ?? 0))}</p>
        {order.payment?.method && <p>Method: {order.payment.method}</p>}
      </section>

      <section className="rounded-2xl border bg-white p-4">
        <h2 className="font-semibold mb-3">Timeline</h2>
        {order.timeline.length === 0 ? (
          <p className="text-sm text-slate-500">No history records yet.</p>
        ) : (
          <ol className="space-y-3">
            {order.timeline.map((ev, idx) => (
              <li key={ev.id} className="flex gap-3 text-sm">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-900 shrink-0" aria-hidden />
                <div>
                  <p className="font-medium capitalize">{formatOrderStatus(ev.status)}</p>
                  <p className="text-xs text-slate-500">{new Date(ev.created_at).toLocaleString("en-IN")}</p>
                  {ev.note && <p className="text-xs text-slate-500">{ev.note}</p>}
                  {idx < order.timeline.length - 1 && <span className="sr-only">then</span>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {order.notes && (
        <section className="rounded-2xl border bg-white p-4 text-sm">
          <h2 className="font-semibold mb-2">Notes</h2>
          <p className="whitespace-pre-wrap">{order.notes}</p>
        </section>
      )}
    </div>
  );
}
