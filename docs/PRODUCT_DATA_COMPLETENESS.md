# Product data completeness — live catalog

Snapshot from the `products` table (public, not draft/archived) on **21 Aug 2026**. Nothing below was invented. Empty or placeholder values are listed so merchandisers can fill them in **Admin → product form** or the original purchase/label paperwork.

JSON-LD already emits a field when a real value exists (`sku`, `color`, `material`, `additionalProperty` from `specifications`). Do not invent GTIN, MPN, ratings, origin, or care copy to “complete” schema.

Canonical columns: `products` + `specifications` jsonb. Mapper also copies `specifications.size` → dimensions, `specifications.packing` → packing type, and `specifications.variant` → a variant row when the dedicated arrays are empty.

---

## How to read this table

| Column | Meaning |
| --- | --- |
| Missing fields | Catalog fields that are null, empty, `NA`, or not useful (for example a colour named `"1"`) |
| Why they matter | Shopper questions, PDP specs, and Product JSON-LD |
| Recommended source | Where a human should copy the fact from — not AI |

`specifications.colours` on several SKUs is a **count** (e.g. `1` or `6`), not colour names. That cannot be mapped into schema `color`.

Several fashion SKUs use `category = apparel` instead of `sarees` / `ladies-gown`. Category pages and sitemap ItemLists then miss them until the official category slug is set in admin.

---

## Live SKUs

### AKMC Turquoise Zari Silk Saree (`akmc-turquoise-zari`)

| Missing fields | Why they matter | Recommended source |
| --- | --- | --- |
| `colors` array (empty; specs.colours = 1) | PDP swatches + schema `color` | Product photo / label; seed file already has Turquoise |
| `specifications.fabric` / `material` | Material schema and “what is it made of?” FAQ | Label / PO; name says silk zari but do not copy that into fabric until confirmed |
| Care instructions | Returns and wash questions | Care label on the garment |
| Occasion / pattern | Category landing copy | Merchandiser; only if already used internally |
| Weight | Shipping quotes / schema | Weigh a packed unit |

Present: SKU, 6.3 Mtrs APX, blouse Matching, variant Silk Zari, Box Packing, shipping window `within 24 Hours`.

### AKMC SANI - 1007 (`akmc-sani-1007`)

| Missing fields | Why they matter | Recommended source |
| --- | --- | --- |
| short_description, detailed_description | Title/meta fallback and PDP body | Import spreadsheet / hang tag |
| dimensions/length, packing_type, shipping_time, hsn | PDP facts; shipping currently falls back to store standard 3–5 business days | Same SKU’s older seed row (`6.2 Mtrs APX`, Polythene, HSN 540752) if still accurate |
| colors / variants arrays | Buyers cannot pick listed options | Seed file has colour names; confirm before copying |
| fabric, care, occasion, pattern | Schema + education pages | Label |

Present: blouse Unstitched, variant PRINT in specifications.

### AKMC ROOH - 0002 (`akmc-rooh-0002`)

| Missing fields | Why they matter | Recommended source |
| --- | --- | --- |
| colors / variants arrays | PDP options | Seed file has colour names if still sold that way |
| fabric, care, occasion, pattern, weight | Schema / care | Label |

Present: 6.2 Mtrs APX, blouse Unstitched, Polythene Packing, variant PRINT, shipping `within 24 Hours`.

### AKMC DPB - LTA (`akmc-dpb-lta`)

| Missing fields | Why they matter | Recommended source |
| --- | --- | --- |
| colors / variants arrays (specs.colours is a count of 6) | Named colours, not a count | Photo set / vendor shade card |
| fabric, care, occasion, pattern, weight | Schema / care | Label |

Present: 6.3 Mtrs APX, blouse Unstitched, Box Packing, variant TOP DYED WEAVING, shipping `Within 24 Hours`.

### AKMC MTE - MMLE (`akmc-mte-mmle`)

Same pattern as DPB-LTA: length, blouse Unstitched, Box Packing, variant in specs; missing named colours, fabric, care, occasion, pattern, weight.

### AKM RFX - MCMD (`akm-rfx-mcmd`)

Same pattern: 6 Mtrs APX, blouse Unstitched, Box Packing, variant in specs; missing named colours, fabric, care, occasion, pattern, weight.

### TOP DYED VEVING Saree with unstitched Blouse (`top-dyed-veving-saree-with-unstiched-blouse`)

| Missing fields | Why they matter | Recommended source |
| --- | --- | --- |
| Official category slug (`apparel` instead of `sarees`) | Saree collection page and sitemap ItemList | Admin category field |
| Useful colour/variant names (colour `"1"`, variant `"4"`) | Schema color must not emit `"1"` | Vendor colour card |
| specifications.blouse (name already says unstitched blouse) | Structured blouse fact | Confirm from packing list, then enter `blouse` in specifications |
| fabric, care, occasion, pattern, weight | Schema / care | Label |

Present: 6 Mtrs APX, Polythene Packing, shipping `within 24 Hours`.

### AKMC WSOMF - MAER (`akmc-wsomf-maer`)

| Missing fields | Why they matter | Recommended source |
| --- | --- | --- |
| detailed_description | PDP body | Vendor copy / photos |
| category `apparel` vs sarees | Collection pages | Admin |
| fabric, care, occasion, pattern, blouse spec, weight | Schema | Label |
| Useful colour names | Schema color | Shade card |

Present: 6.50 Mtrs APX, Polythene Packing, shipping `within 24 Hours`.

### TUL TILAK Wedding Silk Saree with unstitched Blouse (`tul-tilak-wedding-silk-saree-with-unstitched-blouse`)

| Missing fields | Why they matter | Recommended source |
| --- | --- | --- |
| category `apparel` vs sarees | Collection pages | Admin |
| specifications.fabric (name says silk — do not auto-copy) | Material schema | Label |
| blouse spec, care, occasion, pattern, weight | PDP + schema | Label / packing list |
| Useful colour names | Schema color | Shade card |

Present: 6 Mtrs APX, Polythene Packing, shipping `within 24 Hours`.

### RAL RAJRAJS VEVING Embroidery Saree (`akmc-ralrajs-madr`)

Same gaps as Tul Tilak: category `apparel`, no fabric/care/occasion/pattern/blouse spec/weight, weak colour names. Length 6 Mtrs APX is present.

### SILK EMBROIDERY LEHNGA GOWN (`silk-embroidery-gown-semi-stiched-in-light-gray-shade`)

| Missing fields | Why they matter | Recommended source |
| --- | --- | --- |
| Official category (`apparel` vs `ladies-gown` or stitched/unstitched lehenga) | The six official category URLs | Admin; name says lehenga gown / semi-stitched |
| fabric (name says silk — do not auto-copy), care, occasion, pattern, weight | Schema | Label |
| Useful colour name (page title says light gray) | Schema `color` | Confirm, then enter in `colors` |

Present: dimensions text “Free Size Semi Stitched Silk Embroidery Lehnga Gown”, Polythene Packing, shipping `within 24 Hours`.

---

## Fields that already exist in the model (do not add parallel columns)

Admin already has: SKU, product code, MRP / selling / AKM Care price, stock, GST %, HSN, shipping time, packing type, weight, dimensions, variants, sizes, colors, SEO title/description, specifications jsonb.

Enter fabric, care, occasion, pattern, and blouse as **specification keys** (`Fabric`, `Care`, `Occasion`, `Pattern`, `blouse`) rather than new database columns unless a migration is planned.

GSTIN on seed products must stay off Organization schema (it is a product-row tax field, not a published NAP fact).
