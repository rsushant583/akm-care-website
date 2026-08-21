# SEO / GEO keyword map — AKM Care

Do **not** chase high-volume head terms that do not match the catalog. Prefer queries a shopper or AI assistant would ask when looking for this brand’s real products and services.

Canonical host: https://www.akmcare.in  
Entity: `docs/BRAND_ENTITY.md`

---

## Brand

| Query intent | Example queries | Best URL |
| --- | --- | --- |
| Who / what | AKM Care, what is AKM Care, AKM Care Ahmedabad | `/about`, `/` |
| Contact | AKM Care contact, AKM Care phone, AKM Care WhatsApp | `/contact` |
| Shop brand | AKM Care products, AKM Care online shopping | `/shop` |
| Services brand | AKM Care training, AKM Care HR services | `/services`, `/training` |

---

## Product (use live slugs only)

| Intent | Example | Best URL |
| --- | --- | --- |
| Specific SKU | AKMC Turquoise Zari Silk Saree, AKMCTQZ | `/shop/product/akmc-turquoise-zari` |
| Price | turquoise zari saree price AKM Care | same PDP |
| Buy | buy AKMC Turquoise Zari online | same PDP |

Rebuild product rows from sitemap/admin after catalog changes. Do not invent SKUs.

---

## Category

| Intent | Example | Best URL |
| --- | --- | --- |
| Browse | sarees online AKM Care | `/shop?category=sarees` |
| Browse | ladies gown AKM Care | `/shop?category=ladies-gown` |
| Browse | stitched lehenga / unstitched lehenga | matching `?category=` |
| Browse | 3 piece suit salwar dupatta | `/shop?category=3-piece-suits` |
| Browse | men’s jeans AKM Care | `/shop?category=mens-jeans` |

Avoid targeting “best saree India” unless content can defend a factual comparison with catalog SKUs.

---

## Informational

| Intent | Example | Best URL |
| --- | --- | --- |
| Length | how to read saree length Mtrs APX AKM Care | `/guides/saree-length` |
| Shipping | AKM Care delivery time, AKM Care returns | `/shipping-returns` |
| FAQ | AKM Care FAQ | `/faq` |
| Price vs MRP | what is AKM Care price vs MRP | PDP + future guide (brief only until written) |

---

## Comparison

| Intent | Example | Status |
| --- | --- | --- |
| Stitched vs unstitched lehenga | only when both categories have live SKUs | Category pages first; guide later |
| Product A vs B | only with two real PDPs | Do not invent |

---

## Local

| Intent | Example | Best URL |
| --- | --- | --- |
| City brand | AKM Care Ahmedabad, AKM Care Gujarat | `/about`, `/contact` |
| Near me | AKM Care near me | Contact + GBP **only if** a real listing exists (see `AUTHORITY_BUILDING.md`) |

No street address is published — do not target storefront local pack claims without GBP.

---

## AI / GEO question bank (map to pages)

| Question | Answer page |
| --- | --- |
| Who is AKM Care? | `/about`, `/llms.txt` |
| What does AKM Care sell? | `/shop`, category URLs |
| Where can I buy AKM Care products? | `/shop`, PDPs |
| How long does shipping take? | `/shipping-returns`, PDP shipping |
| How do I return an order? | `/shipping-returns` |
| How do I read saree length on this site? | `/guides/saree-length` |

Track live AI answers in `docs/AI_VISIBILITY_TRACKER.md` — do not claim rankings from a single check.
