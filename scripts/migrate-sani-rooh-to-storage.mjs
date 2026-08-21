/**
 * Migrate SANI + ROOH product images from local public/catalog to Supabase Storage.
 *
 * Safety:
 * - Does NOT change product ids / slugs / skus / prices / stock.
 * - Does NOT delete local public/catalog files (keep until verified).
 * - Uploads WebP masters to products/{slug}/image-NN.webp
 * - Updates products.image_url + product_images URLs only.
 *
 * Usage:
 *   node --env-file=.env scripts/migrate-sani-rooh-to-storage.mjs
 *   node --env-file=.env scripts/migrate-sani-rooh-to-storage.mjs --dry-run
 */
import { createClient } from "@supabase/supabase-js";
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const projectRef = process.env.SUPABASE_PROJECT_REF || "tdqepnmysycxklqcvpai";
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dryRun = process.argv.includes("--dry-run");

/** Exact local masters → Storage objects (verified on disk before run). */
const PRODUCTS = [
  {
    id: "d0000000-0000-4000-8000-000000000001",
    slug: "akmc-sani-1007",
    name: "AKMC SANI - 1007",
    localDir: path.join(root, "public", "catalog", "akmc-sani-1007"),
    files: ["01.png", "02.png", "03.png", "04.png", "05.png", "06.png", "07.png"],
  },
  {
    id: "d0000000-0000-4000-8000-000000000002",
    slug: "akmc-rooh-0002",
    name: "AKMC ROOH - 0002",
    localDir: path.join(root, "public", "catalog", "akmc-rooh-0002"),
    files: ["01.png", "02.png", "03.png", "04.png", "05.png", "06.png", "07.png", "08.png"],
  },
];

function resolveServiceKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  const raw = execSync(`npx --yes supabase@latest projects api-keys --project-ref ${projectRef}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const parsed = JSON.parse(raw);
  const list = Array.isArray(parsed.keys) ? parsed.keys : Array.isArray(parsed) ? parsed : [];
  const legacy = list.find((k) => k.id === "service_role");
  return legacy?.api_key || null;
}

function convertToWebp(srcPath, destPath) {
  const py = `
from PIL import Image
img = Image.open(r"""${srcPath.replace(/\\/g, "\\\\")}""")
if img.mode in ("RGBA", "P"):
    img = img.convert("RGB")
# Quality 90 — fashion masters; do not crush textile detail.
img.save(r"""${destPath.replace(/\\/g, "\\\\")}""", "WEBP", quality=90, method=6)
print("ok")
`;
  const result = spawnSync("python", ["-c", py], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "WebP conversion failed");
  }
}

async function migrateOne(supabase, product) {
  for (const file of product.files) {
    const src = path.join(product.localDir, file);
    if (!fs.existsSync(src)) throw new Error(`Missing local master: ${src}`);
  }

  const workDir = path.join(root, "tmp", "migrate", product.slug);
  fs.mkdirSync(workDir, { recursive: true });

  const uploaded = [];
  for (let i = 0; i < product.files.length; i++) {
    const src = path.join(product.localDir, product.files[i]);
    const fileName = `image-${String(i + 1).padStart(2, "0")}.webp`;
    const dest = path.join(workDir, fileName);
    console.log(`[${product.slug}] ${product.files[i]} → ${fileName}`);
    convertToWebp(src, dest);

    const storagePath = `${product.slug}/${fileName}`;
    if (dryRun) {
      console.log(`  dry-run skip upload ${storagePath}`);
    } else {
      const bytes = fs.readFileSync(dest);
      const { error: upErr } = await supabase.storage.from("products").upload(storagePath, bytes, {
        contentType: "image/webp",
        upsert: true,
        // Path is content-versioned by filename (image-01.webp); re-upload replaces object.
        // Prefer re-upload over query-string busting when masters change.
        cacheControl: "31536000",
      });
      if (upErr) throw upErr;
    }

    const { data: pub } = supabase.storage.from("products").getPublicUrl(storagePath);
    uploaded.push({
      url: pub.publicUrl,
      storage_path: storagePath,
      sort_order: i,
      is_primary: i === 0,
      alt: `${product.name} — view ${i + 1}`,
    });
  }

  if (dryRun) {
    console.log(`[${product.slug}] dry-run would update image_url → ${uploaded[0].url}`);
    return uploaded;
  }

  const { error: prodErr } = await supabase
    .from("products")
    .update({ image_url: uploaded[0].url, updated_at: new Date().toISOString() })
    .eq("id", product.id);
  if (prodErr) throw prodErr;

  await supabase.from("product_images").delete().eq("product_id", product.id);
  const { error: imgErr } = await supabase.from("product_images").insert(
    uploaded.map((img) => ({
      product_id: product.id,
      url: img.url,
      alt: img.alt,
      storage_path: img.storage_path,
      sort_order: img.sort_order,
      is_primary: img.is_primary,
    })),
  );
  if (imgErr) throw imgErr;

  for (const img of uploaded) {
    const res = await fetch(img.url, { method: "HEAD" });
    console.log(`  HEAD ${img.storage_path} → ${res.status} cache=${res.headers.get("cache-control")}`);
  }

  return uploaded;
}

async function main() {
  if (!url) throw new Error("Missing VITE_SUPABASE_URL / SUPABASE_URL");
  const key = resolveServiceKey();
  if (!key) throw new Error("Missing service role key");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const summary = [];
  for (const product of PRODUCTS) {
    const uploaded = await migrateOne(supabase, product);
    summary.push({
      slug: product.slug,
      id: product.id,
      images: uploaded.length,
      cover: uploaded[0]?.url,
      localKept: product.localDir,
    });
  }

  console.log(JSON.stringify({ dryRun, summary }, null, 2));
  console.log("\nLocal public/catalog files were NOT deleted. Verify storefront, then remove later if desired.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
