import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader, ImageDropzone } from "@/components/admin/AdminUI";
import {
  deleteCategory,
  deleteSubcategory,
  listCategoriesAdmin,
  listSubcategories,
  reorderCategories,
  upsertCategory,
  upsertSubcategory,
} from "@/services/adminCatalogService";
import { adminUploadFile } from "@/services/adminDashboardService";

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", description: "", image_url: "", parent_id: "" });
  const [subForm, setSubForm] = useState({ category_id: "", name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const [c, s] = await Promise.all([listCategoriesAdmin(), listSubcategories()]);
    setCats(c);
    setSubs(s);
  };

  useEffect(() => {
    void load().catch((e) => toast.error(e.message));
  }, []);

  const save = async () => {
    try {
      await upsertCategory({
        id: editingId || undefined,
        name: form.name,
        description: form.description,
        image_url: form.image_url || null,
        parent_id: form.parent_id || null,
      });
      toast.success(editingId ? "Category updated" : "Category created");
      setForm({ name: "", description: "", image_url: "", parent_id: "" });
      setEditingId(null);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const move = async (id: string, dir: -1 | 1) => {
    const ids = cats.map((c) => c.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await reorderCategories(ids);
    await load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Categories" subtitle="Create, reorder, and nest categories & subcategories." />

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-5 space-y-3">
          <h2 className="font-semibold">{editingId ? "Edit category" : "New category"}</h2>
          <input className="w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="w-full rounded-xl border px-3 py-2.5 text-sm" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
            <option value="">No parent (top-level)</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ImageDropzone
            multiple={false}
            label="Upload category image"
            onFiles={async (files) => {
              const file = files[0];
              if (!file) return;
              const { url } = await adminUploadFile({
                bucket: "categories",
                path: `categories/${Date.now()}-${file.name}`,
                file,
              });
              setForm((f) => ({ ...f, image_url: url }));
              toast.success("Image uploaded");
            }}
          />
          {form.image_url && <img src={form.image_url} alt="" className="h-24 rounded-lg object-cover" />}
          <button type="button" onClick={() => void save()} className="rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold">
            {editingId ? "Update" : "Create"} category
          </button>
        </div>

        <div className="rounded-2xl border bg-white p-5 space-y-3">
          <h2 className="font-semibold">New subcategory</h2>
          <select className="w-full rounded-xl border px-3 py-2.5 text-sm" value={subForm.category_id} onChange={(e) => setSubForm({ ...subForm, category_id: e.target.value })}>
            <option value="">Select parent category</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input className="w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Subcategory name" value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} />
          <textarea className="w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Description" value={subForm.description} onChange={(e) => setSubForm({ ...subForm, description: e.target.value })} />
          <button
            type="button"
            className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold"
            onClick={async () => {
              if (!subForm.category_id || !subForm.name) return toast.error("Category and name required");
              await upsertSubcategory(subForm as any);
              toast.success("Subcategory created");
              setSubForm({ category_id: "", name: "", description: "" });
              await load();
            }}
          >
            Create subcategory
          </button>
        </div>
      </div>

      {!cats.length ? (
        <AdminEmpty message="No categories yet." />
      ) : (
        <div className="rounded-2xl border bg-white divide-y">
          {cats.map((c) => (
            <div key={c.id} className="p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                {c.image_url ? <img src={c.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-slate-100" />}
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.slug} · order {c.display_order}</p>
                </div>
              </div>
              <div className="flex gap-2 text-sm">
                <button type="button" className="px-2 py-1 rounded border" onClick={() => void move(c.id, -1)}>↑</button>
                <button type="button" className="px-2 py-1 rounded border" onClick={() => void move(c.id, 1)}>↓</button>
                <button
                  type="button"
                  className="px-3 py-1 rounded border"
                  onClick={() => {
                    setEditingId(c.id);
                    setForm({
                      name: c.name,
                      description: c.description || "",
                      image_url: c.image_url || "",
                      parent_id: c.parent_id || "",
                    });
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded border text-red-600"
                  onClick={async () => {
                    if (!confirm("Delete category?")) return;
                    await deleteCategory(c.id);
                    toast.success("Deleted");
                    await load();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!!subs.length && (
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold mb-3">Subcategories</h3>
          <div className="space-y-2">
            {subs.map((s) => (
              <div key={s.id} className="flex justify-between gap-3 text-sm border rounded-xl px-3 py-2">
                <span>{s.name} <span className="text-slate-400">({cats.find((c) => c.id === s.category_id)?.name})</span></span>
                <button
                  type="button"
                  className="text-red-600"
                  onClick={async () => {
                    await deleteSubcategory(s.id);
                    await load();
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
