import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader, Chip } from "@/components/admin/AdminUI";
import { listAdminProducts, type AdminProduct } from "@/services/adminCatalogService";
import { summarizeQuality, type QualityIssueCode } from "@/lib/admin/productDataQuality";
import { loadCatalogSettings } from "@/lib/admin/catalogSettings";

type FilterId = "all" | QualityIssueCode;

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "needs_information", label: "Needs information" },
  { id: "missing_image", label: "Missing image" },
  { id: "missing_category", label: "Missing category" },
  { id: "legacy_apparel", label: "Legacy category" },
  { id: "missing_title_attrs", label: "Missing attributes" },
  { id: "missing_care", label: "Missing care" },
  { id: "code_like_name", label: "Code-like names" },
  { id: "low_stock", label: "Low stock" },
  { id: "out_of_stock", label: "Out of stock" },
  { id: "ambiguous_semi_stitched", label: "SEMI-STICHED" },
  { id: "all", label: "All flagged" },
];

export default function AdminProductQualityPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>("needs_information");
  const [lowStock, setLowStock] = useState(5);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const settings = await loadCatalogSettings();
        setLowStock(settings.low_stock_threshold);
        setProducts(await listAdminProducts({ status: "all", limit: 1000, sort: "newest" }));
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to load catalog");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summary = useMemo(() => summarizeQuality(products, lowStock), [products, lowStock]);

  const rows = useMemo(() => {
    const flagged = summary.rows.filter((r) => r.issues.length > 0);
    if (filter === "all") return flagged;
    return flagged.filter((r) => r.issues.some((i) => i.code === filter));
  }, [summary, filter]);

  return (
    <div>
      <AdminPageHeader
        title="Catalog data quality"
        subtitle="Flags issues for manual fix in Admin. Nothing is rewritten automatically."
        actions={
          <Link to="/admin/products" className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">
            Products
          </Link>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {(
          [
            ["Needs information", summary.counts.needs_information],
            ["Missing image", summary.counts.missing_image],
            ["Missing category", summary.counts.missing_category],
            ["Legacy apparel", summary.counts.legacy_apparel],
            ["Missing attributes", summary.counts.missing_title_attrs],
            ["Low stock", summary.counts.low_stock],
            ["Out of stock", summary.counts.out_of_stock],
            ["Code-like names", summary.counts.code_like_name],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="rounded-2xl border bg-white p-4">
            <p className="text-xs uppercase text-slate-500">{label}</p>
            <p className="text-2xl font-bold mt-1">{n}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Scanning catalog…</p>
      ) : !rows.length ? (
        <AdminEmpty message="No issues matched this filter." />
      ) : (
        <div className="rounded-2xl border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Issues</th>
                  <th className="px-4 py-3 text-right">Fix</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ product, issues }) => (
                  <tr key={product.id} className="border-t">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.sku || product.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {issues
                          .filter((issue) => issue.code !== "needs_information")
                          .map((issue) => (
                          <span
                            key={issue.code}
                            className={
                              issue.severity === "error"
                                ? "text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800"
                                : issue.severity === "warn"
                                  ? "text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900"
                                  : "text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700"
                            }
                          >
                            {issue.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/products/${product.id}`} className="text-orange-600 font-semibold text-sm">
                        Open
                      </Link>
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
