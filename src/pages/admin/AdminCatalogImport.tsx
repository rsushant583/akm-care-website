import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/AdminUI";
import type { ImportMode } from "@/lib/catalogImport/engine";
import {
  createImportJob,
  listImportJobs,
  parseImportJob,
  uploadImportSource,
  type CatalogImportJob,
} from "@/services/adminCatalogImportService";

function sourceTypeFromName(name: string): "xlsx" | "csv" | null {
  const n = name.toLowerCase();
  if (n.endsWith(".xlsx")) return "xlsx";
  if (n.endsWith(".csv")) return "csv";
  return null;
}

export default function AdminCatalogImportPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<CatalogImportJob[]>([]);
  const [mode, setMode] = useState<ImportMode>("sync");
  const [source, setSource] = useState<File | null>(null);
  const [zip, setZip] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setJobs(await listImportJobs());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not load import history.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!source) return toast.error("Upload an .xlsx or .csv file.");
    const sourceType = sourceTypeFromName(source.name);
    if (!sourceType) return toast.error("Only .xlsx and .csv are supported in v1.");
    if (zip && !zip.name.toLowerCase().endsWith(".zip")) return toast.error("Images must be a .zip file.");
    setBusy(true);
    try {
      const job = await createImportJob({ mode, sourceType });
      await uploadImportSource(job.id, source, "source");
      if (zip) await uploadImportSource(job.id, zip, "images");
      await parseImportJob(job.id);
      toast.success("Catalog parsed. Review the preview before publishing.");
      navigate(`/admin/catalog-import/${job.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Import parse failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Bulk catalog import"
        subtitle="Upload Excel or CSV, optionally a ZIP of images, then preview and approve. Nothing is published until you confirm."
      />

      <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-5 space-y-4 mb-8">
        <h2 className="font-semibold">New import</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm">
            <span className="font-medium">Mode</span>
            <select className="mt-1 w-full rounded-xl border px-3 py-2.5" value={mode} onChange={(e) => setMode(e.target.value as ImportMode)}>
              <option value="add_new">Add new SKUs only</option>
              <option value="update_existing">Update existing SKUs only</option>
              <option value="sync">Sync (create + update, never delete)</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium">Catalog file (.xlsx / .csv)</span>
            <input
              className="mt-1 w-full text-sm"
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onChange={(e) => setSource(e.target.files?.[0] || null)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Product images (.zip, optional)</span>
            <input
              className="mt-1 w-full text-sm"
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => setZip(e.target.files?.[0] || null)}
            />
          </label>
        </div>
        <p className="text-xs text-slate-500">
          Identity is SKU. Example columns: SKU, Product Name, Category, Price, Stock, Image. Images stay in Supabase Storage — never in the website bundle.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {busy ? "Uploading & parsing…" : "Upload and preview"}
        </button>
      </form>

      <h2 className="font-semibold mb-3">Import history</h2>
      {!jobs.length ? (
        <AdminEmpty message="No imports yet." />
      ) : (
        <div className="rounded-2xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Rows</th>
                <th className="px-4 py-3">Created / updated / failed</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link className="font-medium text-orange-600 hover:underline" to={`/admin/catalog-import/${j.id}`}>
                      {j.source_filename || j.id.slice(0, 8)}
                    </Link>
                    {j.images_filename ? <div className="text-xs text-slate-500">{j.images_filename}</div> : null}
                  </td>
                  <td className="px-4 py-3">{j.mode}</td>
                  <td className="px-4 py-3 capitalize">{j.status}</td>
                  <td className="px-4 py-3">
                    {j.rows_detected} · {j.valid_count} valid · {j.invalid_count} invalid
                  </td>
                  <td className="px-4 py-3">
                    {j.created_count} / {j.updated_count} / {j.failed_count}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(j.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
