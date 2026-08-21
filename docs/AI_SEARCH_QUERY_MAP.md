# AI search query map — AKM Care

Maps commercially relevant questions to pages on [www.akmcare.in](https://www.akmcare.in). Planning document, not a ranking report. **No AI-search positions were measured.**

Production check (21 Aug 2026): crawlers currently receive the **homepage HTML shell** for almost every URL. Unique H1s appear after JavaScript. Treat “current answer quality” as **visible after JS**, not as first-byte HTML, until this repo is deployed.

Intent key: **K**now = definition, **C**ommercial = browse/compare, **T**ransactional = buy, **S**upport = policy/contact.

Intent key: **K**now = definition, **C**ommercial = browse/compare, **T**ransactional = buy, **S**upport = policy/contact.

---

## BRAND

| Query | Intent | Relevant page | Current content gap | Recommended content | Authority gap |
| --- | --- | --- | --- | --- | --- |
| What is AKM Care? | K | `/about`, `/faq` | FAQ now answers this from published facts. About still leads with services; fashion is secondary. | Keep the factual FAQ. Optionally add a short “two businesses, one brand” block on About (already linked to Shop / Services). | Thin third-party mentions of the brand name. |
| AKM Care sarees | C | `/shop?category=sarees` | Category has unique title, intro, listing, CollectionPage. Catalog size is the limiter, not copy. | Do not invent a “best sarees” article. Keep product data complete (length, colour, images). | Few independent reviews of the shop. |
| AKM Care reviews | C / K | `/faq`, product pages | Ratings/reviews are shown **only** when real `reviewCount` exists. Most PDPs will have none. | Collect genuine customer reviews in the catalog. Never seed fake stars. | No independent review sites citing the shop yet. |
| AKM Care products | C | `/shop` | Shop intro states the five official categories. | Keep merchandising rails honest (featured / new / bestseller flags from catalog). | Brand + product association is mostly on-site. |
| AKM Care Ahmedabad | K | `/contact`, `/about` | City and region are published. No street address or GSTIN on the site. | Do not add a LocalBusiness street until the business publishes one. | Google Business Profile not linked from the site (do not invent a listing). |
| AKM Care contact | S | `/contact` | Phone, email, WhatsApp are in `brand.ts` and schema. | Keep NAP consistent. | Call/WhatsApp citations elsewhere should match `+91-84019 95486`. |
| AKM Care industrial training | K / C | `/training`, `/services` | Strong existing service pages. Mixed entity (fashion + industrial) can confuse AI summaries. | Keep both lines factual on Home / About / `llms.txt`. | Training queries may outrank shop queries until catalog grows. |

---

## CATEGORY

Official indexable categories (do not create extra synonym URLs): `sarees`, `ladies-gown`, `stitched-lehenga`, `unstitched-lehenga`, `3-piece-suits`, `mens-jeans`.

| Query | Intent | Relevant page | Current content gap | Recommended content | Authority gap |
| --- | --- | --- | --- | --- | --- |
| best sarees for weddings | C | `/shop?category=sarees` plus matching PDPs | No occasion field is guaranteed on products. A “wedding saree” landing page would be thin unless products are tagged. | Only write a wedding guide if the catalog actually has wedding/festive attributes. Until then, rely on PDP facts. | Editorial fashion sites own this query. |
| best silk sarees | C | `/shop?category=sarees` | Fabric is **not** a first-class field unless `specifications.Fabric` / `Material` is filled. Do not title the category “silk sarees”. | Fill fabric on silk products in admin. Then schema `material` and the PDP Q&A can answer honestly. | Silk-saree SERPs are competitive; catalog completeness first. |
| sarees with zari | C | matching PDPs (e.g. names/descriptions that mention zari) | No `pattern` filter facet beyond search. Search URLs are `noindex`. | Use product names/descriptions that already contain zari when true. Optional tag `zari` if merchandisers use tags. | Needs more zari SKUs or a real tag, not a new URL. |
| ladies gown online | C | `/shop?category=ladies-gown` | Intro + listing exist. Size/colour only when on the product. | Complete gown size charts in catalog when known. | Low brand recognition vs marketplaces. |
| stitched lehenga online | C | `/shop?category=stitched-lehenga` | Same as other categories. | Distinguish stitched vs unstitched **only** via the two category URLs and product copy. | — |
| unstitched lehenga set | C | `/shop?category=unstitched-lehenga` | Do not invent “what’s in the set” unless specifications exist. | Add set contents in `specifications` when real. | — |
| 3 piece suit salwar dupatta | C | `/shop?category=3-piece-suits` | Category label already states salwar + dupatta. | Keep H1/title unique; avoid a duplicate `/shop/suits` path. | — |
| men’s jeans online India | C | `/shop?category=mens-jeans` | Size options only if variants exist. | Add waist/length variants in catalog when selling multiple sizes. | Marketplace incumbents. |

---

## PRODUCT / TRANSACTIONAL

| Query | Intent | Relevant page | Current content gap | Recommended content | Authority gap |
| --- | --- | --- | --- | --- | --- |
| `[product name]` AKM Care | T | `/shop/product/{slug}` | PDP answers price, stock, brand, category, shipping/returns when fields exist. Colour/material in JSON-LD only if real. | Keep admin SEO title/description optional; never auto-write filler. | Individual SKUs need unique images and specs. |
| buy saree online pan India | T | `/shop`, `/shipping-returns` | Shipping is pan-India; charges at checkout. | Keep `/shipping-returns` as the policy source of truth. | Trust signals: real reviews, accurate stock. |

---

## SUPPORT

| Query | Intent | Relevant page | Current content gap | Recommended content | Authority gap |
| --- | --- | --- | --- | --- | --- |
| Does AKM Care ship across India? | S | `/shipping-returns`, `/faq` | Answered: pan-India; 3–5 standard / 1–2 express typical; checkout confirms. | No extra pages. | — |
| AKM Care return policy | S | `/shipping-returns` | 7-day unused product, original packing. | Keep PDP return copy aligned with this page. | — |
| How much do AKM Care products cost? | C | `/shop` and PDPs | No site-wide price range is published (would go stale). | Do not hardcode a min–max in copy. Let live prices speak. | — |

---

## Opportunity list (do not auto-generate articles)

Only write a guide if a merchandiser can stand behind the facts and at least several live SKUs match:

1. How to read AKM Care saree length (use real `dimensions` values).
2. Stitched vs unstitched lehenga on this catalog (two categories, real product differences).
3. What “AKM Care price” vs MRP means at checkout.
4. Fabric/care notes **per SKU** via specifications (not a generic silk-care blog unless products are silk).
5. Vendor listing expectations (`/sell-your-product`).

Do not create location pages, synonym category URLs, or hundreds of AI blogs.
