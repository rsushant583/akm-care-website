/**
 * Customer-facing product presentation helpers.
 * Builds display titles / short copy / detail rows from authoritative catalog fields only.
 * Never invents colour, fabric, work, silhouette, occasion, or included items.
 */

import type { CatalogProduct, ProductCategorySlug } from "./types";

/** Fashion attributes stored in products.specifications (jsonb) + mapped companions. */
export type ProductFashionAttributes = {
  colour?: string;
  fabric?: string;
  work?: string;
  pattern?: string;
  shape?: string;
  style?: string;
  occasion?: string;
  includes?: string;
  care?: string;
  /** Legacy catalog keys — shown when present */
  blouse?: string;
  packing?: string;
  size?: string;
  variant?: string;
};

export type ProductDetailRow = { label: string; value: string };

const MEANINGLESS = new Set(["", "na", "n/a", "—", "-", "null", "undefined", "1", "0", "default"]);

function cleanText(value?: string | number | null): string | undefined {
  if (value == null) return undefined;
  const t = String(value).replace(/\s+/g, " ").trim();
  if (!t) return undefined;
  if (MEANINGLESS.has(t.toLowerCase())) return undefined;
  // Numeric-only colour placeholders from imports
  if (/^\d+$/.test(t)) return undefined;
  return t;
}

function titleCaseWords(input: string): string {
  return input
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      // Keep short all-caps tokens that look like codes (HSN-ish) as-is if mixed
      if (/^[A-Z0-9]{2,}[-/]?[A-Z0-9]*$/.test(word) && word.length <= 6 && /[0-9]/.test(word)) {
        return word;
      }
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/** Soften ALL-CAPS / noisy names without inventing new words. */
export function humanizeProductName(name: string): string {
  let t = name.replace(/\s+/g, " ").trim();
  if (!t) return t;

  // Drop leading internal brand code when the remainder is already a product title.
  const stripped = t.replace(/^AKM\s*C?\s+/i, "").trim();
  if (
    stripped.length >= 8 &&
    stripped !== t &&
    /\b(saree|gown|lehenga|suit|jeans|blouse|kurta)\b/i.test(stripped)
  ) {
    t = stripped;
  }

  const letters = t.replace(/[^A-Za-z]/g, "");
  const upperRatio = letters ? [...letters].filter((c) => c === c.toUpperCase()).length / letters.length : 0;
  const heavyCapsRun = /(?:[A-Z]{3,}[\s/()-]+){2,}[A-Z]{3,}/.test(t);
  if ((upperRatio > 0.55 && letters.length > 8) || heavyCapsRun) {
    return titleCaseWords(t);
  }
  return t;
}

/** Internal SKU-style names that should not be the primary customer title when better copy exists. */
export function isSkuLikeProductName(name: string): boolean {
  const t = name.trim();
  if (!t) return true;
  // AKMC SANI - 1007 / AKM RFX - MCMD / AKMC WSOMF - MAER
  if (/^AKM\s*C?\s*[A-Z0-9]+(\s*[-–]\s*[A-Z0-9]+)?$/i.test(t)) return true;
  if (/^AKMC?\s+[A-Z0-9._-]{2,12}(\s*[-–]\s*[A-Z0-9._-]{1,12})?$/i.test(t) && !/\b(saree|gown|lehenga|suit|jeans|blouse)\b/i.test(t)) {
    return true;
  }
  return false;
}

function firstSentence(text: string, maxLen = 180): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const match = normalized.match(/^(.+?[.!?])(?:\s|$)/);
  const sentence = (match?.[1] || normalized).trim();
  if (sentence.length <= maxLen) return sentence;
  return `${sentence.slice(0, maxLen - 1).trim()}…`;
}

function pickSpecString(specs: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const raw = specs[key];
    if (typeof raw === "string" || typeof raw === "number") {
      const cleaned = cleanText(raw);
      if (cleaned) return cleaned;
    }
  }
  return undefined;
}

export function parseProductSpecifications(raw: unknown): ProductFashionAttributes {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const specs = raw as Record<string, unknown>;
  return {
    colour: pickSpecString(specs, ["colour", "color"]),
    fabric: pickSpecString(specs, ["fabric", "material"]),
    work: pickSpecString(specs, ["work"]),
    pattern: pickSpecString(specs, ["pattern"]),
    shape: pickSpecString(specs, ["shape"]),
    style: pickSpecString(specs, ["style", "fit"]),
    occasion: pickSpecString(specs, ["occasion"]),
    includes: pickSpecString(specs, ["includes", "whats_included", "what_included"]),
    care: pickSpecString(specs, ["care", "care_instructions"]),
    blouse: pickSpecString(specs, ["blouse"]),
    packing: pickSpecString(specs, ["packing", "packing_type"]),
    size: pickSpecString(specs, ["size"]),
    variant: pickSpecString(specs, ["variant"]),
  };
}

function colourFromProduct(product: CatalogProduct, attrs: ProductFashionAttributes): string | undefined {
  if (attrs.colour) return attrs.colour;
  const fromColors = product.colors.map((c) => cleanText(c.name)).find(Boolean);
  return fromColors;
}

function workOrPattern(attrs: ProductFashionAttributes): string | undefined {
  return attrs.work || attrs.pattern || attrs.variant;
}

function productTypePhrase(category: ProductCategorySlug | string): string {
  switch (category) {
    case "sarees":
      return "Saree";
    case "ladies-gown":
      return "Gown";
    case "semi-stitched-gown":
      return "Semi Stitched Gown";
    case "semi-stitched-lehenga":
      return "Semi Stitched Lehenga";
    case "semi-stitched-blouse":
      return "Semi Stitched Blouse";
    case "stitched-lehenga":
      return "Stitched Lehenga";
    case "unstitched-lehenga":
      return "Unstitched Lehenga";
    case "3-piece-suits":
      return "3-Piece Suit";
    case "mens-jeans":
      return "Jeans";
    default:
      return "";
  }
}

function buildIncludes(product: CatalogProduct, attrs: ProductFashionAttributes): string | undefined {
  if (attrs.includes) return attrs.includes;
  const blouse = attrs.blouse;
  if (!blouse) return undefined;
  const blouseLower = blouse.toLowerCase();
  if (product.category === "sarees") {
    if (blouseLower.includes("unstitched")) return "Saree + Unstitched Blouse Fabric";
    if (blouseLower.includes("matching")) return "Saree + Matching Blouse";
    return `Saree + ${blouse} Blouse`;
  }
  return undefined;
}

/** Resolve authoritative fashion attributes for a catalog product. */
export function getProductAttributes(product: CatalogProduct): ProductFashionAttributes {
  const attrs = { ...(product.specifications || {}) };
  const colour = colourFromProduct(product, attrs);
  const packing = attrs.packing || cleanText(product.packingType) || undefined;
  const size = attrs.size || cleanText(product.dimensions) || undefined;
  const includes = buildIncludes(product, attrs);
  return {
    ...attrs,
    colour,
    packing,
    size,
    includes,
  };
}

/**
 * Deterministic customer-facing title.
 * Uses structured attributes when enough exist; otherwise falls back safely.
 */
export function getProductDisplayTitle(product: CatalogProduct): string {
  const rawName = product.name.replace(/\s+/g, " ").trim();
  const humanizedName = humanizeProductName(rawName);

  // Keep already-descriptive catalog names (do not overwrite with sparse specs).
  if (!isSkuLikeProductName(rawName) && /\b(saree|gown|lehenga|suit|jeans|blouse|kurta)\b/i.test(rawName)) {
    return humanizedName;
  }

  const attrs = getProductAttributes(product);
  const type = productTypePhrase(product.category);
  const colour = attrs.colour;
  const work = workOrPattern(attrs);
  const fabric = attrs.fabric;
  const shape = attrs.shape || attrs.style;

  const structuredParts = [colour, work, fabric, shape].filter(Boolean) as string[];
  // Require colour or fabric (or 2+ attributes) — variant-alone titles like "Print Saree" are too weak.
  const strongEnough =
    Boolean(colour || fabric) || structuredParts.filter((p) => p !== work).length >= 1 && structuredParts.length >= 2;

  if (strongEnough && structuredParts.length >= 1 && type) {
    const core = [...structuredParts, type].join(" ");
    const includesLower = (attrs.includes || "").toLowerCase();
    if (includesLower.includes("dupatta") && !/with dupatta/i.test(core)) {
      return humanizeProductName(`${core} With Dupatta`);
    }
    if (
      (product.category === "stitched-lehenga" || product.category === "unstitched-lehenga") &&
      includesLower.includes("set") &&
      !/set$/i.test(core)
    ) {
      return humanizeProductName(`${core} Set`);
    }
    return humanizeProductName(core);
  }

  // SKU-like catalog names: prefer a short, factual short_description as the title.
  if (isSkuLikeProductName(rawName)) {
    const short = cleanText(product.shortDescription);
    if (short && short.length <= 90 && !/\bfor VIP\b/i.test(short) && !/\benhance the overall\b/i.test(short)) {
      const phrase = short.split(/[,.]/)[0]?.trim() || short;
      if (phrase.length >= 8) return humanizeProductName(phrase);
    }
    // Keep the catalog code readable — do not title-case internal SKUs into "Akmc…".
    return rawName;
  }

  return humanizedName;
}

/** Secondary metadata line for cards / PDP (SKU or category — never the primary title). */
export function getProductMetaLine(product: CatalogProduct): string | undefined {
  const code = cleanText(product.productCode) || cleanText(product.sku);
  if (code && code !== product.name) return code;
  return cleanText(product.categoryLabel);
}

/**
 * 1–2 factual sentences. No invented quality adjectives.
 */
export function getProductShortCopy(product: CatalogProduct): string {
  const attrs = getProductAttributes(product);
  const type = productTypePhrase(product.category) || cleanText(product.categoryLabel) || "product";
  const colour = attrs.colour;
  const work = workOrPattern(attrs);
  const fabric = attrs.fabric;
  const occasion = attrs.occasion;
  const includes = attrs.includes;

  const bits: string[] = [];
  if (colour || work || fabric) {
    const lead = [colour, work, fabric].filter(Boolean).join(" ");
    bits.push(`A ${lead} ${type.toLowerCase()}.`);
  }
  if (includes) {
    bits.push(`Includes ${includes.replace(/^includes\s+/i, "")}.`);
  } else if (occasion) {
    bits.push(`Suitable for ${occasion}.`);
  }

  if (bits.length > 0) {
    return bits.slice(0, 2).join(" ");
  }

  const existing =
    cleanText(product.shortDescription) ||
    cleanText(product.description) ||
    cleanText(product.detailedDescription);

  if (existing) {
    // Keep source text; limit to two sentences for card/PDP subtitle use.
    const parts = existing.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 2);
    return parts.join(" ").slice(0, 280);
  }

  return `${type} from AKM Care.`;
}

/** Ordered PDP detail rows — omit empties. */
export function getProductDetailRows(product: CatalogProduct): ProductDetailRow[] {
  const attrs = getProductAttributes(product);
  const rows: Array<[string, string | undefined]> = [
    ["Colour", attrs.colour],
    ["Fabric / Material", attrs.fabric],
    ["Work / Pattern", workOrPattern(attrs)],
    ["Style / Shape", attrs.shape || attrs.style],
    ["Occasion", attrs.occasion],
    ["Includes", attrs.includes],
    ["Length / Size", attrs.size],
    ["Care", attrs.care],
    ["Packing", attrs.packing],
  ];

  return rows
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label, value: value as string }));
}

/** Compact one-line card meta when useful (colour · fabric). */
export function getProductCardMeta(product: CatalogProduct): string | undefined {
  const attrs = getProductAttributes(product);
  const parts = [attrs.colour, attrs.fabric || workOrPattern(attrs)].filter(Boolean);
  if (parts.length >= 1) return parts.join(" · ");
  return getProductMetaLine(product);
}

export function mergeSpecifications(
  existing: unknown,
  fashion: Partial<ProductFashionAttributes>,
): Record<string, string> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) {
    if (typeof v === "string" || typeof v === "number") {
      const cleaned = cleanText(v);
      if (cleaned) next[k] = cleaned;
    }
  }
  const map: Array<[keyof ProductFashionAttributes, string]> = [
    ["colour", "colour"],
    ["fabric", "fabric"],
    ["work", "work"],
    ["pattern", "pattern"],
    ["shape", "shape"],
    ["style", "style"],
    ["occasion", "occasion"],
    ["includes", "includes"],
    ["care", "care"],
  ];
  for (const [key, jsonKey] of map) {
    const value = cleanText(fashion[key] ?? undefined);
    if (value) next[jsonKey] = value;
    else delete next[jsonKey];
  }
  return next;
}

/** Preview helper for audits — does not mutate catalog. */
export function previewDisplayTitle(product: CatalogProduct): {
  displayTitle: string;
  usedFallback: boolean;
  gaps: string[];
} {
  const attrs = getProductAttributes(product);
  const title = getProductDisplayTitle(product);
  const structured =
    Boolean(attrs.colour || attrs.fabric || attrs.work || attrs.pattern || attrs.variant) &&
    Boolean(productTypePhrase(product.category));
  const gaps: string[] = [];
  if (!attrs.colour) gaps.push("colour");
  if (!attrs.fabric) gaps.push("fabric");
  if (!workOrPattern(attrs)) gaps.push("work/pattern");
  if (!attrs.includes) gaps.push("includes");
  if (!attrs.care) gaps.push("care");
  return {
    displayTitle: title,
    usedFallback: !structured || title === humanizeProductName(product.name) || isSkuLikeProductName(product.name),
    gaps,
  };
}

export function firstSentenceSafe(text: string): string {
  return firstSentence(text);
}
