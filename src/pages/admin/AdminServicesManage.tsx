import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { adminCrudDelete, adminCrudList, adminCrudUpsert } from "@/services/adminCmsService";

export default function AdminServicesManagePage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", category: "training", icon: "Briefcase" });

  const load = async () => setItems(await adminCrudList("services"));
  useEffect(() => {
    void load().catch((e) => toast.error(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Services" subtitle="Manage services listed on the website." />
      <div className="rounded-2xl border bg-white p-5 space-y-3 max-w-2xl">
        <input className="w-full rounded-xl border px-3 py-2.5" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className="w-full min-h-24 rounded-xl border px-3 py-2.5" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select className="w-full rounded-xl border px-3 py-2.5" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {["training", "hr", "compliance", "other"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold"
          onClick={async () => {
            await adminCrudUpsert("services", { ...form, is_active: true });
            setForm({ title: "", description: "", category: "training", icon: "Briefcase" });
            toast.success("Service added");
            await load();
          }}
        >
          Add service
        </button>
      </div>
      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="rounded-xl border bg-white p-4 flex justify-between gap-3">
            <div>
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm text-slate-500">{s.category}</p>
            </div>
            <button type="button" className="text-red-600 text-sm" onClick={async () => { await adminCrudDelete("services", s.id); await load(); }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
