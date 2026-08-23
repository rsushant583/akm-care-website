/**
 * Guided catalog completeness for Admin product form.
 * Report-only — never invents fabric/colour/work or rewrites catalog text.
 */

import { parseProductSpecifications, isSkuLikeProductName } from "@/lib/ecommerce/productPresentation";

export type CompletenessInput = {
  name?: string | null;
  category?: string | null;
  mrp?: number | null;
  selling_price?: number | null;
  akm_care_price?: number | null;
  price?: number | null;
  stock_quantity?: number | null;
  images?: string[];
  short_description?: string | null;
  specifications?: unknown;
  spec_colour?: string;
  spec_fabric?: string;
  spec_work?: string;
  spec_pattern?: string;
  spec_occasion?: string;
  spec_includes?: string;
  spec_care?: string;
};

export type CompletenessItem = {
  id: string;
  label: string;
  filled: boolean;
  group: "core" | "presentation";
};

function hasText(v?: string | null): boolean {
  return Boolean(String(v || "").trim());
}

function resolveSpecs(input: CompletenessInput) {
  const fromJson = parseProductSpecifications(input.specifications);
  return {
    colour: hasText(input.spec_colour) ? input.spec_colour!.trim() : fromJson.colour,
    fabric: hasText(input.spec_fabric) ? input.spec_fabric!.trim() : fromJson.fabric,
    work: hasText(input.spec_work) ? input.spec_work!.trim() : fromJson.work,
    pattern: hasText(input.spec_pattern) ? input.spec_pattern!.trim() : fromJson.pattern,
    occasion: hasText(input.spec_occasion) ? input.spec_occasion!.trim() : fromJson.occasion,
    includes: hasText(input.spec_includes) ? input.spec_includes!.trim() : fromJson.includes,
    care: hasText(input.spec_care) ? input.spec_care!.trim() : fromJson.care,
  };
}

export function getProductCompleteness(input: CompletenessInput): {
  percent: number;
  items: CompletenessItem[];
  missing: CompletenessItem[];
  tips: string[];
} {
  const specs = resolveSpecs(input);
  const price = Number(input.akm_care_price ?? input.selling_price ?? input.price ?? NaN);
  const mrp = Number(input.mrp ?? NaN);
  const stock = Number(input.stock_quantity ?? NaN);
  const hasImage = (input.images || []).some((u) => hasText(u));
  const workOrPattern = Boolean(specs.work || specs.pattern);

  const items: CompletenessItem[] = [
    { id: "name", label: "Product title", group: "core", filled: hasText(input.name) },
    { id: "category", label: "Category", group: "core", filled: hasText(input.category) },
    { id: "price", label: "Selling / AKM Care price", group: "core", filled: Number.isFinite(price) && price > 0 },
    { id: "mrp", label: "MRP", group: "core", filled: Number.isFinite(mrp) && mrp > 0 },
    { id: "stock", label: "Stock", group: "core", filled: Number.isFinite(stock) && stock >= 0 },
    { id: "image", label: "Primary image", group: "core", filled: hasImage },
    { id: "colour", label: "Colour", group: "presentation", filled: Boolean(specs.colour) },
    { id: "fabric", label: "Fabric / Material", group: "presentation", filled: Boolean(specs.fabric) },
    { id: "work", label: "Work / Design", group: "presentation", filled: workOrPattern },
    { id: "pattern", label: "Pattern", group: "presentation", filled: Boolean(specs.pattern) },
    { id: "occasion", label: "Occasion", group: "presentation", filled: Boolean(specs.occasion) },
    { id: "includes", label: "Includes", group: "presentation", filled: Boolean(specs.includes) },
    { id: "care", label: "Care instructions", group: "presentation", filled: Boolean(specs.care) },
    {
      id: "short_description",
      label: "Short description",
      group: "presentation",
      filled: hasText(input.short_description),
    },
  ];

  // Weight core fields 2× so publishable essentials dominate the score.
  let weight = 0;
  let earned = 0;
  for (const item of items) {
    const w = item.group === "core" ? 2 : 1;
    weight += w;
    if (item.filled) earned += w;
  }
  const percent = weight ? Math.round((earned / weight) * 100) : 0;
  const missing = items.filter((i) => !i.filled);

  const tips: string[] = [];
  if (hasText(input.name) && isSkuLikeProductName(String(input.name))) {
    tips.push(
      "Title looks like an internal code. Add colour / fabric / work so the storefront can build a customer-facing title.",
    );
  }
  if (!specs.colour && !specs.fabric && !workOrPattern) {
    tips.push("Customer-facing title needs at least one of: colour, fabric, or work/pattern (only when known).");
  }
  if (!specs.care) {
    tips.push("Add care instructions when known (e.g. dry clean only). Leave blank if unknown.");
  }

  return { percent, items, missing, tips };
}

/** Factual description guidance — no hype vocabulary. */
export const DESCRIPTION_GUIDANCE = {
  short:
    "Keep it factual: colour + material + work/design + product type when those facts are known. Example: “Turquoise silk zari saree with matching blouse.”",
  detailed:
    "Describe only verified details (colour, fabric, work, what’s included, occasion). Avoid unsupported words such as premium, luxury, pure, handcrafted, finest, or exclusive.",
};
