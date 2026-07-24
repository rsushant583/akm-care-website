import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { adminCrudDelete, adminCrudList, adminCrudUpsert } from "@/services/adminCmsService";

export default function AdminFaqManagePage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ question: "", answer: "", category: "general" });

  const load = async () => setItems(await adminCrudList("faq"));
  useEffect(() => {
    void load().catch((e) => toast.error(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <AdminPageHeader title="FAQ" subtitle="Manage frequently asked questions." />
      <div className="rounded-2xl border bg-white p-5 space-y-3 max-w-2xl">
        <input className="w-full rounded-xl border px-3 py-2.5" placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
        <textarea className="w-full min-h-28 rounded-xl border px-3 py-2.5" placeholder="Answer" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
        <select className="w-full rounded-xl border px-3 py-2.5" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {["general", "training", "services", "products"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold"
          onClick={async () => {
            await adminCrudUpsert("faq", { ...form, is_active: true });
            setForm({ question: "", answer: "", category: "general" });
            toast.success("FAQ added");
            await load();
          }}
        >
          Add FAQ
        </button>
      </div>
      <div className="space-y-2">
        {items.map((f) => (
          <div key={f.id} className="rounded-xl border bg-white p-4 flex justify-between gap-3">
            <div>
              <p className="font-semibold">{f.question}</p>
              <p className="text-sm text-slate-600 mt-1">{f.answer}</p>
            </div>
            <button type="button" className="text-red-600 text-sm" onClick={async () => { await adminCrudDelete("faq", f.id); await load(); }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
