# Content brief — How to read AKM Care saree length

Status: **brief only**. Do not publish a blog until a merchandiser confirms the metres on live SKUs and the “APX” wording.

This is the first authority topic because the catalog already stores length (`dimensions` / `specifications.size`) on most sarees. Other roadmap ideas (price vs MRP, zari, wedding) need more confirmed fields.

---

## Intent

Shoppers comparing 5.5 m vs 6 m+ drapes, searching “saree length” or “6.3 metre saree”.

## Live SKUs that already show a length (do not invent others)

| Slug | Catalog length |
| --- | --- |
| `akmc-turquoise-zari` | 6.3 Mtrs APX |
| `akmc-dpb-lta` | 6.3 Mtrs APX |
| `akmc-mte-mmle` | 6.3 Mtrs APX |
| `akmc-rooh-0002` | 6.2 Mtrs APX |
| `akm-rfx-mcmd` | 6 Mtrs APX |
| `top-dyed-veving-saree-with-unstiched-blouse` | 6 Mtrs APX |
| `akmc-wsomf-maer` | 6.50 Mtrs APX |
| `tul-tilak-wedding-silk-saree-with-unstitched-blouse` | 6 Mtrs APX |
| `akmc-ralrajs-madr` | 6 Mtrs APX |
| `akmc-sani-1007` | missing in live row (seed had 6.2 Mtrs APX — confirm before citing) |

## Facts the article may use

- Length on AKM Care is the catalog `dimensions` (or `specifications.size`) value, usually written as metres approximate (`Mtrs APX`).
- Shoppers should open the product page; the number is SKU-specific.
- Orders ship pan-India; shipping windows follow `src/lib/ecommerce/shippingPolicy.ts` unless the SKU has its own `shipping_time`.
- Link to `/shop?category=sarees` and the SKUs above after category slugs are corrected for `apparel` rows.

## Facts the article must not use

- A generic “standard Indian saree is 5.5 metres” unless a merchandiser signs that sentence.
- Fabric, origin, or blouse piece length unless those specification fields are filled.
- Rankings, “best saree”, or review scores.

## Outline (when approved)

1. What “Mtrs APX” means on this catalog.
2. Table of current live lengths (query at publish time — do not freeze stale metres).
3. How to check the value on a PDP.
4. Link to shipping/returns for delivery, not length.

## Owner

Merchandiser + whoever updates Admin product dimensions. Engineering should not generate the page from this brief.
