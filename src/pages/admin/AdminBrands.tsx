import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader, ImageDropzone } from "@/components/admin/AdminUI";
import { deleteBrand, listBrands, upsertBrand } from "@/services/adminCatalogService";
import { adminUploadFile } from "@/services/adminDashboardService";

export default function AdminBrandsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ id: "", name: "", description: "", logo_url: "" });

  const load = async () => setItems(await listBrands());
  useEffect(() => {
    void load().catch((e) => toast.error(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Brands" subtitle="Manage brand names and logos." />
      <div className="rounded-2xl border bg-white p-5 space-y-3 max-w-xl">
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Brand name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea className="w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <ImageDropzone
          multiple={false}
          label="Upload brand logo"
          onFiles={async (files) => {
            const file = files[0];
            if (!file) return;
            const { url } = await adminUploadFile({ bucket: "brands", path: `brands/${Date.now()}-${file.name}`, file });
            setForm((f) => ({ ...f, logo_url: url }));
            toast.success("Logo uploaded");
          }}
        />
        {form.logo_url && <img src={form.logo_url} alt="" className="h-16 object-contain" />}
        <button
          type="button"
          className="rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold"
          onClick={async () => {
            if (!form.name.trim()) return toast.error("Name required");
            await upsertBrand({
              id: form.id || undefined,
              name: form.name,
              description: form.description,
              logo_url: form.logo_url || null,
            });
            toast.success("Brand saved");
            setForm({ id: "", name: "", description: "", logo_url: "" });
            await load();
          }}
        >
          {form.id ? "Update brand" : "Add brand"}
        </button>
      </div>

      {!items.length ? (
        <AdminEmpty message="No brands yet." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((b) => (
            <div key={b.id} className="rounded-2xl border bg-white p-4 flex items-center gap-3">
              {b.logo_url ? <img src={b.logo_url} alt="" className="h-12 w-12 object-contain" /> : <div className="h-12 w-12 rounded bg-slate-100" />}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{b.name}</p>
                <p className="text-xs text-slate-500">{b.slug}</p>
              </div>
              <button
                type="button"
                className="text-sm text-slate-600"
                onClick={() => setForm({ id: b.id, name: b.name, description: b.description || "", logo_url: b.logo_url || "" })}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-sm text-red-600"
                onClick={async () => {
                  if (!confirm("Delete brand?")) return;
                  await deleteBrand(b.id);
                  await load();
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
