# AKM Care — SEO & GEO Strategy

Living document for [www.akmcare.in](https://www.akmcare.in). Facts below come from the storefront and catalog only. Nothing here is invented for ranking.

Related:

- [AI search query map](docs/AI_SEARCH_QUERY_MAP.md)
- [GEO keyword map](docs/SEO_GEO_KEYWORD_MAP.md)
- [Brand entity](docs/BRAND_ENTITY.md)
- [Authority building](docs/AUTHORITY_BUILDING.md)
- [AI crawler policy](docs/AI_CRAWLER_POLICY.md)
- [AI visibility tracker](docs/AI_VISIBILITY_TRACKER.md)
- [GEO authority strategy](docs/GEO_AUTHORITY_STRATEGY.md)
- [Search Console setup](docs/SEARCH_CONSOLE_SETUP.md)

---

## Phase 2 audit (21 Aug 2026) — before growth work

| Area | Status |
| --- | --- |
| SEO utils | `SEO.tsx`, `seoPages.ts`, `brand.ts`, `schemas.ts`, `ecommerce/seo.ts`, `shippingPolicy.ts`, `shopIndex.ts` |
| Sitemap / robots / llms | Build scripts + `public/` — do not rebuild; extend STATIC_PAGES only |
| Prerender / middleware | Intact; add new public paths to `seo-config` + `middleware.js` PUBLIC_PATHS |
| Product schema | Product+Offer from catalog; AggregateRating only if `reviewCount > 0` |
| FAQ / About / Contact | Exist; FAQ was CMS-heavy — storefront facts added |
| Blog | No blog CMS — use `/guides` for educational content |
| Analytics | GA4 present; GSC/Bing tokens optional env |
| Apex redirect | Code wants **308**; live Dashboard may still **307** — manual Vercel Domains fix |
| Razorpay verify Edge | Separate Supabase deploy — not part of frontend |

**Growth additions in this phase:** brand entity docs, `/guides` + saree-length guide, About answer-first facts, FAQ storefront block, PDP always-visible facts + guide links, keyword/authority/crawler/visibility docs.

---

## Production verification (21 Aug 2026)

Earlier live host ran an **older build**. After the crawlable-build deploy, raw HTML shells, Product JSON-LD, robots/llms/og-image, and HTTP 404s are expected when Vercel uses `npm run build`. Re-check apex 307 vs 308 in the Vercel Domains dashboard (not from frontend code alone).

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
- Buying guides — **published:** `/guides` and `/guides/saree-length` (catalog-accurate Mtrs APX explanation only). Further articles still need merchandiser confirmation (`docs/CONTENT_BRIEFS/`).
- HTTP 404 on **local** `vite preview` (middleware is Vercel-only).
- Search Console / Bing tokens until `VITE_GOOGLE_SITE_VERIFICATION` / `VITE_BING_SITE_VERIFICATION` are set on Vercel.
- Official category slugs on several live SKUs still stored as `apparel` (see `docs/PRODUCT_DATA_COMPLETENESS.md`).
- Apex host redirect may still be Dashboard **307** until Domains settings are cleaned (see `docs/AUTHORITY_BUILDING.md`).
- Google Business Profile — not managed from this repo.

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
