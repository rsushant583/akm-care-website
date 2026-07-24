import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/AdminUI";
import { getCustomerOrders, listCustomers, setCustomerBlocked } from "@/services/adminOrdersService";
import { formatINR } from "@/lib/ecommerce/pricing";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const load = async () => {
    try {
      setCustomers(await listCustomers({ q }));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Customers" subtitle="Search customers, view orders, block/unblock access." />
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border bg-white px-3 py-2.5 text-sm"
          placeholder="Search name, email, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void load()}
        />
        <button type="button" onClick={() => void load()} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">
          Search
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white overflow-hidden">
          {!customers.length ? (
            <div className="p-6"><AdminEmpty message="No customers found." /></div>
          ) : (
            <ul className="divide-y max-h-[70vh] overflow-y-auto">
              {customers.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-slate-50"
                    onClick={async () => {
                      setSelected(c);
                      setOrders(await getCustomerOrders(c.id));
                    }}
                  >
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-semibold">{c.full_name || "Customer"}</p>
                        <p className="text-xs text-slate-500">{c.email || c.phone || c.id}</p>
                      </div>
                      {c.is_blocked && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 h-fit">Blocked</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-4">
          {!selected ? (
            <p className="text-sm text-slate-500">Select a customer to view order history.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-lg">{selected.full_name || "Customer"}</h2>
                <p className="text-sm text-slate-500">{selected.email}</p>
                <p className="text-sm text-slate-500">{selected.phone}</p>
              </div>
              <button
                type="button"
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${selected.is_blocked ? "bg-emerald-600" : "bg-red-600"}`}
                onClick={async () => {
                  await setCustomerBlocked(selected.id, !selected.is_blocked);
                  toast.success(selected.is_blocked ? "Unblocked" : "Blocked");
                  setSelected({ ...selected, is_blocked: !selected.is_blocked });
                  void load();
                }}
              >
                {selected.is_blocked ? "Unblock customer" : "Block customer"}
              </button>
              <div>
                <h3 className="font-semibold mb-2">Order history</h3>
                {!orders.length ? (
                  <p className="text-sm text-slate-500">No orders.</p>
                ) : (
                  <ul className="space-y-2">
                    {orders.map((o) => (
                      <li key={o.id} className="rounded-xl border px-3 py-2 text-sm flex justify-between gap-2">
                        <span>
                          {o.order_number || o.id.slice(0, 8)} · <span className="capitalize">{o.status}</span>
                        </span>
                        <span className="font-semibold">{formatINR(Number(o.grand_total || 0))}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
