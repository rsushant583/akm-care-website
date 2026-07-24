# Ecommerce Catalog

Product data is imported from `data/imports/products.xlsx` (source: Pd Data.xlsx).

Catalog images live under `public/catalog/{slug}/01.png…` and are referenced only via the product `images[]` field — UI components never hardcode image paths.

## Seed products (Excel)

| Name | SKU | AKM Care Price | MRP | Qty |
|------|-----|----------------|-----|-----|
| AKMC SANI - 1007 | AKMCC90 | ₹468 | ₹546 | 8 |
| AKMC ROOH - 0002 | AKMCE95 | ₹714 | ₹833 | 6 |

To refresh TypeScript catalog after Excel changes, update `src/data/catalog/products.ts` or add an import script.
