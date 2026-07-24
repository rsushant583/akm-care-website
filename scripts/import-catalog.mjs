/**
 * Import Excel master + local catalog images into Supabase.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-catalog.mjs
 *
 * Or with Vite env:
 *   node --env-file=.env scripts/import-catalog.mjs
 *
 * Expects:
 *   data/imports/products.xlsx
 *   public/catalog/{slug}/*.png
 *
 * Uploads images to Storage bucket `products/` and upserts normalized catalog rows.
 * Safe to re-run (idempotent by SKU / slug).
 */

import { createClient } from "@supabase/supabase-js";
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (script-only; never use VITE_ service keys).");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseExcel() {
  const xlsxPath = path.join(root, "data", "imports", "products.xlsx");
  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`Excel not found: ${xlsxPath}`);
  }

  // Prefer python+openpyxl (already used in this project)
  const py = `
import openpyxl, json
wb = openpyxl.load_workbook(r"""${xlsxPath.replace(/\\/g, "\\\\")}""", data_only=True)
ws = wb.active
rows = list(ws.iter_rows(values_only=True))
headers = [str(h).strip() if h else "" for h in rows[1]]
out = []
for row in rows[2:]:
    if row[0] is None and row[1] is None:
        continue
    item = {}
    for i, h in enumerate(headers):
        if not h: continue
        item[h] = row[i]
    out.append(item)
print(json.dumps(out))
`;
  const result = spawnSync("python", ["-c", py], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(result.stderr || "Failed to parse Excel with python/openpyxl");
  }
  return JSON.parse(result.stdout);
}

function mapExcelRow(row) {
  const name = String(row["Product Name"] ?? "").trim();
  const sku = String(row["Product Code"] ?? "").trim();
  const mrp = Number(row["MRP"] ?? 0);
  const selling = Number(row["Selling Price"] ?? mrp);
  const akm = Number(row["AKM Care Selling Price"] ?? selling);
  const discountRaw = Number(row["Cost Saving in %"] ?? 0);
  const discount = discountRaw > 0 && discountRaw < 1 ? Math.round(discountRaw * 100) : Math.round(discountRaw);
  const qty = Number(row["Quantity"] ?? 0);
  const folderGuess = slugify(name);
  return {
    name,
    sku,
    productCode: sku,
    shortDescription: String(row["Product (Short & Detail) Descriptions"] ?? "").trim(),
    detailedDescription: String(row["Product (Short & Detail) Descriptions"] ?? "").trim(),
    quantity: qty,
    weight: row["Weight"] != null ? String(row["Weight"]) : null,
    dimensions: row["Size / Dimensions"] != null ? String(row["Size / Dimensions"]) : null,
    variantName: row["Variants"] != null ? String(row["Variants"]) : "Standard",
    colorCount: Number(row["colours"] ?? 0),
    shippingTime: row["Shipping Duration"] != null ? String(row["Shipping Duration"]) : "3–5 business days",
    warranty: row["Warranty "] != null ? String(row["Warranty "]) : row["Warranty"] != null ? String(row["Warranty"]) : "NA",
    packingType: row["Packing Type"] != null ? String(row["Packing Type"]) : null,
    mrp,
    sellingPrice: selling,
    akmCarePrice: akm,
    discountPercent: discount || Math.round(((mrp - akm) / (mrp || 1)) * 100),
    gstPercent: Number(row["GST in %"] ?? 5),
    gstNumber: row["GST No."] != null ? String(row["GST No."]) : null,
    hsn: row["HSN Code"] != null ? String(row["HSN Code"]) : "",
    freightCost: row["Freight Cost"] != null ? String(row["Freight Cost"]) : null,
    status: qty > 0 ? "available" : "sold_out",
    folder: folderGuess.includes("sani") ? "akmc-sani-1007" : folderGuess.includes("rooh") ? "akmc-rooh-0002" : folderGuess,
    slug: folderGuess.includes("sani") ? "akmc-sani-1007" : folderGuess.includes("rooh") ? "akmc-rooh-0002" : folderGuess,
  };
}

async function ensureBrandAndCategory() {
  const { data: brand } = await supabase
    .from("brands")
    .upsert({ name: "AKM Care", slug: "akm-care", description: "Trusted & Fair" }, { onConflict: "slug" })
    .select("id")
    .single();

  const { data: category } = await supabase
    .from("categories")
    .upsert({ name: "Sarees", slug: "sarees", display_order: 1 }, { onConflict: "slug" })
    .select("id")
    .single();

  let subcategoryId = null;
  if (category?.id) {
    const { data: sub } = await supabase
      .from("subcategories")
      .upsert(
        { category_id: category.id, name: "Chanderi Print", slug: "chanderi-print", display_order: 1 },
        { onConflict: "category_id,slug" },
      )
      .select("id")
      .single();
    subcategoryId = sub?.id ?? null;
  }

  return { brandId: brand?.id, categoryId: category?.id, subcategoryId };
}

async function uploadFolderImages(slug) {
  const dir = path.join(root, "public", "catalog", slug);
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();

  const urls = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(dir, file);
    const storagePath = `products/${slug}/${file}`;
    const body = fs.readFileSync(filePath);
    const contentType = file.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

    const { error: upErr } = await supabase.storage.from("products").upload(storagePath, body, {
      contentType,
      upsert: true,
    });
    if (upErr) {
      console.warn(`Upload failed ${storagePath}:`, upErr.message);
      urls.push({
        url: `/catalog/${slug}/${file}`,
        storage_path: storagePath,
        sort_order: i,
        is_primary: i === 0,
        alt: `${slug} ${i + 1}`,
      });
      continue;
    }

    const { data } = supabase.storage.from("products").getPublicUrl(storagePath);
    urls.push({
      url: data.publicUrl,
      storage_path: storagePath,
      sort_order: i,
      is_primary: i === 0,
      alt: `${slug} ${i + 1}`,
    });
  }
  return urls;
}

async function upsertProduct(mapped, refs, images) {
  const payload = {
    name: mapped.name,
    slug: mapped.slug,
    sku: mapped.sku,
    product_code: mapped.productCode,
    brand_id: refs.brandId,
    category_id: refs.categoryId,
    subcategory_id: refs.subcategoryId,
    short_description: mapped.shortDescription,
    detailed_description: mapped.detailedDescription,
    description: mapped.shortDescription,
    mrp: mapped.mrp,
    selling_price: mapped.sellingPrice,
    akm_care_price: mapped.akmCarePrice,
    price: mapped.akmCarePrice,
    discount_percent: mapped.discountPercent,
    gst_percent: mapped.gstPercent,
    gst_number: mapped.gstNumber,
    hsn: mapped.hsn,
    dimensions: mapped.dimensions,
    weight: mapped.weight,
    stock_quantity: mapped.quantity,
    status: mapped.status,
    shipping_time: mapped.shippingTime,
    warranty: mapped.warranty,
    packing_type: mapped.packingType,
    freight_cost: mapped.freightCost,
    category: "sarees",
    category_label: "Sarees",
    tags: ["Chanderi", "Ethnic Wear", "Apparel", "AKM Care"],
    is_featured: true,
    is_new_arrival: true,
    is_best_seller: mapped.slug.includes("sani"),
    is_trending: true,
    popularity: mapped.slug.includes("sani") ? 98 : 92,
    image_url: images[0]?.url ?? null,
    seo_title: `${mapped.name} | AKM Care`,
    seo_description: mapped.shortDescription.slice(0, 160),
    specifications: { variant: mapped.variantName, packing: mapped.packingType },
  };

  // Find existing by sku or slug
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .or(`sku.eq.${mapped.sku},slug.eq.${mapped.slug}`)
    .maybeSingle();

  let productId = existing?.id;
  if (productId) {
    const { error } = await supabase.from("products").update(payload).eq("id", productId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("products").insert(payload).select("id").single();
    if (error) throw error;
    productId = data.id;
  }

  await supabase.from("product_images").delete().eq("product_id", productId);
  if (images.length) {
    const { error } = await supabase.from("product_images").insert(
      images.map((img) => ({
        product_id: productId,
        url: img.url,
        alt: img.alt,
        storage_path: img.storage_path,
        sort_order: img.sort_order,
        is_primary: img.is_primary,
      })),
    );
    if (error) throw error;
  }

  await supabase.from("product_variants").delete().eq("product_id", productId);
  await supabase.from("product_variants").insert({
    product_id: productId,
    name: mapped.variantName || "PRINT",
    stock: mapped.quantity,
    sort_order: 0,
  });

  await supabase.from("inventory").delete().eq("product_id", productId);
  await supabase.from("inventory").insert({
    product_id: productId,
    warehouse_code: "DEFAULT",
    quantity_on_hand: mapped.quantity,
    quantity_reserved: 0,
  });

  await supabase.from("featured_products").upsert(
    { product_id: productId, slot: "shop", display_order: mapped.slug.includes("sani") ? 1 : 2, is_active: true },
    { onConflict: "product_id,slot" },
  );

  return productId;
}

async function main() {
  console.log("Parsing Excel…");
  const rows = parseExcel().map(mapExcelRow).filter((r) => r.name && r.sku);
  console.log(`Found ${rows.length} product row(s).`);

  const refs = await ensureBrandAndCategory();
  console.log("Brand/category ready.");

  const ids = [];
  for (const row of rows) {
    console.log(`Importing ${row.name} (${row.sku})…`);
    const images = await uploadFolderImages(row.folder);
    console.log(`  images: ${images.length}`);
    const id = await upsertProduct(row, refs, images);
    ids.push(id);
    console.log(`  product id: ${id}`);
  }

  if (ids.length >= 2) {
    await supabase.from("related_products").delete().in("product_id", ids);
    await supabase.from("related_products").insert([
      { product_id: ids[0], related_product_id: ids[1], relation_type: "related", display_order: 1 },
      { product_id: ids[1], related_product_id: ids[0], relation_type: "related", display_order: 1 },
    ]);
  }

  console.log("Catalog import complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
