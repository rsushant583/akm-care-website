import type { CatalogProduct } from "@/lib/ecommerce/types";
import { getProductDetailRows } from "@/lib/ecommerce/productPresentation";
import { Link } from "react-router-dom";

/**
 * Structured product attributes — shows only rows with real values.
 */
export function ProductAttributeDetails({ product }: { product: CatalogProduct }) {
  const rows = getProductDetailRows(product);

  if (rows.length === 0) {
    return (
      <div>
        <h2 className="type-section mb-4">Product details</h2>
        <p className="text-sm text-[#6B6B6B]">
          Detailed attributes will appear here as colour, fabric, work and care information is added.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="type-section mb-4">Product details</h2>
      <dl className="rounded-2xl border border-black/[0.06] divide-y divide-black/[0.06] text-sm">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-[#6B6B6B] shrink-0">{label}</dt>
            <dd className="font-medium text-[#1A1A1A] text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ProductHighlights({
  shippingLabel,
  returnLabel,
}: {
  shippingLabel?: string | null;
  returnLabel?: string | null;
}) {
  const items = [
    shippingLabel ? "Pan-India delivery" : null,
    returnLabel ? "Easy returns" : null,
    "Secure payment",
    "Genuine products",
  ].filter(Boolean) as string[];

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] sm:text-xs text-[#6B6B6B]">
      {items.map((label) => (
        <li key={label} className="rounded-lg border border-black/[0.06] px-2.5 py-2 text-center font-medium">
          {label}
        </li>
      ))}
    </ul>
  );
}

export function ProductShippingReturnsLink() {
  return (
    <p className="text-sm text-[#6B6B6B]">
      Full delivery and return details:{" "}
      <Link to="/shipping-returns" className="text-[#E8621A] font-semibold hover:underline">
        Shipping &amp; Returns
      </Link>
    </p>
  );
}
