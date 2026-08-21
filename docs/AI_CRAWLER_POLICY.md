# AI / search crawler policy — AKM Care

Public catalog and brand facts should remain crawlable. Private and transactional surfaces must not be indexed.

Canonical host: https://www.akmcare.in  
Robots file: `public/robots.txt`

---

## Public (Allow)

Under `User-agent: *`:

- Home, About, Services, Training, Shop, category query URLs, product PDPs  
- FAQ, Contact, Shipping & Returns, Privacy, Terms, Guides  
- Media, CSR, Careers (public pages)  
- `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/og-image.jpg`, logo  

Legitimate search and AI search crawlers (Googlebot, Bingbot, OAI-SearchBot, PerplexityBot, etc.) inherit this policy. We do **not** add per-bot Allow theater.

`/llms.txt` is a factual brand summary for machines and humans. It is **not** a ranking mechanism.

---

## Disallow (must stay blocked)

| Path | Reason |
| --- | --- |
| `/admin`, `/admin/` | Internal ops |
| `/auth`, `/account` | Private sessions |
| `/cart`, `/checkout`, `/wishlist`, `/order-success` | Transactional / noindex |
| `/api/`, `/.env` | Secrets / APIs |
| `/seo-category` | Internal prerender files; public URL is `/shop?category=` |
| `/shop?q=`, `?search=`, `?query=` | Thin search SERPs |

Pages also send `noindex` via Helmet where appropriate (cart, checkout, auth, unknown categories, 404).

---

## Sensitive data — never expose to crawlers

- Customer PII, order tokens, payment signatures  
- Service-role keys, Razorpay secrets  
- Admin analytics beyond public marketing  
- Draft / archived products (excluded from sitemap and middleware public product check)

---

## What allowing a crawler does **not** mean

- Guaranteed Google ranking  
- Guaranteed ChatGPT / Claude / Gemini / Grok / Perplexity citation  
- Permission to scrape private APIs  

AI answers are dynamic; track them in `docs/AI_VISIBILITY_TRACKER.md`.

---

## Change control

Update `public/robots.txt` and rebuild (`npm run build`) so `dist/robots.txt` matches. Middleware must continue to fail-open for the storefront if Supabase is down, while still 404ing confirmed missing products when Supabase answers.
