import { getSupabaseClient } from "@/lib/supabaseClient";
import type { CanonicalColumn, ImportMode } from "@/lib/catalogImport/engine";

export type CatalogImportJob = {
  id: string;
  created_by: string;
  source_filename: string | null;
  images_filename: string | null;
  source_path: string | null;
  images_path: string | null;
  source_type: "xlsx" | "csv";
  mode: ImportMode;
  status: string;
  column_map: Partial<Record<CanonicalColumn, string>>;
  rows_detected: number;
  valid_count: number;
  invalid_count: number;
  created_count: number;
  updated_count: number;
  failed_count: number;
  images_processed: number;
  duplicate_sku_count: number;
  missing_image_count: number;
  error_summary: Record<string, unknown>;
  image_filenames: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type CatalogImportRow = {
  id: string;
  job_id: string;
  row_number: number;
  sku: string | null;
  action: string | null;
  validation_status: string;
  errors: string[];
  warnings: string[];
  existing_product_id: string | null;
  product_id: string | null;
  commit_status: string;
  commit_error: string | null;
  normalized: Record<string, unknown>;
};

async function requireSessionClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const { data } = await client.auth.getSession();
  if (!data.session) throw new Error("Sign in at /admin/login before importing.");
  return { client, accessToken: data.session.access_token };
}

export async function listImportJobs() {
  const { client } = await requireSessionClient();
  const { data, error } = await client
    .from("catalog_import_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []) as CatalogImportJob[];
}

export async function getImportJob(id: string) {
  const { client } = await requireSessionClient();
  const { data, error } = await client.from("catalog_import_jobs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as CatalogImportJob | null;
}

export async function listImportRows(jobId: string, opts?: { invalidOnly?: boolean }) {
  const { client } = await requireSessionClient();
  let q = client.from("catalog_import_rows").select("*").eq("job_id", jobId).order("row_number", { ascending: true }).limit(1000);
  if (opts?.invalidOnly) q = q.eq("validation_status", "invalid");
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as CatalogImportRow[];
}

export async function createImportJob(input: { mode: ImportMode; sourceType: "xlsx" | "csv" }) {
  const { client } = await requireSessionClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) throw new Error("Sign in required.");
  const { data, error } = await client
    .from("catalog_import_jobs")
    .insert({
      created_by: userData.user.id,
      mode: input.mode,
      source_type: input.sourceType,
      status: "uploaded",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CatalogImportJob;
}

export async function uploadImportSource(jobId: string, file: File, kind: "source" | "images") {
  const { client } = await requireSessionClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${jobId}/${kind}.${ext}`;
  const { error } = await client.storage.from("catalog-imports").upload(path, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  const patch =
    kind === "source"
      ? { source_filename: file.name, source_path: path, updated_at: new Date().toISOString() }
      : { images_filename: file.name, images_path: path, updated_at: new Date().toISOString() };
  const { data, error: uErr } = await client.from("catalog_import_jobs").update(patch).eq("id", jobId).select("*").single();
  if (uErr) throw uErr;
  return data as CatalogImportJob;
}

async function invokeImportFunction(name: "catalog-import-parse" | "catalog-import-commit", body: Record<string, unknown>) {
  const { accessToken } = await requireSessionClient();
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Supabase not configured");
  const response = await fetch(`${url}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: anon,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({ success: false, error: "Unexpected server response." }));
  if (!response.ok) {
    throw new Error(data.error || `Import ${name} failed (${response.status}).`);
  }
  return data;
}

export async function parseImportJob(jobId: string, columnMap?: Partial<Record<CanonicalColumn, string>>) {
  return invokeImportFunction("catalog-import-parse", { jobId, columnMap });
}

export async function commitImportJob(jobId: string) {
  return invokeImportFunction("catalog-import-commit", { jobId });
}
