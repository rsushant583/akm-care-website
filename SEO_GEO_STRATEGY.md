# AKM Care — SEO & GEO Strategy

Living document for [www.akmcare.in](https://www.akmcare.in). Facts below come from the storefront and catalog only. Nothing here is invented for ranking.

Related:

- [AI search query map](docs/AI_SEARCH_QUERY_MAP.md)
- [GEO authority strategy](docs/GEO_AUTHORITY_STRATEGY.md)
- [Search Console setup](docs/SEARCH_CONSOLE_SETUP.md)

---

## Production verification (21 Aug 2026)

Live host still runs an **older build** than this repo:

- Raw HTML for `/`, `/shop`, PDPs, `/cart`, and unknown URLs is the same ~2 KB homepage shell (title only; **no canonical, robots, description, or JSON-LD** in the first response).
- HTTP **200** for `/shop/product/nonexistent-product` and `/random-invalid-url`. Client 404 UI exists (`Oops! Page not found`) but **HTTP status is 200** and Helmet `noindex` is missing on that UI.
- `/llms.txt` and `/og-image.jpg` return **HTML** (rewrite), not the files in `public/`.
- Hydrated JS: homepage gets canonical + Organization schema; **cart** gets `noindex`; PDPs/categories get unique **H1s and product facts** but keep the homepage `<title>` and **no Product JSON-LD**.
- Sitemap has **31** URLs (missing `/privacy`, `/terms`, `/shipping-returns` that this repo adds). All 31 return 200 (soft-404 risk on none of them because they are real routes except they share homepage static meta).
- Apex `akmcare.in` → www is **307**, not 301/308.
- GA4 `G-3MWZT8N432` loads on the storefront. Main JS ~634 KB.

**Fix in this repo (deploy with `npm run build`, never `vite build`):** `vercel.json` now sets `buildCommand`, unique HTML shells including official category files served by middleware, `public/404.html`, import-free `middleware.js` 404s, Product JSON-LD, category intros, robots/llms/og-image, sitemap legal URLs. `scripts/verify-seo-dist.mjs` fails the build if those artifacts are missing.

---

## Implemented

- Unique titles/descriptions via `react-helmet-async` (`src/components/SEO.tsx`, `src/data/seoPages.ts`).
- Canonical brand entity in `src/lib/config/brand.ts` (NAP, YouTube, Facebook only).
- Organization + WebSite JSON-LD; Product + Offer; BreadcrumbList; CollectionPage/ItemList; FAQPage; MerchantReturnPolicy when 7-day return copy exists.
- Product URLs `/shop/product/:slug`; category URLs `/shop?category={slug}` (unchanged).
- Build-time sitemap from Supabase (`scripts/generate-sitemap.mjs`) and HTML shells (`scripts/inject-route-meta.mjs`).
- `public/robots.txt` and `public/llms.txt`.
- Apex `akmcare.in` → `https://www.akmcare.in` 301; `trailingSlash: false`.
- Noindex: cart, checkout, wishlist, auth, account, admin, order-success, shop search, 404s, missing products.
- Ratings default of 4.5 removed from mapper/seed; AggregateRating only when `reviewCount > 0`.
- Legal/support pages: `/privacy`, `/terms`, `/shipping-returns`.
- Skip-to-content, product fact `<details>`, related-product category links.

## Fixed (second pass)

- **HTTP 404:** Vercel Edge `middleware.js` returns 404 HTML for unknown paths and for product slugs that are not in the public catalog. `dist/404.html` is generated at build (noindex, no homepage canonical, no JSON-LD). SPA catch-all rewrite is **kept** so client routing still works for `/cart`, `/checkout`, `/admin`, etc.
- **Canonical fallback:** `SEO` no longer silently canonicalizes forgotten pages to the homepage.
- **Unknown `?category=`:** `noindex` + canonical `/shop` (not homepage). Known categories keep self-canonical `/shop?category={slug}`.
- **Category intros:** unique H1 + title + description + short factual intro + CollectionPage (not title + cards only).
- **Product JSON-LD:** `color` when catalog colours exist; `material` and extra `additionalProperty` only from real `specifications`.
- **Catalog mapper:** maps `specifications` jsonb when keys/values are meaningful.
- **Sitemap:** excludes `draft` **and** `archived`; skips invalid slugs; skips placeholder/data image URLs; de-duplicates locs. Products still come from the live catalog on each build (deleted/archived drop; new public SKUs appear).
- **Share image:** default OG/Twitter image is `/og-image.jpg`.
- **About + FAQ:** factual “what AKM Care is” copy and internal links to shop / services / shipping.
- **Robots:** public Allow for `User-agent: *` (Googlebot, Bingbot, OAI-SearchBot, PerplexityBot inherit this). No per-bot ranking theater. Sitemap line present.

## Still Missing

- A photographer-designed OG (current 1200×630 file is the real brand logo on beige; no slogans).
- Street address, GSTIN, Instagram, Pinterest, Google Business Profile — not published; not added to schema.
- Buying guides — brief only (`docs/CONTENT_BRIEFS/saree-length.md`); do not auto-write articles.
- HTTP 404 on **local** `vite preview` (middleware is Vercel-only).
- Search Console / Bing tokens until `VITE_GOOGLE_SITE_VERIFICATION` / `VITE_BING_SITE_VERIFICATION` are set on Vercel.
- Official category slugs on several live SKUs still stored as `apparel` (see `docs/PRODUCT_DATA_COMPLETENESS.md`).

---

## Technical SEO

| Topic | Production behaviour |
| --- | --- |
| Host | Canonical `https://www.akmcare.in`. Apex **308**. |
| Trailing slash | Off. |
| Valid pages | Filesystem HTML shells where prerendered; otherwise SPA `index.html` via rewrite. HTTP **200**. |
| Unknown paths | Middleware → `404.html`, HTTP **404**, `noindex`, no canonical. |
| Missing products | Middleware checks Supabase `products` (`status` not in draft/archived). HTTP **404** when the slug is absent. **Fail-open** if Supabase is down (200 + client noindex empty state) so the shop does not break. |
| New products after last build | No HTML shell yet; rewrite + middleware existence check still serve the SPA if the slug exists (200). Next `npm run build` adds sitemap + shell. |
| `/admin`, `/cart`, `/checkout` | Known SPA routes: HTTP **200**, robots noindex. Not fake-404. |
| `/shop?category=` | Official six categories: indexable, unique canonical. Unknown slug: 200 + noindex + canonical `/shop`. |
| `/shop?q=` | noindex; robots Disallow query; canonical `/shop`. |

### How HTTP status handling works

1. Vercel `rewrites` still send unmatched routes to `/index.html` so React Router can render `/cart`, `/checkout`, `/admin/*`, and new product slugs.
2. Edge `middleware.js` runs first on extension-less paths.
3. Allowlist: static public paths from `scripts/seo-config.mjs` + SPA prefixes (`/cart`, `/checkout`, `/wishlist`, `/auth`, `/account`, `/admin`, `/order-success`) + `/shop/product/:slug`.
4. Anything else (e.g. `/random-invalid-url`) returns **404**.
5. `/shop/product/:slug` with a non-matching or extra path segment returns **404**.
6. Matching slug is queried with the anon key; empty result → **404**; network/env failure → continue (200).
7. 404 body is `404.html` (noindex, no canonical to home). Invalid URLs are **not** redirected or canonicalized to `/`.

---

## Ecommerce SEO

- PDP H1 = product name; price, stock, brand, category, dimensions, colours, variants, shipping, returns when present.
- Specifications table includes mapped jsonb keys (no invented fabric/origin).
- Related products + category/shop links.
- Categories: unique title, H1, meta, intro, listing, breadcrumbs, ItemList.
- Do not index thin search or unknown category URLs.

---

## Structured Data

| Type | Where | Guardrails |
| --- | --- | --- |
| Organization | Home / `index.html` | City-only address; `sameAs` YouTube + Facebook only |
| WebSite + SearchAction | Home | `/shop?q={search_term_string}` |
| Product + Brand + Offer | PDP + prerender shells | sku/productID/color/material/rating only if real |
| AggregateRating | PDP | `reviewCount > 0` |
| BreadcrumbList | Shop, PDP, content pages | Absolute item URLs |
| CollectionPage / ItemList | Indexable shop/category views | Omitted for search / unknown category |
| FAQPage | FAQ, shipping, product fact Q&A | Answers from catalog/policy |
| MerchantReturnPolicy | Offer | Only if return copy matches a 7-day window |

Never emit GTIN/MPN/reviews/certifications that are not in data.

---

## GEO

Treat GEO as **clarity for retrieval**, not “rank in ChatGPT”.

Answered on-site from real data:

- What is AKM Care? → `/faq`, `/about`, `llms.txt`
- What it sells → `/shop` + category intros
- Where → Ahmedabad, Gujarat (`/contact`)
- Shipping / returns → `/shipping-returns`
- Contact → email, phone, WhatsApp
- Product differences → PDP fields only

`public/llms.txt` is a factual summary, not a ranking hack.

---

## Entity SEO

Single source: `src/lib/config/brand.ts`. Footer, schema, llms.txt, and legal pages reuse it.

Mixed entity (fashion shop + industrial services) is stated plainly. Do not pretend the site is only sarees.

---

## Content Strategy

No mass blogs. Write a guide only when several live SKUs and merchandiser facts exist. See the opportunity list in `docs/AI_SEARCH_QUERY_MAP.md`.

---

## AI Search Strategy

Query → page map is in `docs/AI_SEARCH_QUERY_MAP.md`. No AI rankings were tested. Prefer complete product data over new URLs.

---

## External Authority

`docs/GEO_AUTHORITY_STRATEGY.md` — genuine reviews, real profiles, local/trade mentions. No PBNs, fake reviews, or paid spam links.

---

## Performance

- Do not strip GSAP/Lenis/premium motion for theoretical Lighthouse gains.
- PDP main image is eager / high priority.
- Admin routes stay lazy-loaded.
- Google fonts still load from Google; `preconnect` is in `index.html`.
- Image transforms stay off until the render endpoint returns 200.
- Main bundle size remains a follow-up engineering project, not an SEO-copy project.

---

## Deployment Checklist

1. Set production env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (middleware product 404s need these at **runtime** on Vercel, not only at build).
2. Optional: `VITE_GOOGLE_SITE_VERIFICATION`, `VITE_BING_SITE_VERIFICATION` then redeploy.
3. `npm run build` regenerates `public/sitemap.xml`, prerender manifest, HTML shells, `dist/404.html`.
4. Confirm `https://www.akmcare.in/robots.txt` includes `Sitemap: https://www.akmcare.in/sitemap.xml`.
5. Confirm `https://www.akmcare.in/og-image.jpg` and `/logo.jpeg` return 200.
6. After deploy, HEAD-check: `/` `/shop` `/shop/product/{valid}` → 200; `/shop/product/nonexistent-product` `/random-invalid-url` → 404; `/cart` `/checkout` `/admin` → 200.

---

## Monitoring Checklist

1. Search Console + Bing: property `https://www.akmcare.in`, submit sitemap.
2. Coverage: unknown URLs should move from 200 to 404 after this deploy.
3. Confirm `/cart`, `/checkout`, `/account` stay excluded; `/shop?q=` stays noindex.
4. Rich Results test on one PDP and `/shipping-returns`.
5. Recrawl after catalog imports (sitemap is build-time, not a live endpoint).
6. Core Web Vitals in CrUX/GSC. Do not strip animations unless INP/LCP regressions are proven.
7. Quarterly: footer NAP still matches `brand.ts`.

---

## How to rebuild SEO artifacts

```bash
npm test
npm run build
# generate-sitemap.mjs → public/sitemap.xml
# vite build
# inject-route-meta.mjs → dist/{path}/index.html + dist/404.html
```
