import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { adminCrudDelete, adminCrudList, adminCrudUpsert } from "@/services/adminCmsService";

export default function AdminMotivationPage() {
  const [items, setItems] = useState<any[]>([]);
  const [quote, setQuote] = useState("");
  const [source, setSource] = useState("AKM Care");

  const load = async () => setItems(await adminCrudList("motivation_quotes"));
  useEffect(() => {
    void load().catch((e) => toast.error(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Motivation" subtitle="Daily quotes shown across the platform." />
      <div className="rounded-2xl border bg-white p-5 space-y-3 max-w-2xl">
        <textarea className="w-full min-h-28 rounded-xl border px-3 py-2.5" value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Quote" />
        <input className="w-full rounded-xl border px-3 py-2.5" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source" />
        <button
          type="button"
          className="rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold"
          onClick={async () => {
            await adminCrudUpsert("motivation_quotes", { quote, source, is_active: true });
            setQuote("");
            toast.success("Posted");
            await load();
          }}
        >
          Post quote
        </button>
      </div>
      <div className="space-y-2">
        {items.map((q) => (
          <div key={q.id} className="rounded-xl border bg-white p-4 flex justify-between gap-3">
            <div>
              <p className="font-medium">{q.quote}</p>
              <p className="text-sm text-slate-500">— {q.source}</p>
            </div>
            <button type="button" className="text-red-600 text-sm" onClick={async () => { await adminCrudDelete("motivation_quotes", q.id); await load(); }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
