import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/AdminUI";
import { listCmsPages, updateCmsPage } from "@/services/adminCmsService";

export default function AdminContentPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [body, setBody] = useState("");
  const [jsonText, setJsonText] = useState("");

  const load = async () => {
    const rows = await listCmsPages();
    setPages(rows);
    if (!selected && rows[0]) select(rows[0]);
  };

  const select = (page: any) => {
    setSelected(page);
    const content = page.content || {};
    setBody(typeof content.body === "string" ? content.body : "");
    setJsonText(JSON.stringify(content, null, 2));
  };

  useEffect(() => {
    void load().catch((e) => toast.error(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Content" subtitle="Edit About, CSR, Contact, Home sections, Testimonials without code." />
      <div className="grid lg:grid-cols-[240px_1fr] gap-4">
        <aside className="rounded-2xl border bg-white p-2 h-fit">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => select(p)}
              className={`w-full text-left rounded-xl px-3 py-2 text-sm mb-1 ${selected?.id === p.id ? "bg-orange-50 text-orange-700 font-semibold" : "hover:bg-slate-50"}`}
            >
              {p.title}
            </button>
          ))}
          {!pages.length && <AdminEmpty message="No CMS pages. Apply admin migration." />}
        </aside>

        {selected && (
          <div className="rounded-2xl border bg-white p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-lg">{selected.title}</h2>
              <p className="text-xs text-slate-500">slug: {selected.slug}</p>
            </div>
            {(selected.slug === "about" || selected.slug === "csr") && (
              <label className="block text-sm">
                <span className="font-medium">Body content</span>
                <textarea
                  className="mt-1 w-full min-h-48 rounded-xl border px-3 py-2.5"
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    setJsonText(JSON.stringify({ ...(selected.content || {}), body: e.target.value }, null, 2));
                  }}
                />
              </label>
            )}
            <label className="block text-sm">
              <span className="font-medium">Content JSON</span>
              <textarea
                className="mt-1 w-full min-h-64 rounded-xl border px-3 py-2.5 font-mono text-xs"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold"
              onClick={async () => {
                try {
                  const content = JSON.parse(jsonText);
                  const updated = await updateCmsPage(selected.id, content, selected.title);
                  toast.success("Content saved");
                  setSelected(updated);
                  await load();
                } catch (e: any) {
                  toast.error(e.message || "Invalid JSON");
                }
              }}
            >
              Save content
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
