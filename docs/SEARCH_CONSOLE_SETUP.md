# Search Console setup — AKM Care

Property to verify: **https://www.akmcare.in** (www is canonical; apex `akmcare.in` must 308 here).

Sitemap to submit: **https://www.akmcare.in/sitemap.xml**

This site is a Vite SPA. Verification **meta tags** are emitted by `src/components/SEO.tsx` when the corresponding Vite env vars are set at **build** time. Tokens are public HTML meta values, not API secrets — still do not commit them if your process treats `.env` as private.

---

## Environment variables

| Variable | Meta tag | Where it belongs |
| --- | --- | --- |
| `VITE_GOOGLE_SITE_VERIFICATION` | `<meta name="google-site-verification" content="…">` | Vercel Project → Settings → Environment Variables → Production (and Preview if you verify preview hosts). Also optional in local `.env` for `npm run build`. |
| `VITE_BING_SITE_VERIFICATION` | `<meta name="msvalidate.01" content="…">` | Same as above. |

Do **not**:

- Hardcode tokens in `index.html` or source
- Prefix these with a non-`VITE_` name (the browser bundle would not see them)
- Put service-role keys or private API keys in these variables

Templates are in `.env.example`.

After changing env vars, **redeploy** so `npm run build` inlines the values.

---

## Vercel project settings (required)

Dashboard → Project → Settings → General / Build & Development, **or** rely on `vercel.json`:

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js | `20.x` (see `.nvmrc`) |

Do **not** leave Build Command as `vite build`. That skips sitemap generation, HTML shells, and `verify-seo-dist`.

### Required env (build + runtime)

| Name | Why |
| --- | --- |
| `VITE_SUPABASE_URL` | Browser catalog + Edge middleware product 404s |
| `VITE_SUPABASE_ANON_KEY` | Same |

Middleware also accepts `SUPABASE_URL` / `SUPABASE_ANON_KEY`. If these are missing or Supabase errors, middleware **fails open** (HTTP 200) so the shop stays up; invalid products then depend on the client empty state (`noindex`).

### Optional env

| Name | Why |
| --- | --- |
| `VITE_GOOGLE_SITE_VERIFICATION` | Search Console HTML tag |
| `VITE_BING_SITE_VERIFICATION` | Bing HTML tag |
| `VITE_SITE_URL` | Canonical origin override (default www) |
| `VITE_GA4_MEASUREMENT_ID` / `VITE_GA4_ENABLED` | Storefront analytics |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Sitemap product query at **build** (anon key also works) |

### Domain redirects

In Vercel Domains: canonical host `www.akmcare.in`. Turn **off** any Dashboard “Redirect to www” that uses **307** if it overrides project redirects. `vercel.json` issues **308** from `akmcare.in` → `https://www.akmcare.in`. HTTP→HTTPS is platform TLS. There must be **no chain** (apex 307 then another hop).

---

## Production checklist (after this repo is deployed)

1. Deploy latest build (`npm run build` on Vercel).
2. Verify production HTML: View Source on `/`, `/shop`, `/faq`, `/shipping-returns`, a live PDP — unique `<title>`, description, canonical **before** hydration.
3. Verify 404: `/random-invalid-url` and `/shop/product/nonexistent-product` return **HTTP 404**, `noindex`, no homepage canonical.
4. Verify robots: `https://www.akmcare.in/robots.txt` is `text/plain`, 200, Sitemap line present.
5. Verify sitemap: `https://www.akmcare.in/sitemap.xml` is XML, includes legal pages + 6 categories + live products.
6. Verify canonicals: official `/shop?category=sarees` self-canonical; unknown `?category=` noindex → `/shop`.
7. Verify Product JSON-LD in **raw** PDP HTML (`application/ld+json` + `"@type":"Product"`).
8. Verify OG: `https://www.akmcare.in/og-image.jpg` is `image/jpeg`, not HTML.
9. Verify llms.txt: `https://www.akmcare.in/llms.txt` is `text/plain`, not HTML.
10. Add Google Search Console (steps below).
11. Add Bing Webmaster Tools (steps below).
12. Submit sitemap `https://www.akmcare.in/sitemap.xml`.
13. Inspect important URLs (`/`, `/shop`, one PDP, one official category, one 404).

Local `vite preview` will **not** run Vercel middleware; 404 status is production-only.

---

## Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add property → URL prefix → `https://www.akmcare.in`.
3. Choose **HTML tag** verification. Copy the `content=` token only.
4. Set `VITE_GOOGLE_SITE_VERIFICATION` on Vercel to that token.
5. Redeploy production (`npm run build`).
6. Confirm the homepage HTML contains `google-site-verification`.
7. Click Verify.
8. Sitemaps → add `https://www.akmcare.in/sitemap.xml`.
9. Optional: also add the Domain property for `akmcare.in` (DNS TXT) so both apex and www are covered. The URL-prefix www property is enough for this storefront.

---

## Bing Webmaster Tools

1. Open [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Add `https://www.akmcare.in`.
3. Use the **meta tag** (`msvalidate.01`) method.
4. Set `VITE_BING_SITE_VERIFICATION` to the token.
5. Redeploy and verify.
6. Submit the same sitemap URL.

Bing can also import from a verified Google Search Console account.

---

## URL inspection (after verify)

| URL | Expect |
| --- | --- |
| `https://www.akmcare.in/` | 200, indexable, canonical self |
| `https://www.akmcare.in/shop` | 200, indexable |
| `https://www.akmcare.in/shop?category=sarees` | 200, indexable, category title + CollectionPage in first HTML |
| A live product from the sitemap | 200, Product JSON-LD in raw HTML |
| `https://www.akmcare.in/shop/product/nonexistent-product` | **404** |
| `https://www.akmcare.in/random-invalid-url` | **404** |
| `https://www.akmcare.in/cart` | 200, `noindex` |
| `https://www.akmcare.in/llms.txt` | 200, `text/plain` |
| `https://www.akmcare.in/og-image.jpg` | 200, `image/jpeg` |

Use “Request indexing” only on canonical, 200, indexable URLs.

## Indexing monitoring

- Coverage / Pages: watch **Soft 404** and **Duplicate without user-selected canonical**.
- Confirm `/cart`, `/checkout`, `/account`, `/admin` stay **Excluded** (noindex or robots Disallow).
- After each catalog import, rebuild so `sitemap.xml` drops deleted SKUs.

## Performance / Core Web Vitals

- Field data: Search Console → Experience → Core Web Vitals (CrUX, 28-day).
- Lab: Lighthouse on Home, Shop, one PDP. Do not strip GSAP/Lenis unless INP/LCP regressions are proven.
- Storefront JS: React/router/supabase split; GSAP and Lenis in their own chunks; AdminRoutes remains `React.lazy`. Image transforms stay **off** (`VITE_SUPABASE_IMAGE_TRANSFORMS`) while the render endpoint returns 403.
