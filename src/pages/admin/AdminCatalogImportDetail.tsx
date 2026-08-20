import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { AdminPageHeader, Chip } from "@/components/admin/AdminUI";
import { CANONICAL_COLUMNS, type CanonicalColumn } from "@/lib/catalogImport/engine";
import {
  commitImportJob,
  getImportJob,
  listImportRows,
  parseImportJob,
  type CatalogImportJob,
  type CatalogImportRow,
} from "@/services/adminCatalogImportService";

export default function AdminCatalogImportDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<CatalogImportJob | null>(null);
  const [rows, setRows] = useState<CatalogImportRow[]>([]);
  const [filter, setFilter] = useState<"all" | "invalid" | "valid">("all");
  const [busy, setBusy] = useState(false);
  const [map, setMap] = useState<Partial<Record<CanonicalColumn, string>>>({});

  const load = async () => {
    if (!id) return;
    const j = await getImportJob(id);
    setJob(j);
    if (j?.column_map) setMap(j.column_map);
    setRows(await listImportRows(id));
  };

  useEffect(() => {
    void load().catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to load import."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const headers = useMemo(() => {
    const fromSummary = job?.error_summary?.headers;
    return Array.isArray(fromSummary) ? (fromSummary as string[]) : [];
  }, [job]);

  const filtered = rows.filter((r) => {
    if (filter === "invalid") return r.validation_status === "invalid";
    if (filter === "valid") return r.validation_status === "valid";
    return true;
  });

  const remap = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await parseImportJob(id, map);
      await load();
      toast.success("Preview refreshed.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Re-parse failed.");
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    if (!id || !job) return;
    if (!job.valid_count) return toast.error("No valid rows to publish.");
    if (!window.confirm(`Publish ${job.valid_count} valid row(s)? Invalid rows will be skipped.`)) return;
    setBusy(true);
    try {
      await commitImportJob(id);
      await load();
      toast.success("Import committed. Valid products are now in the catalog.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Commit failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!job) return <p className="text-sm text-slate-500">Loading import…</p>;

  const summary = job.error_summary || {};

  return (
    <div>
      <AdminPageHeader
        title={job.source_filename || "Import"}
        subtitle={`${job.mode} · ${job.status} · ${new Date(job.created_at).toLocaleString()}`}
        actions={
          <Link to="/admin/catalog-import" className="text-sm font-semibold text-slate-600 hover:underline">
            Back to imports
          </Link>
        }
      />

      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        {[
          ["Rows", job.rows_detected],
          ["Valid", job.valid_count],
          ["Invalid", job.invalid_count],
          ["Duplicate SKUs", job.duplicate_sku_count],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border bg-white p-4">
            <div className="text-xs uppercase text-slate-500">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-5 mb-6 text-sm space-y-1">
        <p>Planned creates: {String(summary.createPlanned ?? "—")} · Planned updates: {String(summary.updatePlanned ?? "—")}</p>
        <p>Missing images: {job.missing_image_count} · Invalid prices: {String(summary.invalidPriceCount ?? 0)} · Invalid stock: {String(summary.invalidStockCount ?? 0)} · Invalid categories: {String(summary.invalidCategoryCount ?? 0)}</p>
        <p>Images ZIP: {job.images_filename || "none"} · Images processed: {job.images_processed}</p>
        <p>Created: {job.created_count} · Updated: {job.updated_count} · Failed: {job.failed_count}</p>
        {Array.isArray(summary.notInFileSample) && (summary.notInFileSample as string[]).length > 0 ? (
          <p className="text-slate-600">In store, not in file (not deleted): {(summary.notInFileSample as string[]).join(", ")}</p>
        ) : null}
      </div>

      {headers.length > 0 && job.status === "preview" ? (
        <section className="rounded-2xl border bg-white p-5 mb-6 space-y-3">
          <h2 className="font-semibold">Column mapping</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CANONICAL_COLUMNS.map((col) => (
              <label key={col} className="text-sm">
                <span className="font-medium">{col}</span>
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={map[col] || ""}
                  onChange={(e) => setMap((m) => ({ ...m, [col]: e.target.value || undefined }))}
                >
                  <option value="">—</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <button type="button" disabled={busy} onClick={() => void remap()} className="rounded-xl border px-4 py-2 text-sm font-semibold">
            Re-parse with this mapping
          </button>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "valid", "invalid"] as const).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f}
          </Chip>
        ))}
        {job.status === "preview" || job.status === "failed" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void commit()}
            className="ml-auto rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {busy ? "Publishing…" : `Approve & publish ${job.valid_count} valid rows`}
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Commit</th>
              <th className="px-3 py-2">Issues</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="px-3 py-2">{r.row_number}</td>
                <td className="px-3 py-2">
                  {r.product_id ? (
                    <Link className="text-orange-600 hover:underline" to={`/admin/products/${r.product_id}`}>
                      {r.sku}
                    </Link>
                  ) : (
                    r.sku || "—"
                  )}
                </td>
                <td className="px-3 py-2">{r.action}</td>
                <td className="px-3 py-2">{r.validation_status}</td>
                <td className="px-3 py-2">{r.commit_status}{r.commit_error ? ` · ${r.commit_error}` : ""}</td>
                <td className="px-3 py-2 text-xs text-rose-700">
                  {(r.errors || []).join(", ")}
                  {(r.warnings || []).length ? <div className="text-amber-700">{(r.warnings || []).join(", ")}</div> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
