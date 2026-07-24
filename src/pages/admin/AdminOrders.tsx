import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader, Chip } from "@/components/admin/AdminUI";
import { listAdminOrders, ORDER_STATUSES, updateOrderStatus, type OrderStatus } from "@/services/adminOrdersService";
import { formatINR } from "@/lib/ecommerce/pricing";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setOrders(await listAdminOrders({ q, status }));
    } catch (e: any) {
      toast.error(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [status]);

  return (
    <div>
      <AdminPageHeader title="Orders" subtitle="Search, filter, and update fulfillment status." />
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="rounded-xl border bg-white px-3 py-2.5 text-sm min-w-[220px] flex-1"
          placeholder="Search order #, email, name, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void load()}
        />
        <button type="button" onClick={() => void load()} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">
          Search
        </button>
        <Chip active={status === "all"} onClick={() => setStatus("all")}>All</Chip>
        {ORDER_STATUSES.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
            {s.replace(/_/g, " ")}
          </Chip>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading orders…</p>
      ) : !orders.length ? (
        <AdminEmpty message="No orders found." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border bg-white p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-semibold">{o.order_number || o.id.slice(0, 8)}</p>
                  <p className="text-sm text-slate-500">
                    {o.customer_name || "Customer"} · {o.customer_email || "—"} · {o.customer_phone || "—"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatINR(Number(o.grand_total || o.total || 0))}</p>
                  <p className="text-xs capitalize text-slate-500">Pay: {o.payment_status || "—"}</p>
                </div>
              </div>
              {Array.isArray(o.order_items) && o.order_items.length > 0 && (
                <ul className="mt-3 text-sm text-slate-600 space-y-1">
                  {o.order_items.map((it: any) => (
                    <li key={it.id}>
                      {it.product_name} × {it.quantity} — {formatINR(Number(it.line_total || 0))}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="rounded-xl border px-3 py-2 text-sm"
                  value={o.status || "pending"}
                  onChange={async (e) => {
                    try {
                      await updateOrderStatus(o.id, e.target.value as OrderStatus);
                      toast.success("Status updated");
                      void load();
                    } catch (err: any) {
                      toast.error(err.message);
                    }
                  }}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
