/**
 * Publish vs draft validation for Admin product form.
 * Drafts may be incomplete; publish requires shop-ready fields.
 */

export type PublishableProductFields = {
  name?: string | null;
  category?: string | null;
  selling_price?: number | null;
  akm_care_price?: number | null;
  price?: number | null;
  mrp?: number | null;
  stock_quantity?: number | null;
  images?: string[];
};

export function getPublishBlockers(fields: PublishableProductFields): string[] {
  const blockers: string[] = [];
  if (!String(fields.name || "").trim()) blockers.push("Enter a product title.");
  if (!String(fields.category || "").trim()) blockers.push("Select a category.");

  const selling = Number(fields.selling_price ?? fields.akm_care_price ?? fields.price ?? NaN);
  const akm = Number(fields.akm_care_price ?? fields.price ?? NaN);
  const mrp = Number(fields.mrp ?? NaN);
  const stock = Number(fields.stock_quantity ?? NaN);
  const price = Number.isFinite(akm) ? akm : selling;

  if (!Number.isFinite(price) || price < 0) blockers.push("Enter a valid selling price.");
  else if (price === 0) blockers.push("Enter a valid selling price.");

  if (!Number.isFinite(stock) || stock < 0) blockers.push("Enter stock.");

  if (Number.isFinite(mrp) && mrp > 0) {
    if (Number.isFinite(selling) && selling > mrp) blockers.push("Selling price cannot exceed MRP.");
    if (Number.isFinite(akm) && akm > mrp) blockers.push("AKM Care price cannot exceed MRP.");
  }

  if (!fields.images?.length) blockers.push("Add a primary image.");

  return blockers;
}

/** Minimum fields for saving a draft (never invent catalog data). */
export function getDraftBlockers(fields: Pick<PublishableProductFields, "name">): string[] {
  if (!String(fields.name || "").trim()) return ["Enter a product title to save a draft."];
  return [];
}
