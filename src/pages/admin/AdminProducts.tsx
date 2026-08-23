import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Copy, Archive, Pencil, Plus, Search, Star, TrendingUp, Trash2, Award } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader, Chip } from "@/components/admin/AdminUI";
import { OFFICIAL_BROWSABLE_CATEGORIES } from "@/data/catalog/categories";
import {
  adminCatalogHasProducts,
  archiveProduct,
  deleteProduct,
  duplicateProduct,
  listAdminProducts,
  updateProduct,
  type AdminProduct,
} from "@/services/adminCatalogService";
import { formatINR } from "@/lib/ecommerce/pricing";
import { loadCatalogSettings } from "@/lib/admin/catalogSettings";
import {
  adminProductEmptyCopy,
  adminProductFiltersActive,
  adminProductFiltersToSearchParams,
  classifyAdminProductEmptyState,
  parseAdminProductFilters,
  type AdminProductListFilters,
  type AdminProductQualityFilter,
  type AdminProductStockFilter,
  type AdminProductStatusFilter,
} from "@/lib/admin/adminProductListFilters";

function errMessage(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

export default function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseAdminProductFilters(searchParams);
  const [qInput, setQInput] = useState(filters.q);
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalogHasProducts, setCatalogHasProducts] = useState<boolean | null>(null);
  const requestIdRef = useRef(0);

  const setFilters = useCallback(
    (patch: Partial<AdminProductListFilters>) => {
      const next: AdminProductListFilters = { ...filters, ...patch };
      setSearchParams(adminProductFiltersToSearchParams(next), { replace: true });
    },
    [filters, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setQInput("");
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    void loadCatalogSettings().then((s) => setLowStockThreshold(s.low_stock_threshold));
    void adminCatalogHasProducts()
      .then(setCatalogHasProducts)
      .catch(() => setCatalogHasProducts(null));
  }, []);

  useEffect(() => {
    setQInput(filters.q);
  }, [filters.q]);

  const fetchProducts = useCallback(
    async (active: AdminProductListFilters, threshold: number) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const rows = await listAdminProducts({
          q: active.q || undefined,
          status: active.status,
          category: active.category || undefined,
          stock: active.stock,
          quality: active.quality,
          sort: active.sort,
          lowStockThreshold: threshold,
        });
        if (requestId !== requestIdRef.current) return;
        setItems(rows);
        if (rows.length > 0) setCatalogHasProducts(true);
      } catch (e: unknown) {
        if (requestId !== requestIdRef.current) return;
        const msg = errMessage(e, "Failed to load products");
        setError(msg);
        toast.error(msg);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [],
  );

  const filterKey = [
    filters.q,
    filters.status,
    filters.category,
    filters.stock,
    filters.quality,
    filters.sort,
    String(lowStockThreshold),
  ].join("|");

  useEffect(() => {
    void fetchProducts(parseAdminProductFilters(searchParams), lowStockThreshold);
    // filterKey encodes all list-query inputs; searchParams read inside for current values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, fetchProducts]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (qInput.trim() !== filters.q) {
        setFilters({ q: qInput.trim() });
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [qInput, filters.q, setFilters]);

  const reload = () => void fetchProducts(filters, lowStockThreshold);

  const emptyKind = classifyAdminProductEmptyState({
    loading,
    error,
    resultCount: items.length,
    catalogHasProducts,
    filters,
  });
  const empty = emptyKind ? adminProductEmptyCopy(emptyKind) : null;
  const filtersActive = adminProductFiltersActive(filters);

  return (
    <div>
      <AdminPageHeader
        title="Products"
        subtitle="Search, filter, draft, publish, and merchandise catalog products."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/products?status=draft"
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
            >
              Drafts
            </Link>
            <Link
              to="/admin/products?stock=low_stock"
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
            >
              Low stock
            </Link>
            <Link
              to="/admin/catalog-quality"
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
            >
              Data quality
            </Link>
            <Link
              to="/admin/catalog-import"
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
            >
              Bulk import
            </Link>
            <Link
              to="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold"
            >
              <Plus size={16} /> Add Product
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden />
          <input
            className="w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm"
            placeholder="Search name, SKU, slug, code…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setFilters({ q: qInput.trim() });
            }}
            aria-label="Search products"
          />
        </div>
        <select
          className="rounded-xl border bg-white px-3 py-2.5 text-sm"
          value={filters.category}
          onChange={(e) => setFilters({ category: e.target.value })}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {OFFICIAL_BROWSABLE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border bg-white px-3 py-2.5 text-sm"
          value={filters.sort}
          onChange={(e) => setFilters({ sort: e.target.value as AdminProductListFilters["sort"] })}
          aria-label="Sort"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
        </select>
        {filtersActive ? (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Status">
        {(["all", "available", "sold_out", "draft", "archived"] as AdminProductStatusFilter[]).map((s) => (
          <Chip key={s} active={filters.status === s} onClick={() => setFilters({ status: s })}>
            {s.replace("_", " ")}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Stock">
        {(
          [
            ["all", "Any stock"],
            ["low_stock", "Low stock"],
            ["out_of_stock", "Out of stock"],
          ] as Array<[AdminProductStockFilter, string]>
        ).map(([id, label]) => (
          <Chip key={id} active={filters.stock === id} onClick={() => setFilters({ stock: id })}>
            {label}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Quality">
        {(
          [
            ["", "Any quality"],
            ["missing_image", "Missing image"],
            ["missing_category", "Missing category"],
          ] as Array<[AdminProductQualityFilter, string]>
        ).map(([id, label]) => (
          <Chip key={id || "any_quality"} active={filters.quality === id} onClick={() => setFilters({ quality: id })}>
            {label}
          </Chip>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading products…</p>
      ) : empty ? (
        <AdminEmpty
          message={empty.message}
          actionLabel={
            empty.actionLabel === "clear_filters"
              ? "Clear filters"
              : empty.actionLabel === "clear_search"
                ? "Clear search"
                : empty.actionLabel === "retry"
                  ? "Retry"
                  : undefined
          }
          onAction={
            empty.actionLabel === "clear_filters" || empty.actionLabel === "clear_search"
              ? clearFilters
              : empty.actionLabel === "retry"
                ? reload
                : undefined
          }
        />
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
                {items.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                        </div>
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.sku || p.product_code || p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{p.category_label || p.category || "—"}</td>
                    <td className="px-4 py-3">{formatINR(Number(p.akm_care_price ?? p.price ?? 0))}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          Number(p.stock_quantity) <= 0
                            ? "text-red-600 font-semibold"
                            : Number(p.stock_quantity) <= lowStockThreshold
                              ? "text-amber-700 font-semibold"
                              : ""
                        }
                      >
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
                            reload();
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
                            reload();
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
                            reload();
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
                            reload();
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
                            reload();
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
                            reload();
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
          <p className="px-4 py-2 text-xs text-slate-500 border-t bg-slate-50/80">
            Showing {items.length} product{items.length === 1 ? "" : "s"}
            {filtersActive ? " (filtered)" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
