import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Archive, Pencil, Plus, Search, Star, TrendingUp, Trash2, Award } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader, Chip } from "@/components/admin/AdminUI";
import {
  archiveProduct,
  deleteProduct,
  duplicateProduct,
  listAdminProducts,
  updateProduct,
  type AdminProduct,
} from "@/services/adminCatalogService";
import { formatINR } from "@/lib/ecommerce/pricing";

export default function AdminProductsPage() {
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listAdminProducts({ q, status }));
    } catch (e: any) {
      toast.error(e.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [status]);

  const filtered = useMemo(() => items, [items]);

  return (
    <div>
      <AdminPageHeader
        title="Products"
        subtitle="Create, edit, feature, and archive catalog products."
        actions={
          <Link to="/admin/products/new" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold">
            <Plus size={16} /> Add Product
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm"
            placeholder="Search name, SKU, slug…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load()}
          />
        </div>
        <button type="button" onClick={() => void load()} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">
          Search
        </button>
        {["all", "available", "sold_out", "archived"].map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
            {s.replace("_", " ")}
          </Chip>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading products…</p>
      ) : !filtered.length ? (
        <AdminEmpty message="No products found. Add your first product." />
      ) : (
        <div className="rounded-2xl border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Flags</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : null}
                        </div>
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.sku || p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatINR(Number(p.akm_care_price ?? p.price ?? 0))}</td>
                    <td className="px-4 py-3">{p.stock_quantity}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {p.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Featured</span>}
                        {p.is_trending && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">Trending</span>}
                        {p.is_best_seller && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Best</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{p.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/products/${p.id}`} className="p-2 rounded-lg hover:bg-slate-100" title="Edit">
                          <Pencil size={14} />
                        </Link>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-slate-100"
                          title="Feature"
                          onClick={async () => {
                            await updateProduct(p.id, { is_featured: !p.is_featured });
                            toast.success(p.is_featured ? "Unfeatured" : "Featured");
                            void load();
                          }}
                        >
                          <Star size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-slate-100"
                          title="Trending"
                          onClick={async () => {
                            await updateProduct(p.id, { is_trending: !p.is_trending });
                            toast.success("Updated trending");
                            void load();
                          }}
                        >
                          <TrendingUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-slate-100"
                          title="Best seller"
                          onClick={async () => {
                            await updateProduct(p.id, { is_best_seller: !p.is_best_seller });
                            toast.success("Updated best seller");
                            void load();
                          }}
                        >
                          <Award size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-slate-100"
                          title="Duplicate"
                          onClick={async () => {
                            await duplicateProduct(p.id);
                            toast.success("Duplicated");
                            void load();
                          }}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-slate-100"
                          title="Archive"
                          onClick={async () => {
                            await archiveProduct(p.id);
                            toast.success("Archived");
                            void load();
                          }}
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                          title="Delete"
                          onClick={async () => {
                            if (!confirm("Delete this product permanently?")) return;
                            await deleteProduct(p.id);
                            toast.success("Deleted");
                            void load();
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
