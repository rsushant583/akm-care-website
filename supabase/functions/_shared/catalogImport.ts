/** Portable catalog-import engine (Vite tests + Deno Edge via mirrored _shared copy). */

export type ImportMode = "add_new" | "update_existing" | "sync";

export type CanonicalColumn =
  | "sku"
  | "name"
  | "category"
  | "price"
  | "mrp"
  | "selling_price"
  | "stock"
  | "image"
  | "images"
  | "description"
  | "gst_percent"
  | "hsn"
  | "weight"
  | "dimensions"
  | "warranty"
  | "shipping_time"
  | "packing_type";

export const CANONICAL_COLUMNS: CanonicalColumn[] = [
  "sku",
  "name",
  "category",
  "price",
  "mrp",
  "selling_price",
  "stock",
  "image",
  "images",
  "description",
  "gst_percent",
  "hsn",
  "weight",
  "dimensions",
  "warranty",
  "shipping_time",
  "packing_type",
];

const ALIASES: Record<CanonicalColumn, string[]> = {
  sku: ["sku", "product code", "product_code", "item id", "item_id", "code"],
  name: ["product name", "name", "title"],
  category: ["category", "category name", "category_label", "category label"],
  price: ["price", "akm care selling price", "akm care price", "akm_care_price", "akmcare price"],
  mrp: ["mrp", "list price"],
  selling_price: ["selling price", "selling_price"],
  stock: ["stock", "quantity", "qty", "qty."],
  image: ["image", "image filename", "image_file", "photo", "filename"],
  images: ["images", "image files", "gallery"],
  description: [
    "description",
    "product (short & detail) descriptions",
    "short description",
    "detailed description",
  ],
  gst_percent: ["gst in %", "gst %", "gst_percent", "gst"],
  hsn: ["hsn code", "hsn", "hsn_code"],
  weight: ["weight"],
  dimensions: ["size / dimensions", "dimensions", "size"],
  warranty: ["warranty", "warranty "],
  shipping_time: ["shipping duration", "shipping time", "shipping"],
  packing_type: ["packing type", "packing"],
};

export type ExistingProduct = {
  id: string;
  sku: string | null;
  product_code: string | null;
  slug: string | null;
  image_url: string | null;
};

export type CategoryRef = {
  id: string;
  name: string;
  slug: string;
};

export type NormalizedProduct = {
  sku: string;
  name: string;
  slug: string;
  categoryName: string;
  categoryId: string | null;
  categorySlug: string | null;
  categoryLabel: string | null;
  price: number;
  mrp: number | null;
  sellingPrice: number;
  akmCarePrice: number;
  discountPercent: number;
  stock: number;
  description: string;
  imageRefs: string[];
  gstPercent: number;
  hsn: string;
  weight: string | null;
  dimensions: string | null;
  warranty: string | null;
  shippingTime: string | null;
  packingType: string | null;
};

export type PlannedRow = {
  rowNumber: number;
  sku: string;
  skuKey: string;
  action: "create" | "update" | "skip";
  validationStatus: "valid" | "invalid";
  errors: string[];
  warnings: string[];
  existingProductId: string | null;
  existingSlug: string | null;
  normalized: NormalizedProduct | null;
  raw: Record<string, unknown>;
};

export type ImportReport = {
  rowsDetected: number;
  validCount: number;
  invalidCount: number;
  duplicateSkuCount: number;
  createCount: number;
  updateCount: number;
  missingImageCount: number;
  invalidPriceCount: number;
  invalidStockCount: number;
  invalidCategoryCount: number;
};

export function normalizeHeader(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function autoMapColumns(headers: string[]): Partial<Record<CanonicalColumn, string>> {
  const map: Partial<Record<CanonicalColumn, string>> = {};
  const used = new Set<string>();
  for (const canonical of CANONICAL_COLUMNS) {
    const aliases = ALIASES[canonical];
    const hit = headers.find((h) => {
      if (used.has(h)) return false;
      const n = normalizeHeader(h);
      return aliases.some((a) => n === a);
    });
    if (hit) {
      map[canonical] = hit;
      used.add(hit);
    }
  }
  return map;
}

export function applyColumnMap(
  raw: Record<string, unknown>,
  columnMap: Partial<Record<CanonicalColumn, string>>,
): Record<CanonicalColumn, unknown> {
  const out = {} as Record<CanonicalColumn, unknown>;
  for (const canonical of CANONICAL_COLUMNS) {
    const header = columnMap[canonical];
    out[canonical] = header ? raw[header] : undefined;
  }
  return out;
}

export function normalizeSku(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export function skuKey(value: unknown): string {
  return normalizeSku(value).toUpperCase();
}

export function slugifyProduct(value: string): string {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function parseImageRefs(value: unknown): string[] {
  if (value == null || value === "") return [];
  return String(value)
    .split(/[|,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parsePrice(value: unknown): { ok: boolean; value: number } {
  if (value == null || value === "") return { ok: false, value: 0 };
  const n = typeof value === "number" ? value : Number(String(value).replace(/[,₹\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return { ok: false, value: n };
  return { ok: true, value: Math.round(n * 100) / 100 };
}

export function parseStock(value: unknown): { ok: boolean; value: number } {
  if (value == null || value === "") return { ok: false, value: 0 };
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return { ok: false, value: n };
  return { ok: true, value: n };
}

export function parseCsv(text: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const raw = text.replace(/^\uFEFF/, "");
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inQuotes) {
      if (ch === '"') {
        if (raw[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      if (row.some((c) => c.trim())) lines.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((c) => c.trim())) lines.push(row);

  if (!lines.length) return { headers: [], rows: [] };
  const headerIdx = detectHeaderRow(lines);
  const headers = lines[headerIdx].map((h) => String(h || "").trim());
  const rows: Record<string, unknown>[] = [];
  for (let r = headerIdx + 1; r < lines.length; r++) {
    const obj: Record<string, unknown> = {};
    let empty = true;
    headers.forEach((h, i) => {
      if (!h) return;
      const v = lines[r][i] ?? "";
      obj[h] = v;
      if (String(v).trim()) empty = false;
    });
    if (!empty) rows.push(obj);
  }
  return { headers: headers.filter(Boolean), rows };
}

export function detectHeaderRow(rows: string[][]): number {
  const score = (cells: string[]) => {
    const mapped = autoMapColumns(cells.map((c) => String(c || "").trim()).filter(Boolean));
    let n = 0;
    if (mapped.sku) n += 2;
    if (mapped.name) n += 2;
    if (mapped.price || mapped.stock || mapped.category) n += 1;
    return n;
  };
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const s = score(rows[i] || []);
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  }
  return best;
}

export function sheetRowsToObjects(grid: unknown[][]): { headers: string[]; rows: Record<string, unknown>[] } {
  const lines = grid.map((r) => (r || []).map((c) => (c == null ? "" : String(c))));
  if (!lines.length) return { headers: [], rows: [] };
  const headerIdx = detectHeaderRow(lines);
  const headers = lines[headerIdx].map((h) => String(h || "").trim());
  const rows: Record<string, unknown>[] = [];
  for (let r = headerIdx + 1; r < lines.length; r++) {
    const obj: Record<string, unknown> = {};
    let empty = true;
    headers.forEach((h, i) => {
      if (!h) return;
      const v = lines[r][i];
      obj[h] = v;
      if (v != null && String(v).trim()) empty = false;
    });
    if (!empty) rows.push(obj);
  }
  return { headers: headers.filter(Boolean), rows };
}

export function zipEntryBasename(path: string): string {
  const name = path.replace(/\\/g, "/").split("/").pop() || path;
  return name;
}

export function isImageFilename(name: string): boolean {
  return /\.(png|jpe?g|webp)$/i.test(name);
}

/** Match ZIP entries to a SKU: exact basename or SKU + separator + rest. */
export function matchZipEntriesForSku(sku: string, zipPaths: string[]): string[] {
  const key = skuKey(sku);
  if (!key) return [];
  const hits: { path: string; sort: string }[] = [];
  for (const path of zipPaths) {
    const base = zipEntryBasename(path);
    if (base.startsWith(".") || /\/__macosx\//i.test(path.replace(/\\/g, "/"))) continue;
    if (!isImageFilename(base)) continue;
    const stem = base.replace(/\.(png|jpe?g|webp)$/i, "");
    const stemKey = skuKey(stem);
    if (stemKey === key) {
      hits.push({ path, sort: stemKey });
      continue;
    }
    const prefix = new RegExp(`^${escapeRegExp(key)}[-_\\s.]+`, "i");
    if (prefix.test(stemKey) || prefix.test(stem)) {
      hits.push({ path, sort: stemKey });
    }
  }
  hits.sort((a, b) => a.sort.localeCompare(b.sort));
  return hits.map((h) => h.path);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function indexExistingProducts(products: ExistingProduct[]): Map<string, ExistingProduct> {
  const map = new Map<string, ExistingProduct>();
  for (const p of products) {
    const k1 = skuKey(p.sku);
    const k2 = skuKey(p.product_code);
    if (k1 && !map.has(k1)) map.set(k1, p);
    if (k2 && !map.has(k2)) map.set(k2, p);
  }
  return map;
}

export function matchCategory(input: string, categories: CategoryRef[]): CategoryRef | null {
  const n = normalizeHeader(input);
  if (!n) return null;
  return (
    categories.find((c) => normalizeHeader(c.slug) === n || normalizeHeader(c.name) === n) ||
    categories.find((c) => normalizeHeader(c.name).includes(n) || n.includes(normalizeHeader(c.name))) ||
    null
  );
}

export function emptyReport(): ImportReport {
  return {
    rowsDetected: 0,
    validCount: 0,
    invalidCount: 0,
    duplicateSkuCount: 0,
    createCount: 0,
    updateCount: 0,
    missingImageCount: 0,
    invalidPriceCount: 0,
    invalidStockCount: 0,
    invalidCategoryCount: 0,
  };
}

export function planImportRows(input: {
  rows: Record<string, unknown>[];
  columnMap: Partial<Record<CanonicalColumn, string>>;
  mode: ImportMode;
  existing: ExistingProduct[];
  categories: CategoryRef[];
  zipFilenames: string[];
}): { planned: PlannedRow[]; report: ImportReport } {
  const existingMap = indexExistingProducts(input.existing);
  const seen = new Map<string, number>();
  const planned: PlannedRow[] = [];
  const report = emptyReport();
  report.rowsDetected = input.rows.length;

  input.rows.forEach((raw, idx) => {
    const rowNumber = idx + 1;
    const mapped = applyColumnMap(raw, input.columnMap);
    const errors: string[] = [];
    const warnings: string[] = [];
    const sku = normalizeSku(mapped.sku);
    const key = skuKey(sku);
    const name = String(mapped.name ?? "").trim();
    const categoryName = String(mapped.category ?? "").trim();
    const priceParsed = parsePrice(mapped.price);
    const stockParsed = parseStock(mapped.stock);
    const imageRefs = [...parseImageRefs(mapped.image), ...parseImageRefs(mapped.images)].filter(
      (v, i, a) => a.indexOf(v) === i,
    );

    if (!sku) errors.push("missing_sku");
    if (!name) errors.push("missing_name");
    if (!categoryName) errors.push("missing_category");

    if (!priceParsed.ok) {
      errors.push("invalid_price");
      report.invalidPriceCount += 1;
    }
    if (!stockParsed.ok) {
      errors.push("invalid_stock");
      report.invalidStockCount += 1;
    }

    let category: CategoryRef | null = null;
    if (categoryName) {
      category = matchCategory(categoryName, input.categories);
      if (!category) {
        errors.push("invalid_category");
        report.invalidCategoryCount += 1;
      }
    }

    if (key) {
      if (seen.has(key)) {
        errors.push("duplicate_sku");
        report.duplicateSkuCount += 1;
      } else {
        seen.set(key, rowNumber);
      }
    }

    const existing = key ? existingMap.get(key) ?? null : null;
    let action: PlannedRow["action"] = "skip";
    if (existing) {
      if (input.mode === "add_new") {
        errors.push("sku_already_exists");
        action = "skip";
      } else {
        action = "update";
      }
    } else if (key && name) {
      if (input.mode === "update_existing") {
        errors.push("sku_not_found");
        action = "skip";
      } else {
        action = "create";
      }
    }

    const zipHits = sku ? matchZipEntriesForSku(sku, input.zipFilenames) : [];
    const urlHits = imageRefs.filter(isHttpUrl);
    const fileHits = imageRefs.filter((r) => !isHttpUrl(r));
    const fileInZip = fileHits.filter((f) =>
      zipHits.some((z) => zipEntryBasename(z).toLowerCase() === f.toLowerCase()),
    );
    const hasImage = zipHits.length > 0 || urlHits.length > 0 || fileInZip.length > 0;
    if (!hasImage) {
      report.missingImageCount += 1;
      if (action === "create") errors.push("missing_image");
      else if (action === "update" && existing?.image_url) warnings.push("missing_image_keep_existing");
      else if (action === "update") errors.push("missing_image");
      else warnings.push("missing_image");
    }

    const mrpParsed = mapped.mrp == null || mapped.mrp === "" ? null : parsePrice(mapped.mrp);
    if (mrpParsed && !mrpParsed.ok) warnings.push("invalid_mrp_ignored");
    const sellingParsed =
      mapped.selling_price == null || mapped.selling_price === "" ? null : parsePrice(mapped.selling_price);

    const akm = priceParsed.ok ? priceParsed.value : 0;
    const mrp = mrpParsed?.ok ? mrpParsed.value : null;
    const selling = sellingParsed?.ok ? sellingParsed.value : akm;
    if (mrp != null && akm > mrp) warnings.push("price_above_mrp");

    const gstRaw = Number(mapped.gst_percent);
    const gstPercent = Number.isFinite(gstRaw) && gstRaw >= 0 ? gstRaw : 5;
    const discountPercent =
      mrp && mrp > 0 && akm >= 0 ? Math.max(0, Math.round(((mrp - akm) / mrp) * 100)) : 0;

    const allImageRefs = [...imageRefs, ...zipHits.map(zipEntryBasename)].filter(
      (v, i, a) => a.indexOf(v) === i,
    );

    const normalized: NormalizedProduct | null =
      sku && name
        ? {
            sku,
            name,
            slug: existing?.slug || slugifyProduct(name) || slugifyProduct(sku),
            categoryName,
            categoryId: category?.id ?? null,
            categorySlug: category?.slug ?? null,
            categoryLabel: category?.name ?? categoryName,
            price: akm,
            mrp,
            sellingPrice: selling,
            akmCarePrice: akm,
            discountPercent,
            stock: stockParsed.ok ? stockParsed.value : 0,
            description: String(mapped.description ?? "").trim(),
            imageRefs: allImageRefs,
            gstPercent,
            hsn: String(mapped.hsn ?? "").trim(),
            weight: mapped.weight != null && String(mapped.weight).trim() ? String(mapped.weight).trim() : null,
            dimensions:
              mapped.dimensions != null && String(mapped.dimensions).trim()
                ? String(mapped.dimensions).trim()
                : null,
            warranty:
              mapped.warranty != null && String(mapped.warranty).trim() ? String(mapped.warranty).trim() : null,
            shippingTime:
              mapped.shipping_time != null && String(mapped.shipping_time).trim()
                ? String(mapped.shipping_time).trim()
                : null,
            packingType:
              mapped.packing_type != null && String(mapped.packing_type).trim()
                ? String(mapped.packing_type).trim()
                : null,
          }
        : null;

    const validationStatus = errors.length ? "invalid" : "valid";
    if (validationStatus === "valid") {
      report.validCount += 1;
      if (action === "create") report.createCount += 1;
      if (action === "update") report.updateCount += 1;
    } else {
      report.invalidCount += 1;
    }

    planned.push({
      rowNumber,
      sku,
      skuKey: key,
      action: validationStatus === "valid" ? action : action === "update" || action === "create" ? action : "skip",
      validationStatus,
      errors,
      warnings,
      existingProductId: existing?.id ?? null,
      existingSlug: existing?.slug ?? null,
      normalized,
      raw,
    });
  });

  return { planned, report };
}

export function summarizeNotInFile(existingSkus: string[], planned: PlannedRow[]): string[] {
  const inFile = new Set(planned.map((p) => p.skuKey).filter(Boolean));
  const missing: string[] = [];
  for (const sku of existingSkus) {
    const k = skuKey(sku);
    if (k && !inFile.has(k)) missing.push(sku);
  }
  return missing;
}
