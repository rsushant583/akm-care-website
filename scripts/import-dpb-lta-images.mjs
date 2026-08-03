/**
 * Update existing product AKMC DPB - LTA with client-provided images.
 * Does NOT insert a new product. Fails if the product cannot be found.
 *
 * Usage:
 *   node --env-file=.env scripts/import-dpb-lta-images.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

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
  "c__Users_HP_AppData_Roaming_Cursor_User_workspaceStorage_accbbb077229251b7743295347048714_images_WhatsApp_Image_2026-07-31_at_2.38.20_PM__2_-ee51608d-1eee-475b-a338-969ed70185de.png",
  "c__Users_HP_AppData_Roaming_Cursor_User_workspaceStorage_accbbb077229251b7743295347048714_images_WhatsApp_Image_2026-07-31_at_2.38.20_PM__1_-2d85583e-f9c7-4530-951c-ed0fbec1bf08.png",
  "c__Users_HP_AppData_Roaming_Cursor_User_workspaceStorage_accbbb077229251b7743295347048714_images_WhatsApp_Image_2026-07-31_at_2.38.20_PM__3_-ad6c1c62-bfa3-41e6-8d28-bb67e59c5577.png",
  "c__Users_HP_AppData_Roaming_Cursor_User_workspaceStorage_accbbb077229251b7743295347048714_images_WhatsApp_Image_2026-07-31_at_2.38.20_PM__6_-aa27743d-dd37-46ed-8d1a-0a086b987d42.png",
  "c__Users_HP_AppData_Roaming_Cursor_User_workspaceStorage_accbbb077229251b7743295347048714_images_WhatsApp_Image_2026-07-31_at_2.38.20_PM-c2ee3bb5-8c49-4198-8d65-50f1c45d76fa.png",
  "c__Users_HP_AppData_Roaming_Cursor_User_workspaceStorage_accbbb077229251b7743295347048714_images_WhatsApp_Image_2026-07-31_at_2.38.20_PM__4_-8f99dc72-f970-4a49-a00a-d947a66e07a4.png",
  "c__Users_HP_AppData_Roaming_Cursor_User_workspaceStorage_accbbb077229251b7743295347048714_images_WhatsApp_Image_2026-07-31_at_2.38.20_PM__5_-b0a42e67-fb0a-4e0b-b2b7-671328ae0673.png",
];

const SLUG = "akmc-dpb-lta";
// Inside bucket `products` — path is akmc-dpb-lta/... (not products/akmc-dpb-lta/...)
const FOLDER = SLUG;

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
import sys
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

  // Canonical serial-3 id (matches seed pattern for SANI/ROOH). Upsert by id/slug — never create a second row.
  const CANONICAL_ID = "d0000000-0000-4000-8000-000000000003";

  const { data: bySlug } = await supabase.from("products").select("id, name, slug").eq("slug", SLUG).maybeSingle();
  const { data: byId } = await supabase.from("products").select("id, name, slug").eq("id", CANONICAL_ID).maybeSingle();
  const { data: byCode } = await supabase
    .from("products")
    .select("id, name, slug")
    .or("product_code.eq.AKMC DPB - LTA,sku.eq.AKMC DPB - LTA,name.ilike.%DPB - LTA%")
    .limit(5);

  const matches = [bySlug, byId, ...(byCode || [])].filter(Boolean);
  const uniqueIds = [...new Set(matches.map((m) => m.id))];
  if (uniqueIds.length > 1) {
    console.error("Multiple DPB-LTA product rows found — refusing to create/update duplicates:", uniqueIds);
    process.exit(2);
  }

  let productId = uniqueIds[0] || CANONICAL_ID;
  const isUpdate = uniqueIds.length === 1;
  console.log(isUpdate ? `Updating existing product ${productId}` : `Creating serial-3 product ${productId} (was missing from catalog)`);

  const { data: brand } = await supabase.from("brands").select("id").eq("slug", "akm-care").maybeSingle();
  const { data: category } = await supabase.from("categories").select("id").eq("slug", "sarees").maybeSingle();
  const { data: subcategory } = await supabase
    .from("subcategories")
    .select("id")
    .eq("slug", "chanderi-print")
    .maybeSingle();

  const workDir = path.join(root, "tmp", "akmc-dpb-lta");
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
      alt: `AKMC DPB - LTA — view ${i + 1}`,
    });
    console.log(`  uploaded ${storagePath}`);
  }

  const productPayload = {
    id: productId,
    name: "AKMC DPB - LTA",
    slug: SLUG,
    sku: "AKMC DPB - LTA",
    product_code: "AKMC DPB - LTA",
    brand_id: brand?.id || null,
    category_id: category?.id || null,
    subcategory_id: subcategory?.id || null,
    short_description: "DNA Paper Boat Saree with Unstitched Blouse",
    detailed_description:
      "DNA Paper Boat Saree with Unstitched Blouse. Approx. 6.3 metres, top dyed weaving, available in 6 colours. Sourced for AKM Care — Trusted & Fair apparel.",
    description: "DNA Paper Boat Saree with Unstitched Blouse",
    mrp: 1092,
    selling_price: 1092,
    akm_care_price: 918,
    price: 918,
    discount_percent: 15.93,
    gst_percent: 5,
    hsn: "540752",
    dimensions: "6.3 Mtrs APX",
    stock_quantity: 6,
    status: "available",
    shipping_time: "Within 24 Hours",
    warranty: "7 Days Return Policy",
    packing_type: "Box Packing",
    category: "sarees",
    category_label: "Sarees",
    tags: ["Paper Boat", "DNA", "Ethnic Wear", "Saree", "Apparel", "AKM Care", "Top Dyed Weaving"],
    image_url: uploaded[0].url,
    images: uploaded.map((u) => ({ src: u.url, alt: u.alt })),
    seo_title: "AKMC DPB - LTA | DNA Paper Boat Saree | AKM Care",
    seo_description: "Buy AKMC DPB - LTA DNA Paper Boat saree with unstitched blouse. AKM Care price ₹918.",
    specifications: {
      variant: "TOP DYED WEAVING",
      packing: "Box Packing",
      blouse: "Unstitched",
      colours: 6,
      size: "6.3 Mtrs APX",
      serial: 3,
    },
    display_order: 3,
    is_featured: true,
    is_new_arrival: true,
    is_trending: true,
    popularity: 90,
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
    name: "TOP DYED WEAVING",
    stock: 6,
    sort_order: 0,
  });

  await supabase.from("product_colors").delete().eq("product_id", productId);
  await supabase.from("product_colors").insert([
    { product_id: productId, name: "Mint / Teal", hex: "#5FA8A0", slug: "mint-teal", image_indexes: [0], sort_order: 0 },
    { product_id: productId, name: "Forest Green", hex: "#2F5D4A", slug: "forest-green", image_indexes: [1], sort_order: 1 },
    { product_id: productId, name: "Pink / Red", hex: "#C94B6A", slug: "pink-red", image_indexes: [2], sort_order: 2 },
    { product_id: productId, name: "Multi (Collection)", hex: "#B45309", slug: "multi", image_indexes: [3], sort_order: 3 },
    { product_id: productId, name: "Indigo Teal", hex: "#1F4E5F", slug: "indigo-teal", image_indexes: [4], sort_order: 4 },
    { product_id: productId, name: "Deep Purple", hex: "#5C2D5E", slug: "deep-purple", image_indexes: [6], sort_order: 5 },
  ]);

  await supabase.from("featured_products").upsert(
    { product_id: productId, slot: "shop", display_order: 3, is_active: true },
    { onConflict: "product_id,slot" },
  );

  // Wire related products to existing catalog siblings (no duplicates)
  const siblingIds = [
    "d0000000-0000-4000-8000-000000000001",
    "d0000000-0000-4000-8000-000000000002",
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

  // HEAD-check public URLs
  const heads = [];
  for (const img of uploaded) {
    const res = await fetch(img.url, { method: "HEAD" });
    heads.push({ path: img.storage_path, status: res.status, ok: res.ok });
  }

  console.log("\nDONE");
  console.log(
    JSON.stringify(
      {
        mode: isUpdate ? "update" : "create-serial-3",
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
