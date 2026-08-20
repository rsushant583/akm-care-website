import ExcelJS from "npm:exceljs@4.4.0";
import JSZip from "npm:jszip@3.10.1";
import {
  autoMapColumns,
  planImportRows,
  sheetRowsToObjects,
  parseCsv,
  summarizeNotInFile,
  type CanonicalColumn,
  type CategoryRef,
  type ExistingProduct,
  type ImportMode,
} from "../_shared/catalogImport.ts";
import { requireAdmin, serviceClient } from "../_shared/adminAuth.ts";
import { corsHeadersFor, json } from "../_shared/http.ts";

function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (v.richText && Array.isArray(v.richText)) {
      return v.richText.map((p: { text?: string }) => p.text || "").join("");
    }
    if (v.text != null) return String(v.text);
    if (v.result != null) return String(v.result);
    if (v.hyperlink != null && v.text == null) return String(v.hyperlink);
  }
  return String(value);
}

async function workbookToGrid(buf: ArrayBuffer): Promise<string[][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const grid: string[][] = [];
  ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const arr: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      arr[col - 1] = cellText(cell.value);
    });
    grid[rowNumber - 1] = arr;
  });
  return grid;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersFor(req) });
  if (req.method !== "POST") return json(req, 405, { success: false, error: "POST required." });

  try {
    const service = serviceClient();
    const auth = await requireAdmin(req, service);
    if (!auth.ok) return auth.response;

    const body = (await req.json().catch(() => ({}))) as {
      jobId?: string;
      columnMap?: Partial<Record<CanonicalColumn, string>>;
    };
    const jobId = String(body.jobId || "").trim();
    if (!jobId) return json(req, 400, { success: false, error: "jobId is required." });

    const { data: job, error: jobError } = await service.from("catalog_import_jobs").select("*").eq("id", jobId).maybeSingle();
    if (jobError || !job) return json(req, 404, { success: false, error: "Import job not found." });
    if (!["uploaded", "parsed", "preview", "failed"].includes(String(job.status))) {
      return json(req, 409, { success: false, error: "This import cannot be re-parsed in its current status." });
    }
    if (!job.source_path) return json(req, 400, { success: false, error: "No source file uploaded." });

    const { data: sourceFile, error: dlError } = await service.storage.from("catalog-imports").download(String(job.source_path));
    if (dlError || !sourceFile) {
      return json(req, 400, { success: false, error: "Could not read the uploaded catalog file." });
    }

    const sourceType = String(job.source_type) as "xlsx" | "csv";
    let headers: string[] = [];
    let rows: Record<string, unknown>[] = [];
    if (sourceType === "csv") {
      const text = await sourceFile.text();
      const parsed = parseCsv(text);
      headers = parsed.headers;
      rows = parsed.rows;
    } else {
      const buf = await sourceFile.arrayBuffer();
      const grid = await workbookToGrid(buf);
      const parsed = sheetRowsToObjects(grid);
      headers = parsed.headers;
      rows = parsed.rows;
    }

    if (rows.length > 5000) {
      return json(req, 400, { success: false, error: "Catalog exceeds 5000 rows. Split the file and import in batches." });
    }

    let zipFilenames: string[] = [];
    if (job.images_path) {
      const { data: zipBlob, error: zipErr } = await service.storage.from("catalog-imports").download(String(job.images_path));
      if (!zipErr && zipBlob) {
        const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
        zipFilenames = Object.keys(zip.files)
          .filter((n) => !zip.files[n].dir)
          .filter((n) => !n.replace(/\\/g, "/").includes("__MACOSX/"))
          .slice(0, 8000);
      }
    }

    const { data: productRows } = await service.from("products").select("id, sku, product_code, slug, image_url");
    const existing = (productRows || []) as ExistingProduct[];
    const { data: categoryRows } = await service.from("categories").select("id, name, slug").eq("is_active", true);
    const categories = (categoryRows || []) as CategoryRef[];

    const auto = autoMapColumns(headers);
    const columnMap = { ...auto, ...(body.columnMap || job.column_map || {}) } as Partial<Record<CanonicalColumn, string>>;

    const { planned, report } = planImportRows({
      rows,
      columnMap,
      mode: String(job.mode) as ImportMode,
      existing,
      categories,
      zipFilenames,
    });

    const notInFile =
      String(job.mode) === "sync"
        ? summarizeNotInFile(
            existing.map((p) => p.sku || p.product_code || "").filter(Boolean),
            planned,
          ).slice(0, 50)
        : [];

    await service.from("catalog_import_rows").delete().eq("job_id", jobId);

    const chunk = 200;
    for (let i = 0; i < planned.length; i += chunk) {
      const slice = planned.slice(i, i + chunk).map((p) => ({
        job_id: jobId,
        row_number: p.rowNumber,
        sku: p.sku || null,
        sku_key: p.skuKey || null,
        raw: p.raw,
        normalized: p.normalized || {},
        action: p.action,
        validation_status: p.validationStatus,
        errors: p.errors,
        warnings: p.warnings,
        existing_product_id: p.existingProductId,
        commit_status: p.validationStatus === "valid" ? "pending" : "skipped",
      }));
      const { error: insErr } = await service.from("catalog_import_rows").insert(slice);
      if (insErr) throw insErr;
    }

    const { data: updated, error: upErr } = await service
      .from("catalog_import_jobs")
      .update({
        status: "preview",
        column_map: columnMap,
        rows_detected: report.rowsDetected,
        valid_count: report.validCount,
        invalid_count: report.invalidCount,
        created_count: 0,
        updated_count: 0,
        failed_count: 0,
        images_processed: 0,
        duplicate_sku_count: report.duplicateSkuCount,
        missing_image_count: report.missingImageCount,
        image_filenames: zipFilenames.slice(0, 500),
        error_summary: {
          invalidPriceCount: report.invalidPriceCount,
          invalidStockCount: report.invalidStockCount,
          invalidCategoryCount: report.invalidCategoryCount,
          createPlanned: report.createCount,
          updatePlanned: report.updateCount,
          notInFileSample: notInFile,
          headers,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select("*")
      .single();
    if (upErr) throw upErr;

    return json(req, 200, {
      success: true,
      job: updated,
      report: { ...report, notInFile },
      headers,
      columnMap,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Parse failed.";
    return json(req, 500, { success: false, error: msg });
  }
});
