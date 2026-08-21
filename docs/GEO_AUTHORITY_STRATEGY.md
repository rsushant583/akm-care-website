# GEO authority strategy — AKM Care

Practical roadmap for **real** mentions that search engines and AI systems can cite. Not a backlink scheme.

**Primary authority playbook:** [AUTHORITY_BUILDING.md](./AUTHORITY_BUILDING.md)

Production: [https://www.akmcare.in](https://www.akmcare.in)  
Entity source of truth: `src/lib/config/brand.ts` · [BRAND_ENTITY.md](./BRAND_ENTITY.md)

No AI rankings were measured. Do not claim ChatGPT/Gemini/Perplexity visibility.

---

## What “authority” means here

Retrieval systems prefer sources that:

1. Agree (same NAP, same product facts).
2. Attach to a real organization (profiles, invoices, customers, press).
3. Are not mass-produced SEO text.

On-site technical SEO makes pages crawlable. Off-site authority makes the brand believable.

---

## Current on-site GEO (production, Aug 2026)

| Question | Best page | Production answer quality |
| --- | --- | --- |
| What is AKM Care? | `/about`, `/faq` (after deploy: FAQ item exists in repo) | Home/about explain fashion + services; FAQ on live site is still services-heavy |
| What does it sell? | `/shop` + six `?category=` URLs | Categories list real products; titles in **raw HTML** still look like the homepage until the latest build is deployed |
| Where is it? | `/contact` | Ahmedabad, Gujarat — no street |
| Shipping / returns | `/shipping-returns` in repo; live PDP return copy is 7-day unused | Align PDP “within 24 Hours” shipping fields with the policy page |
| Contact | `/contact`, footer | Phone, email, WhatsApp match `brand.ts` |
| Product differences | PDPs | Strong **visible** facts (price, SKU, colour, length); **JSON-LD/title not unique in the live HTML** until deploy |

External authority today: YouTube `@akmcare1309`, one Facebook share URL in `brand.ts`. No Instagram/Pinterest/GBP linked. Do not add them until they exist.

---

## 30 / 60 / 90 day plan

### Days 1–30 — make the live site citeable

1. **Deploy** the current repo (`npm run build` on Vercel) so unique titles, Product JSON-LD, `llms.txt`, `og-image.jpg`, sitemap legal URLs, and HTTP 404s go live.
2. Set `VITE_GOOGLE_SITE_VERIFICATION` and `VITE_BING_SITE_VERIFICATION`; submit `https://www.akmcare.in/sitemap.xml` (see `docs/SEARCH_CONSOLE_SETUP.md`).
3. Fill **fabric / colour / length / care** on the ~11 live SKUs in admin. That is higher leverage than new URLs.
4. After each fulfilled order, send a **real** review request (email/WhatsApp). Store reviews in the catalog so `reviewCount` can appear. Never seed stars.
5. Confirm Google Business Profile **only if** the business has a verifiable presence; NAP must match `brand.ts`. No fake storefront pin.

### Days 31–60 — one honest public trail

6. YouTube: one product-accurate reel or unboxing that links the **exact** `/shop/product/{slug}`. Use the official channel only.
7. Facebook: keep the official share URL; if CSR uses a second share link, confirm it is the same brand account.
8. One local/trade mention (Ahmedabad business or textile/fashion desk, or industrial-training press for the services line) with facts a journalist can check.
9. Optional Instagram **after** the handle is owned. Then add it once to `BRAND.social` and `sameAs`.

### Days 61–90 — collaborations, not directories spam

10. 1–3 fashion creators who actually received a product. Disclose gifting. Link the live PDP.
11. Pinterest only if you will maintain boards of **your** product photos (owned files, not scraped).
12. IndiaMART / Justdial **only** for the industrial-services line if listings already exist and NAP matches.
13. Publish at most **one** of the guides in `docs/CONTENT_AUTHORITY_ROADMAP.md` (length, stitched vs unstitched, or shipping/returns clarity).

---

## Channel notes (legitimate only)

| Channel | Use if | Do not |
| --- | --- | --- |
| Customer reviews | Buyer actually ordered | Buy review packages, fake screenshots |
| YouTube | Official `@akmcare1309` | Fake subscriber campaigns |
| Instagram | Account is owned | Add a URL to schema first |
| Fashion / local press | One factual story | Fabricated press releases |
| Creators | Real product in hand | Paid fake testimonials |
| Directories | NAP matches, listing is real | Reciprocal spam directories |
| Communities | Disclose affiliation | Automated forum spam |

---

## Out of scope

Paid spam backlinks, PBNs, mass AI guest posts, fake citations, cloaking, invented GSTIN/street/founder bios.

---

## Entity consistency checklist

| Field | Canonical value |
| --- | --- |
| Name | AKM Care |
| Site | https://www.akmcare.in |
| Email | contact@akmcare.in |
| Phone | +91-84019 95486 |
| WhatsApp | https://wa.me/918401995486 |
| Place | Ahmedabad, Gujarat, India |
| YouTube | https://www.youtube.com/@akmcare1309 |
| Facebook | https://www.facebook.com/share/1Jjs7ipP1x/ |

When a new official profile is created, add it in **one** place (`brand.ts`) then footer, schema, `llms.txt`.

**Known source duplication (values match, except verify CSR Facebook):** footer and Contact should import `BRAND`. `src/pages/CSR.tsx` currently links a different Facebook share URL — confirm it is the same brand before putting it in `sameAs`.
