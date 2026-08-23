import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Copy, Archive, Pencil, Plus, Search, Star, TrendingUp, Trash2, Award } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader, Chip } from "@/components/admin/AdminUI";
import { OFFICIAL_BROWSABLE_CATEGORIES } from "@/data/catalog/categories";
import {
  archiveProduct,
  deleteProduct,
  duplicateProduct,
  listAdminProducts,
  updateProduct,
  type AdminProduct,
  type ListAdminProductsOpts,
} from "@/services/adminCatalogService";
import { formatINR } from "@/lib/ecommerce/pricing";
import { loadCatalogSettings } from "@/lib/admin/catalogSettings";

function errMessage(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

export default function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [qInput, setQInput] = useState(searchParams.get("q") || "");
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "all";
  const category = searchParams.get("category") || "";
  const stock = searchParams.get("stock") || "all";
  const sort = searchParams.get("sort") || "newest";

  const patchParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === "all" || (key === "sort" && value === "newest") || (key === "q" && !value.trim())) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    void loadCatalogSettings().then((s) => setLowStockThreshold(s.low_stock_threshold));
  }, []);

  useEffect(() => {
    setQInput(q);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listAdminProducts({
      q,
      status,
      category: category || undefined,
      stock: stock === "all" ? undefined : (stock as ListAdminProductsOpts["stock"]),
      sort: sort as ListAdminProductsOpts["sort"],
      lowStockThreshold,
    })
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) toast.error(errMessage(e, "Failed to load products"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, status, category, stock, sort, lowStockThreshold]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (qInput !== q) patchParams({ q: qInput.trim() || undefined });
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  const load = () => {
    // Force reload with current URL filters
    patchParams({
      q: q || undefined,
      status: status === "all" ? undefined : status,
      category: category || undefined,
      stock: stock === "all" ? undefined : stock,
      sort: sort === "newest" ? undefined : sort,
    });
    void listAdminProducts({
      q,
      status,
      category: category || undefined,
      stock: stock === "all" ? undefined : (stock as ListAdminProductsOpts["stock"]),
      sort: sort as ListAdminProductsOpts["sort"],
      lowStockThreshold,
    })
      .then(setItems)
      .catch((e: unknown) => toast.error(errMessage(e, "Failed to load products")));
  };

  const filtered = useMemo(() => items, [items]);

  return (
    <div>
      <AdminPageHeader
        title="Products"
        subtitle="Search, filter, draft, publish, and merchandise catalog products."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/products?status=draft" className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">
              Drafts
            </Link>
            <Link to="/admin/products?stock=low_stock" className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">
              Low stock
            </Link>
            <Link to="/admin/catalog-quality" className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">
              Data quality
            </Link>
            <Link to="/admin/catalog-import" className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">
              Bulk import
            </Link>
            <Link to="/admin/products/new" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold">
              <Plus size={16} /> Add Product
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm"
            placeholder="Search name, SKU, slug…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") patchParams({ q: qInput.trim() || undefined });
            }}
          />
        </div>
        <select
          className="rounded-xl border bg-white px-3 py-2.5 text-sm"
          value={category}
          onChange={(e) => patchParams({ category: e.target.value || undefined })}
        >
          <option value="">All categories</option>
          {OFFICIAL_BROWSABLE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <select
          className="rounded-xl border bg-white px-3 py-2.5 text-sm"
          value={sort}
          onChange={(e) => patchParams({ sort: e.target.value })}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "available", "sold_out", "draft", "archived"].map((s) => (
          <Chip key={s} active={status === s} onClick={() => patchParams({ status: s })}>
            {s.replace("_", " ")}
          </Chip>
        ))}
        {[
          ["all", "Any stock"],
          ["low_stock", "Low stock"],
          ["out_of_stock", "Out of stock"],
          ["missing_image", "Missing image"],
          ["missing_category", "Missing category"],
        ].map(([id, label]) => (
          <Chip key={id} active={stock === id} onClick={() => patchParams({ stock: id })}>
            {label}
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
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
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
                          {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                        </div>
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.sku || p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{p.category_label || p.category || "—"}</td>
                    <td className="px-4 py-3">{formatINR(Number(p.akm_care_price ?? p.price ?? 0))}</td>
                    <td className="px-4 py-3">
                      <span className={Number(p.stock_quantity) <= 0 ? "text-red-600 font-semibold" : Number(p.stock_quantity) <= lowStockThreshold ? "text-amber-700 font-semibold" : ""}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {p.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Featured</span>}
                        {p.is_trending && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">Trending</span>}
                        {p.is_best_seller && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Best</span>}
                        {p.is_new_arrival && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-800">New</span>}
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
                          title="Best seller (manual — use only with sales evidence)"
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
