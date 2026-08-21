# Authority building — AKM Care

Legitimate mentions only. Not a backlink scheme. Companion to `docs/GEO_AUTHORITY_STRATEGY.md` and `docs/BRAND_ENTITY.md`.

Production: https://www.akmcare.in

---

## Principles

1. NAP and product facts must match `brand.ts` / BRAND_ENTITY.  
2. Prefer one accurate mention over ten spam listings.  
3. Disclose gifting and affiliations.  
4. Never buy reviews, PBN links, or mass AI guest posts.

---

## Current owned channels

| Channel | Status | Action |
| --- | --- | --- |
| Website | Live www | Keep sitemap + Product JSON-LD accurate |
| YouTube `@akmcare1309` | In `sameAs` | Product-accurate videos linking exact PDPs |
| Facebook share URL | In `sameAs` | Confirm CSR links are the same account before schema changes |
| Email / phone / WhatsApp | Published | Use consistently |

---

## Recommended opportunities (manual)

### High value

- Real post-purchase review requests (email/WhatsApp) stored in catalog when `reviewCount` can be true  
- One Ahmedabad / Gujarat business or textile mention with checkable facts  
- YouTube unboxing of a live SKU with `/shop/product/{slug}` in description  

### Medium

- Instagram **after** the handle is owned → then add once to `BRAND.social`  
- Fashion creators who received a real product (disclose)  
- Training/services line: IndiaMART / Justdial **only** if listing already exists and NAP matches  

### Local

**Google Business Profile** — only if AKM Care has a verifiable physical presence:

- Name: AKM Care  
- Categories: fashion retail and/or training (truthful primary)  
- Address / phone / website = BRAND_ENTITY  
- Hours, photos of real premises or products  
- Products linked to www PDPs  
- Q&A answered from `/faq` and `/shipping-returns`  
- Legitimate customer reviews only  

Do **not** create a fake pin. No code access to GBP from this repo.

---

## Explicitly out of scope

- Paid spam backlinks, PBNs, fake citations  
- Fake reviews or seeded star ratings  
- Keyword-stuffed forums  
- Claiming ChatGPT / Gemini / Perplexity “rankings”

---

## Razorpay / Edge Functions

Payment verification runs on **Supabase Edge Functions**, not the Vercel frontend.

If the repo contains a hardened `supabase/functions/razorpay-verify-payment`, deploy it separately with the Supabase CLI / dashboard. Frontend deploy does **not** update Edge Functions. Do not treat client-side checks as authoritative.

---

## Apex domain redirect (manual)

Repo `vercel.json` requests **308** from host `akmcare.in` → `https://www.akmcare.in`.

Production may still show **Dashboard 307**. Disable the Vercel Domains “Redirect to www” 307 so only the permanent project redirect remains. Avoid 307→308 chains.
