/**
 * Upsert product serial 5 — AKM RFX - MCMD — with client-provided images.
 * Idempotent by canonical id / slug. Never creates a second product row.
 *
 * Usage:
 *   node --env-file=.env scripts/import-rfx-mcmd-images.mjs
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
const assetsDir = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  ".cursor",
  "projects",
  "c-Users-HP-Downloads-akm-omni-platform-main",
  "assets",
);

const SOURCE_FILES = [
  "c__Users_HP_AppData_Roaming_Cursor_User_workspaceStorage_accbbb077229251b7743295347048714_images_WhatsApp_Image_2026-07-31_at_2.39.44_PM-150471d3-5313-4d7d-8fad-6af111ed71b8.png",
  "c__Users_HP_AppData_Roaming_Cursor_User_workspaceStorage_accbbb077229251b7743295347048714_images_WhatsApp_Image_2026-07-31_at_2.39.44_PM__1_-6482d9c8-cc2c-4ebf-9cf5-4206ebac6512.png",
];

const SLUG = "akm-rfx-mcmd";
const FOLDER = SLUG;
const CANONICAL_ID = "d0000000-0000-4000-8000-000000000005";
const PRODUCT_CODE = "AKM RFX - MCMD";

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

  const { data: bySlug } = await supabase.from("products").select("id, name, slug").eq("slug", SLUG).maybeSingle();
  const { data: byId } = await supabase.from("products").select("id, name, slug").eq("id", CANONICAL_ID).maybeSingle();
  const { data: byCode } = await supabase
    .from("products")
    .select("id, name, slug")
    .or(`product_code.eq.${PRODUCT_CODE},sku.eq.${PRODUCT_CODE},name.ilike.%RFX - MCMD%,name.ilike.%RFX-MCMD%`)
    .limit(5);

  const matches = [bySlug, byId, ...(byCode || [])].filter(Boolean);
  const uniqueIds = [...new Set(matches.map((m) => m.id))];
  if (uniqueIds.length > 1) {
    console.error("Multiple RFX-MCMD product rows found — refusing to create/update duplicates:", uniqueIds);
    process.exit(2);
  }

  const productId = uniqueIds[0] || CANONICAL_ID;
  const isUpdate = uniqueIds.length === 1;
  console.log(
    isUpdate
      ? `Updating existing product ${productId}`
      : `Creating serial-5 product ${productId} (was missing from catalog)`,
  );

  const { data: brand } = await supabase.from("brands").select("id").eq("slug", "akm-care").maybeSingle();
  const { data: category } = await supabase.from("categories").select("id").eq("slug", "sarees").maybeSingle();
  const { data: subcategory } = await supabase
    .from("subcategories")
    .select("id")
    .eq("slug", "chanderi-print")
    .maybeSingle();

  const workDir = path.join(root, "tmp", SLUG);
  fs.mkdirSync(workDir, { recursive: true });

  const uploaded = [];
  for (let i = 0; i < SOURCE_FILES.length; i++) {
    const src = path.join(assetsDir, SOURCE_FILES[i]);
    if (!fs.existsSync(src)) throw new Error(`Missing source image: ${src}`);
    const fileName = `image-${String(i + 1).padStart(2, "0")}.webp`;
    const dest = path.join(workDir, fileName);
    console.log(`Converting ${i + 1}/${SOURCE_FILES.length} → ${fileName}`);
    convertToWebp(src, dest);

    const storagePath = `${FOLDER}/${fileName}`;
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
      alt: `${PRODUCT_CODE} — view ${i + 1}`,
    });
    console.log(`  uploaded ${storagePath}`);
  }

  const productPayload = {
    id: productId,
    name: PRODUCT_CODE,
    slug: SLUG,
    sku: PRODUCT_CODE,
    product_code: PRODUCT_CODE,
    brand_id: brand?.id || null,
    category_id: category?.id || null,
    subcategory_id: subcategory?.id || null,
    short_description: "Silk Top Dyed Weaving Saree with Unstitched Blouse",
    detailed_description:
      "Silk Top Dyed Weaving Saree with Unstitched Blouse. Approx. 6 metres, silk top dyed weaving. Sourced for AKM Care — Trusted & Fair apparel.",
    description: "Silk Top Dyed Weaving Saree with Unstitched Blouse",
    mrp: 3959.3,
    selling_price: 3959.3,
    akm_care_price: 3572,
    price: 3572,
    discount_percent: 9.78,
    gst_percent: 18,
    gst_number: "24AIFPB2688G1ZG",
    hsn: "540752",
    dimensions: "6 Mtrs APX",
    stock_quantity: 1,
    status: "available",
    shipping_time: "Within 24 Hours",
    warranty: "NA — 7 Days Return Policy",
    packing_type: "Box Packing",
    category: "sarees",
    category_label: "Sarees",
    tags: ["Silk Top Dyed Weaving", "Ethnic Wear", "Saree", "Apparel", "AKM Care"],
    image_url: uploaded[0].url,
    images: uploaded.map((u) => ({ src: u.url, alt: u.alt })),
    seo_title: "AKM RFX - MCMD | Silk Top Dyed Weaving Saree | AKM Care",
    seo_description: "Buy AKM RFX - MCMD silk top dyed weaving saree with unstitched blouse. AKM Care price ₹3572.",
    specifications: {
      variant: "Silk Top Dyed Weaving",
      packing: "Box Packing",
      blouse: "Unstitched",
      colours: 1,
      size: "6 Mtrs APX",
      serial: 5,
    },
    display_order: 5,
    is_featured: true,
    is_new_arrival: true,
    is_trending: true,
    popularity: 86,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertErr } = await supabase.from("products").upsert(productPayload, { onConflict: "id" });
  if (upsertErr) throw upsertErr;

  await supabase.from("product_images").delete().eq("product_id", productId);
  const { error: imgErr } = await supabase.from("product_images").insert(
    uploaded.map((img) => ({
      product_id: productId,
      url: img.url,
      alt: img.alt,
      storage_path: img.storage_path,
      sort_order: img.sort_order,
      is_primary: img.is_primary,
    })),
  );
  if (imgErr) throw imgErr;

  await supabase.from("product_variants").delete().eq("product_id", productId);
  await supabase.from("product_variants").insert({
    product_id: productId,
    name: "Silk Top Dyed Weaving",
    stock: 1,
    sort_order: 0,
  });

  await supabase.from("product_colors").delete().eq("product_id", productId);
  await supabase.from("product_colors").insert([
    { product_id: productId, name: "Teal Blue", hex: "#1E7A8A", slug: "teal-blue", image_indexes: [0, 1], sort_order: 0 },
  ]);

  await supabase.from("featured_products").upsert(
    { product_id: productId, slot: "shop", display_order: 5, is_active: true },
    { onConflict: "product_id,slot" },
  );

  const siblingIds = [
    "d0000000-0000-4000-8000-000000000001",
    "d0000000-0000-4000-8000-000000000002",
    "d0000000-0000-4000-8000-000000000003",
    "d0000000-0000-4000-8000-000000000004",
  ];
  await supabase.from("related_products").delete().eq("product_id", productId);
  await supabase.from("related_products").insert(
    siblingIds.map((rid, i) => ({
      product_id: productId,
      related_product_id: rid,
      relation_type: "related",
      display_order: i + 1,
    })),
  );

  const { data: verifyImgs } = await supabase
    .from("product_images")
    .select("url, sort_order, is_primary, storage_path")
    .eq("product_id", productId)
    .order("sort_order");

  const heads = [];
  for (const img of uploaded) {
    const res = await fetch(img.url, { method: "HEAD" });
    heads.push({ path: img.storage_path, status: res.status, ok: res.ok });
  }

  console.log("\nDONE");
  console.log(
    JSON.stringify(
      {
        mode: isUpdate ? "update" : "create-serial-5",
        productId,
        imagesImported: uploaded.length,
        storageFolder: FOLDER,
        cover: uploaded[0].url,
        urlChecks: heads,
        records: verifyImgs,
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
