import JSZip from "npm:jszip@3.10.1";
import {
  isHttpUrl,
  matchZipEntriesForSku,
  slugifyProduct,
  zipEntryBasename,
  type NormalizedProduct,
} from "../_shared/catalogImport.ts";
import { requireAdmin, serviceClient } from "../_shared/adminAuth.ts";
import { corsHeadersFor, json } from "../_shared/http.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type ImportRow = {
  id: string;
  job_id: string;
  sku: string | null;
  action: "create" | "update" | "skip";
  validation_status: string;
  commit_status: string;
  existing_product_id: string | null;
  existing_slug?: string | null;
  normalized: NormalizedProduct;
};

function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.(png|jpe?g|webp)$/);
  if (!m) return "jpg";
  return m[1] === "jpeg" ? "jpg" : m[1];
}

function contentTypeFor(ext: string): string {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

async function uniqueSlug(service: SupabaseClient, desired: string, keepId?: string | null) {
  let slug = desired || "product";
  for (let i = 0; i < 8; i++) {
    const { data } = await service.from("products").select("id").eq("slug", slug).maybeSingle();
    if (!data || (keepId && data.id === keepId)) return slug;
    slug = `${desired}-${i + 2}`.slice(0, 80);
  }
  return `${desired}-${Date.now().toString(36)}`.slice(0, 80);
}

async function defaultBrandId(service: SupabaseClient): Promise<string | null> {
  const { data } = await service.from("brands").select("id").eq("slug", "akm-care").maybeSingle();
  return data?.id ?? null;
}

async function syncInventory(service: SupabaseClient, productId: string, qty: number) {
  const { data: existing } = await service
    .from("inventory")
    .select("id")
    .eq("product_id", productId)
    .eq("warehouse_code", "DEFAULT")
    .is("variant_id", null)
    .maybeSingle();
  if (existing?.id) {
    await service.from("inventory").update({ quantity_on_hand: qty, updated_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    await service.from("inventory").insert({
      product_id: productId,
      warehouse_code: "DEFAULT",
      quantity_on_hand: qty,
      quantity_reserved: 0,
    });
  }
}

async function applyImages(
  service: SupabaseClient,
  productId: string,
  productName: string,
  slug: string,
  bytesList: { bytes: Uint8Array; filename: string }[],
) {
  if (!bytesList.length) return { urls: [] as string[], count: 0 };
  await service.from("product_images").delete().eq("product_id", productId);
  const urls: string[] = [];
  for (let i = 0; i < bytesList.length; i++) {
    const item = bytesList[i];
    const ext = extOf(item.filename);
    const storagePath = `${slug}/image-${String(i + 1).padStart(2, "0")}.${ext}`;
    const { error: upErr } = await service.storage.from("products").upload(storagePath, item.bytes, {
      contentType: contentTypeFor(ext),
      upsert: true,
      cacheControl: "31536000",
    });
    if (upErr) throw upErr;
    const { data: pub } = service.storage.from("products").getPublicUrl(storagePath);
    const url = pub.publicUrl;
    urls.push(url);
    const { error: imgErr } = await service.from("product_images").insert({
      product_id: productId,
      url,
      alt: `${productName} — view ${i + 1}`,
      storage_path: storagePath,
      sort_order: i,
      is_primary: i === 0,
    });
    if (imgErr) throw imgErr;
  }
  await service
    .from("products")
    .update({ image_url: urls[0] || null, images: urls })
    .eq("id", productId);
  return { urls, count: urls.length };
}

async function collectImageBytes(
  n: NormalizedProduct,
  zip: JSZip | null,
  zipNames: string[],
): Promise<{ bytes: Uint8Array; filename: string }[]> {
  const out: { bytes: Uint8Array; filename: string }[] = [];
  const zipHits = zip ? matchZipEntriesForSku(n.sku, zipNames) : [];
  if (zip && zipHits.length) {
    for (const path of zipHits) {
      const entry = zip.file(path);
      if (!entry) continue;
      const buf = await entry.async("uint8array");
      out.push({ bytes: buf, filename: zipEntryBasename(path) });
    }
    return out;
  }
  for (const ref of n.imageRefs) {
    if (isHttpUrl(ref)) {
      const res = await fetch(ref);
      if (!res.ok) continue;
      const mime = res.headers.get("content-type") || "";
      if (mime && !mime.startsWith("image/")) continue;
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > 10 * 1024 * 1024) continue;
      const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
      out.push({ bytes: buf, filename: `${n.sku}.${ext}` });
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersFor(req) });
  if (req.method !== "POST") return json(req, 405, { success: false, error: "POST required." });

  try {
    const service = serviceClient();
    const auth = await requireAdmin(req, service);
    if (!auth.ok) return auth.response;

    const body = (await req.json().catch(() => ({}))) as { jobId?: string };
    const jobId = String(body.jobId || "").trim();
    if (!jobId) return json(req, 400, { success: false, error: "jobId is required." });

    const { data: job, error: jobError } = await service.from("catalog_import_jobs").select("*").eq("id", jobId).maybeSingle();
    if (jobError || !job) return json(req, 404, { success: false, error: "Import job not found." });
    if (!["preview", "failed", "committing"].includes(String(job.status))) {
      return json(req, 409, { success: false, error: "Approve a parsed preview before committing." });
    }

    await service.from("catalog_import_jobs").update({ status: "committing", updated_at: new Date().toISOString() }).eq("id", jobId);

    const { data: rowData, error: rowErr } = await service
      .from("catalog_import_rows")
      .select("*")
      .eq("job_id", jobId)
      .eq("validation_status", "valid")
      .in("commit_status", ["pending", "failed"])
      .order("row_number", { ascending: true });
    if (rowErr) throw rowErr;

    const rows = (rowData || []) as ImportRow[];
    let zip: JSZip | null = null;
    let zipNames: string[] = [];
    if (job.images_path) {
      const { data: zipBlob, error: zipErr } = await service.storage.from("catalog-imports").download(String(job.images_path));
      if (!zipErr && zipBlob) {
        zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
        zipNames = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
      }
    }

    const brandId = await defaultBrandId(service);
    let created = 0;
    let updated = 0;
    let failed = 0;
    let imagesProcessed = 0;

    for (const row of rows) {
      const n = row.normalized;
      if (!n?.sku || !n.name) {
        failed += 1;
        await service
          .from("catalog_import_rows")
          .update({ commit_status: "failed", commit_error: "Row missing normalized product data." })
          .eq("id", row.id);
        continue;
      }

      try {
        const keepId = row.existing_product_id;
        const status = n.stock > 0 ? "available" : "sold_out";
        const payload: Record<string, unknown> = {
          name: n.name,
          sku: n.sku,
          product_code: n.sku,
          brand_id: brandId,
          category_id: n.categoryId,
          category: n.categorySlug || "apparel",
          category_label: n.categoryLabel,
          short_description: n.description,
          detailed_description: n.description,
          description: n.description,
          mrp: n.mrp,
          selling_price: n.sellingPrice,
          akm_care_price: n.akmCarePrice,
          price: n.akmCarePrice,
          discount_percent: n.discountPercent,
          gst_percent: n.gstPercent,
          hsn: n.hsn || null,
          dimensions: n.dimensions,
          weight: n.weight,
          stock_quantity: n.stock,
          status,
          shipping_time: n.shippingTime,
          warranty: n.warranty,
          packing_type: n.packingType,
        };

        let productId = keepId;
        let productSlug = n.slug || slugifyProduct(n.name);
        if (keepId && row.action === "update") {
          const { data: updatedRow, error } = await service
            .from("products")
            .update(payload)
            .eq("id", keepId)
            .select("id, slug")
            .single();
          if (error) throw error;
          productId = updatedRow.id;
          productSlug = updatedRow.slug || productSlug;
        } else {
          payload.slug = await uniqueSlug(service, productSlug, keepId);
          const { data: inserted, error } = await service.from("products").insert(payload).select("id, slug").single();
          if (error) {
            if (/duplicate|unique/i.test(error.message)) {
              const { data: bySku } = await service.from("products").select("id, slug").eq("sku", n.sku).maybeSingle();
              if (!bySku?.id) throw error;
              productId = bySku.id;
              productSlug = bySku.slug || productSlug;
              const { slug: _s, ...rest } = payload;
              const { error: u2 } = await service.from("products").update(rest).eq("id", bySku.id);
              if (u2) throw u2;
            } else {
              throw error;
            }
          } else {
            productId = inserted.id;
            productSlug = inserted.slug || String(payload.slug);
          }
        }

        if (!productId) throw new Error("Product upsert did not return an id.");

        const imageBytes = await collectImageBytes(n, zip, zipNames);
        if (imageBytes.length) {
          const applied = await applyImages(service, productId, n.name, productSlug, imageBytes);
          imagesProcessed += applied.count;
        }

        await syncInventory(service, productId, n.stock);

        if (!keepId) {
          const { data: variant } = await service.from("product_variants").select("id").eq("product_id", productId).limit(1).maybeSingle();
          if (!variant) {
            await service.from("product_variants").insert({
              product_id: productId,
              name: "Standard",
              stock: n.stock,
              sort_order: 0,
            });
          }
        }

        await service
          .from("catalog_import_rows")
          .update({ commit_status: "committed", product_id: productId, commit_error: null })
          .eq("id", row.id);

        if (keepId && row.action === "update") updated += 1;
        else created += 1;
      } catch (err) {
        failed += 1;
        const msg = err instanceof Error ? err.message : "Commit failed for this row.";
        await service.from("catalog_import_rows").update({ commit_status: "failed", commit_error: msg }).eq("id", row.id);
      }
    }

    const { data: remaining } = await service
      .from("catalog_import_rows")
      .select("id")
      .eq("job_id", jobId)
      .eq("validation_status", "valid")
      .eq("commit_status", "pending");

    const done = !remaining?.length;
    const { data: updatedJob } = await service
      .from("catalog_import_jobs")
      .update({
        status: failed && done ? "completed" : done ? "completed" : "failed",
        created_count: created,
        updated_count: updated,
        failed_count: failed,
        images_processed: imagesProcessed,
        completed_at: done ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select("*")
      .single();

    return json(req, 200, {
      success: true,
      job: updatedJob,
      created,
      updated,
      failed,
      imagesProcessed,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Commit failed.";
    return json(req, 500, { success: false, error: msg });
  }
});
