import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/AdminUI";
import { deleteCoupon, listCoupons, upsertCoupon } from "@/services/adminCmsService";

const empty = {
  id: "",
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  min_purchase: 0,
  usage_limit: "",
  expires_at: "",
  is_active: true,
};

export default function AdminCouponsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState(empty);

  const load = async () => setItems(await listCoupons());
  useEffect(() => {
    void load().catch((e) => toast.error(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Coupons" subtitle="Percentage, flat, and free-shipping discounts with limits." />

      <div className="rounded-2xl border bg-white p-5 grid sm:grid-cols-2 gap-3 max-w-3xl">
        <input className="rounded-xl border px-3 py-2.5 text-sm" placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        <select className="rounded-xl border px-3 py-2.5 text-sm" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
          <option value="percentage">Percentage</option>
          <option value="flat">Flat</option>
          <option value="free_shipping">Free shipping</option>
        </select>
        <input className="rounded-xl border px-3 py-2.5 text-sm" type="number" placeholder="Discount value" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} />
        <input className="rounded-xl border px-3 py-2.5 text-sm" type="number" placeholder="Min purchase" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: Number(e.target.value) })} />
        <input className="rounded-xl border px-3 py-2.5 text-sm" type="number" placeholder="Usage limit" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
        <input className="rounded-xl border px-3 py-2.5 text-sm" type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
        <input className="sm:col-span-2 rounded-xl border px-3 py-2.5 text-sm" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
        </label>
        <button
          type="button"
          className="rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold"
          onClick={async () => {
            if (!form.code) return toast.error("Code required");
            await upsertCoupon({
              id: form.id || undefined,
              code: form.code,
              description: form.description || null,
              discount_type: form.discount_type,
              discount_value: Number(form.discount_value) || 0,
              min_purchase: Number(form.min_purchase) || 0,
              usage_limit: form.usage_limit === "" ? null : Number(form.usage_limit),
              expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
              is_active: form.is_active,
            });
            toast.success("Coupon saved");
            setForm(empty);
            await load();
          }}
        >
          {form.id ? "Update coupon" : "Create coupon"}
        </button>
      </div>

      {!items.length ? (
        <AdminEmpty message="No coupons yet." />
      ) : (
        <div className="rounded-2xl border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Min</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3 font-semibold">{c.code}</td>
                  <td className="px-4 py-3">{c.discount_type}</td>
                  <td className="px-4 py-3">{c.discount_value}</td>
                  <td className="px-4 py-3">{c.min_purchase}</td>
                  <td className="px-4 py-3">{c.used_count}{c.usage_limit != null ? ` / ${c.usage_limit}` : ""}</td>
                  <td className="px-4 py-3">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          id: c.id,
                          code: c.code,
                          description: c.description || "",
                          discount_type: c.discount_type,
                          discount_value: c.discount_value,
                          min_purchase: c.min_purchase,
                          usage_limit: c.usage_limit ?? "",
                          expires_at: c.expires_at ? String(c.expires_at).slice(0, 10) : "",
                          is_active: c.is_active,
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-red-600"
                      onClick={async () => {
                        await deleteCoupon(c.id);
                        await load();
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
