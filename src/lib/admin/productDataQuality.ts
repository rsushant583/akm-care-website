/**
 * Admin data-quality flags — report only; never silently rewrite catalog rows.
 */

import { isSkuLikeProductName, parseProductSpecifications } from "@/lib/ecommerce/productPresentation";
import type { AdminProduct } from "@/services/adminCatalogService";

export type QualityIssueCode =
  | "missing_category"
  | "legacy_apparel"
  | "missing_image"
  | "invalid_price_mrp"
  | "negative_stock"
  | "missing_title_attrs"
  | "missing_care"
  | "code_like_name"
  | "ambiguous_semi_stitched"
  | "draft"
  | "out_of_stock"
  | "low_stock"
  | "needs_information";

export type QualityIssue = {
  code: QualityIssueCode;
  label: string;
  severity: "error" | "warn" | "info";
};

function hasUsableImage(p: AdminProduct): boolean {
  if (p.image_url && String(p.image_url).trim()) return true;
  if (Array.isArray(p.images) && (p.images as string[]).some((u) => String(u || "").trim())) return true;
  return false;
}

export function assessProductQuality(
  p: AdminProduct,
  opts?: { lowStockThreshold?: number },
): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const low = opts?.lowStockThreshold ?? 5;
  const cat = String(p.category || "").trim().toLowerCase();
  const mrp = Number(p.mrp ?? 0);
  const selling = Number(p.selling_price ?? p.akm_care_price ?? p.price ?? 0);
  const stock = Number(p.stock_quantity ?? 0);
  const specs = parseProductSpecifications(p.specifications);
  const name = String(p.name || "");

  if (!cat) {
    issues.push({ code: "missing_category", label: "Missing category", severity: "error" });
  } else if (cat === "apparel") {
    issues.push({ code: "legacy_apparel", label: 'Legacy category "apparel"', severity: "warn" });
  }

  if (!hasUsableImage(p)) {
    issues.push({ code: "missing_image", label: "Missing image", severity: "error" });
  }

  if (!Number.isFinite(selling) || selling < 0 || (mrp > 0 && selling > mrp)) {
    issues.push({ code: "invalid_price_mrp", label: "Invalid price / MRP", severity: "error" });
  }

  if (!Number.isFinite(stock) || stock < 0) {
    issues.push({ code: "negative_stock", label: "Negative stock", severity: "error" });
  } else if (stock === 0) {
    issues.push({ code: "out_of_stock", label: "Out of stock", severity: "warn" });
  } else if (stock <= low) {
    issues.push({ code: "low_stock", label: "Low stock", severity: "info" });
  }

  const titleAttrs = [specs.colour, specs.fabric, specs.work, specs.pattern].filter(Boolean);
  if (titleAttrs.length === 0) {
    issues.push({
      code: "missing_title_attrs",
      label: "Missing colour/fabric/work for customer title",
      severity: "info",
    });
  }

  if (!specs.care) {
    issues.push({ code: "missing_care", label: "Missing care instructions", severity: "info" });
  }

  if (isSkuLikeProductName(name)) {
    issues.push({
      code: "code_like_name",
      label: "Code-like product name — add attributes for title",
      severity: "info",
    });
  }

  if (/semi[\s-]?stich/i.test(name) || (/semi/i.test(name) && /stich/i.test(name))) {
    issues.push({
      code: "ambiguous_semi_stitched",
      label: "Ambiguous SEMI-STICHED naming — verify category",
      severity: "warn",
    });
  }

  if (p.status === "draft") {
    issues.push({ code: "draft", label: "Draft (hidden on shop)", severity: "info" });
  }

  const needsInfo = issues.some((i) =>
    [
      "missing_category",
      "missing_image",
      "invalid_price_mrp",
      "missing_title_attrs",
      "missing_care",
      "code_like_name",
    ].includes(i.code),
  );
  if (needsInfo) {
    issues.push({ code: "needs_information", label: "Needs information", severity: "warn" });
  }

  return issues;
}

export function summarizeQuality(products: AdminProduct[], lowStockThreshold = 5) {
  const rows = products.map((p) => ({
    product: p,
    issues: assessProductQuality(p, { lowStockThreshold }),
  }));
  const counts = {
    needs_information: 0,
    missing_category: 0,
    missing_image: 0,
    invalid_price_mrp: 0,
    negative_stock: 0,
    legacy_apparel: 0,
    missing_title_attrs: 0,
    missing_care: 0,
    code_like_name: 0,
    ambiguous_semi_stitched: 0,
    draft: 0,
    low_stock: 0,
    out_of_stock: 0,
  };
  for (const row of rows) {
    for (const issue of row.issues) {
      if (issue.code in counts) counts[issue.code as keyof typeof counts] += 1;
    }
  }
  return { rows, counts };
}
