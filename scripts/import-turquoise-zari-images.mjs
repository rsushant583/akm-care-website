/**
 * Upload turquoise zari catalog images to Supabase Storage and point product URLs at CDN.
 *
 * Usage:
 *   node --env-file=.env scripts/import-turquoise-zari-images.mjs
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

const SLUG = "akmc-turquoise-zari";
const PRODUCT_ID = "d0000000-0000-4000-8000-000000000006";
const PRODUCT_NAME = "AKMC Turquoise Zari Silk Saree";

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
img.save(r"""${destPath.replace(/\\/g, "\\\\")}""", "WEBP", quality=90, method=6)
print("ok")
`;
  const result = spawnSync("python", ["-c", py], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "WebP conversion failed");
  }
}

async function main() {
  if (!url) throw new Error("Missing VITE_SUPABASE_URL / SUPABASE_URL");
  const key = resolveServiceKey();
  if (!key) throw new Error("Missing service role key");

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const localDir = path.join(root, "public", "catalog", SLUG);
  const workDir = path.join(root, "tmp", SLUG);
  fs.mkdirSync(workDir, { recursive: true });

  const files = fs
    .readdirSync(localDir)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();
  if (files.length === 0) throw new Error(`No images in ${localDir}`);

  const uploaded = [];
  for (let i = 0; i < files.length; i++) {
    const src = path.join(localDir, files[i]);
    const fileName = `image-${String(i + 1).padStart(2, "0")}.webp`;
    const dest = path.join(workDir, fileName);
    console.log(`Converting ${i + 1}/${files.length} → ${fileName}`);
    convertToWebp(src, dest);

    const storagePath = `${SLUG}/${fileName}`;
    const bytes = fs.readFileSync(dest);
    const { error: upErr } = await supabase.storage.from("products").upload(storagePath, bytes, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "31536000",
    });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("products").getPublicUrl(storagePath);
    uploaded.push({
      url: pub.publicUrl,
      storage_path: storagePath,
      sort_order: i,
      is_primary: i === 0,
      alt: `${PRODUCT_NAME} — view ${i + 1}`,
    });
    console.log(`  uploaded ${storagePath}`);
  }

  const { error: prodErr } = await supabase
    .from("products")
    .update({ image_url: uploaded[0].url, updated_at: new Date().toISOString() })
    .eq("id", PRODUCT_ID);
  if (prodErr) throw prodErr;

  await supabase.from("product_images").delete().eq("product_id", PRODUCT_ID);
  const { error: imgErr } = await supabase.from("product_images").insert(
    uploaded.map((img) => ({
      product_id: PRODUCT_ID,
      url: img.url,
      alt: img.alt,
      storage_path: img.storage_path,
      sort_order: img.sort_order,
      is_primary: img.is_primary,
    })),
  );
  if (imgErr) throw imgErr;

  const heads = [];
  for (const img of uploaded) {
    const res = await fetch(img.url, { method: "HEAD" });
    heads.push({ path: img.storage_path, status: res.status, ok: res.ok });
  }

  console.log(
    JSON.stringify(
      {
        productId: PRODUCT_ID,
        imagesImported: uploaded.length,
        cover: uploaded[0].url,
        urlChecks: heads,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
