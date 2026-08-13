import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader, Chip } from "@/components/admin/AdminUI";
import { FulfillmentBadge, PaymentBadge } from "@/components/admin/AdminOrderBadges";
import {
  ADMIN_ORDER_LIST_LIMIT,
  getAdminOrderById,
  listAdminOrders,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  updateOrderStatus,
  type AdminOrderListRow,
  type OrderStatus,
} from "@/services/adminOrdersService";
import { canManageOrders } from "@/services/adminAuthService";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminOrderAlerts } from "@/context/AdminOrderAlertsContext";
import { formatINR } from "@/lib/ecommerce/pricing";
import { formatOrderStatus, statusOptionsFor } from "@/lib/admin/orderFulfillment";
import { cn } from "@/lib/utils";

export default function AdminOrdersPage() {
  const { role } = useAdminAuth();
  const canEdit = canManageOrders(role || "staff");
  const { lastEvent, live, unseenCount, isUnseen, soundEnabled, setSoundEnabled } = useAdminOrderAlerts();
  const [orders, setOrders] = useState<AdminOrderListRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const skipFirstReconnect = useRef(true);
  const filtersRef = useRef({ q, status, paymentStatus, from, to });
  filtersRef.current = { q, status, paymentStatus, from, to };

  const matchesFilters = useCallback((row: AdminOrderListRow) => {
    const f = filtersRef.current;
    if (f.status !== "all" && row.status !== f.status) return false;
    if (f.paymentStatus !== "all" && row.payment_status !== f.paymentStatus) return false;
    if (f.q.trim()) {
      const s = f.q.trim().toLowerCase();
      const blob = `${row.order_number} ${row.customer_name} ${row.customer_email} ${row.customer_phone || ""}`.toLowerCase();
      if (!blob.includes(s)) return false;
    }
    return true;
  }, []);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const f = filtersRef.current;
      setOrders(
        await listAdminOrders({
          q: f.q,
          status: f.status,
          paymentStatus: f.paymentStatus,
          from: f.from || undefined,
          to: f.to || undefined,
        }),
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [status, paymentStatus, from, to, load]);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === "reconnect") {
      if (skipFirstReconnect.current) {
        skipFirstReconnect.current = false;
        return;
      }
      void load(true);
      return;
    }
    if (lastEvent.type === "insert" && lastEvent.row) {
      const row = lastEvent.row;
      setOrders((prev) => {
        if (prev.some((o) => o.id === row.id)) return prev;
        if (!matchesFilters(row)) return prev;
        return [row, ...prev].slice(0, ADMIN_ORDER_LIST_LIMIT);
      });
      return;
    }
    if (lastEvent.type === "update" && lastEvent.id) {
      const id = lastEvent.id;
      void getAdminOrderById(id)
        .then((row) => {
          if (!row) return;
          setOrders((prev) => {
            const idx = prev.findIndex((o) => o.id === row.id);
            if (idx === -1) {
              if (!matchesFilters(row)) return prev;
              return [row, ...prev].slice(0, ADMIN_ORDER_LIST_LIMIT);
            }
            if (!matchesFilters(row)) return prev.filter((o) => o.id !== row.id);
            const next = [...prev];
            next[idx] = row;
            return next;
          });
        })
        .catch(() => undefined);
    }
  }, [lastEvent, load, matchesFilters]);

  const onStatusChange = async (orderId: string, next: string) => {
    setUpdatingId(orderId);
    toast.message("Updating…");
    try {
      await updateOrderStatus(orderId, next as OrderStatus, role);
      toast.success("Order status updated");
      const row = await getAdminOrderById(orderId);
      if (row) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? row : o)));
      }
    } catch {
      toast.error("Unable to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        subtitle="Incoming checkout orders. Payment status and fulfillment status are separate."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold border",
                live ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-500",
              )}
              aria-live="polite"
            >
              {live ? "Live" : "Live unavailable — refresh still works"}
            </span>
            {unseenCount > 0 && (
              <span className="rounded-full bg-red-600 text-white px-2.5 py-1 text-[11px] font-semibold" aria-label={`${unseenCount} new orders`}>
                {unseenCount} new
              </span>
            )}
            <button
              type="button"
              className="rounded-xl border bg-white px-3 py-1.5 text-xs font-semibold"
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? "Sound on" : "Enable sound"}
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-3">
        <input
          className="rounded-xl border bg-white px-3 py-2.5 text-sm min-w-[220px] flex-1"
          placeholder="Search order #, name, email, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void load()}
          aria-label="Search orders"
        />
        <button type="button" onClick={() => void load()} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">
          Search
        </button>
        <label className="text-xs text-slate-500 flex items-center gap-1">
          From
          <input type="date" className="rounded-xl border px-2 py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-xs text-slate-500 flex items-center gap-1">
          To
          <input type="date" className="rounded-xl border px-2 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      <p className="text-xs font-semibold text-slate-500 mb-1">Payment</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <Chip active={paymentStatus === "all"} onClick={() => setPaymentStatus("all")}>
          All
        </Chip>
        {PAYMENT_STATUSES.map((s) => (
          <Chip key={s} active={paymentStatus === s} onClick={() => setPaymentStatus(s)}>
            {s === "failed" ? "Failed" : s}
          </Chip>
        ))}
      </div>

      <p className="text-xs font-semibold text-slate-500 mb-1">Order status</p>
      <div className="flex flex-wrap gap-2 mb-4">
        <Chip active={status === "all"} onClick={() => setStatus("all")}>
          All
        </Chip>
        {ORDER_STATUSES.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
            {formatOrderStatus(s)}
          </Chip>
        ))}
      </div>

      <p className="text-xs text-slate-400 mb-3">Newest first · showing up to {ADMIN_ORDER_LIST_LIMIT} orders</p>

      {loading ? (
        <p className="text-sm text-slate-500">Loading orders…</p>
      ) : !orders.length ? (
        <AdminEmpty message="No orders found." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const qty = (o.order_items || []).reduce((n, it) => n + Number(it.quantity || 0), 0);
            return (
              <article
                key={o.id}
                className={cn(
                  "rounded-2xl border bg-white p-4",
                  isUnseen(o.id) && "border-orange-300 ring-1 ring-orange-100",
                )}
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/admin/orders/${o.id}`} className="font-semibold hover:text-orange-600">
                        {o.order_number || o.id.slice(0, 8)}
                      </Link>
                      {isUnseen(o.id) && (
                        <span className="text-[10px] font-bold uppercase text-orange-600">New</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 break-words">
                      {o.customer_name || "Customer"} · {o.customer_email || "—"} · {o.customer_phone || "—"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(o.created_at).toLocaleString("en-IN")}
                      {qty > 0 ? ` · ${qty} item${qty === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold">{formatINR(Number(o.grand_total || 0))}</p>
                    <div className="flex flex-wrap justify-end gap-1">
                      <PaymentBadge value={o.payment_status} />
                      <FulfillmentBadge value={o.status} />
                    </div>
                  </div>
                </div>
                {o.order_items && o.order_items.length > 0 && (
                  <ul className="mt-3 text-sm text-slate-600 space-y-1">
                    {o.order_items.map((it) => (
                      <li key={it.id}>
                        {it.product_name} × {it.quantity} — {formatINR(Number(it.line_total || 0))}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="text-sm font-medium" htmlFor={`status-${o.id}`}>
                    Fulfillment
                  </label>
                  <select
                    id={`status-${o.id}`}
                    className="rounded-xl border px-3 py-2 text-sm"
                    value={o.status || "pending"}
                    disabled={!canEdit || updatingId === o.id}
                    aria-label={`Update fulfillment status for ${o.order_number}`}
                    onChange={(e) => void onStatusChange(o.id, e.target.value)}
                  >
                    {statusOptionsFor(o.status || "pending").map((s) => (
                      <option key={s} value={s}>
                        {formatOrderStatus(s)}
                      </option>
                    ))}
                  </select>
                  <Link
                    to={`/admin/orders/${o.id}`}
                    className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                  >
                    View order
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
