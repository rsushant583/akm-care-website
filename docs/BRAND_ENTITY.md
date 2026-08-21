# Brand entity — AKM Care

**Source of truth in code:** `src/lib/config/brand.ts`  
**Canonical site:** https://www.akmcare.in  

Only facts already published on the storefront or verified social profiles appear here. Do not add GSTIN, street address, Instagram, certifications, or founder bios until they are published on-site.

---

## Official identity

| Field | Value |
| --- | --- |
| Brand / legal name | AKM Care |
| Website | https://www.akmcare.in |
| Tagline | Authentic fashion and industrial solutions, pan-India. |
| Description | AKM Care sells authentic fashion online — sarees, lehengas, gowns, 3-piece suits and men's jeans — and provides industrial training, HR, and compliance services from Ahmedabad, Gujarat. |

## Contact (customer service)

| Field | Value |
| --- | --- |
| Email | contact@akmcare.in |
| Phone (display) | +91-84019 95486 |
| Phone (E.164) | +918401995486 |
| WhatsApp | https://wa.me/918401995486 |

## Location

| Field | Value |
| --- | --- |
| Locality | Ahmedabad |
| Region | Gujarat |
| Country | India (IN) |
| Display | Ahmedabad, Gujarat, India |
| Street / pin | **Not published** — do not invent |

## What AKM Care sells (shop)

Official category URLs use `/shop?category={slug}`:

- sarees  
- ladies-gown  
- stitched-lehenga  
- unstitched-lehenga  
- 3-piece-suits  
- mens-jeans  

Product URLs: `/shop/product/{slug}`  
Prices, stock, dimensions, and shipping windows come from the live catalog.

## What AKM Care offers (services)

Industrial and corporate training, placement, manpower deployment, compliance consulting, policy formation, and employment verification (see `/services`, `/training`).

## Social (`sameAs` only when verified)

| Network | URL |
| --- | --- |
| YouTube | https://www.youtube.com/@akmcare1309 |
| Facebook | https://www.facebook.com/share/1Jjs7ipP1x/ |

Do not add Facebook share URLs from CSR or other pages until confirmed as the same official account.

## Assets

| Asset | Path |
| --- | --- |
| Logo | `/logo.jpeg` |
| Default share image | `/og-image.jpg` (1200×630 JPEG) |

## Shipping & returns (store policy)

Canonical policy module: `src/lib/ecommerce/shippingPolicy.ts`

- Area: pan-India  
- Standard window: 3–5 business days  
- Express window: 1–2 business days  
- Returns: 7 days, unused, original packing (via support)  
- Charges: store settings (`shippingSettings.ts`); checkout is authoritative  

Product `shipping_time` may differ per SKU; PDPs label catalog-specific windows explicitly.

## Must not invent

- Street address, GSTIN, CIP, ISO marks  
- GTIN / MPN / fake reviews  
- “India’s best / leading” claims  
- Unverified employee or revenue stats on new pages  

Existing About page marketing stats (e.g. industries served) are legacy copy — treat as unverified for new GEO content until the business confirms them in writing.

## Consistency checklist

Use `BRAND` / this document for:

- Organization JSON-LD (`src/lib/schemas.ts`)  
- Footer NAP + social  
- Contact page  
- About / FAQ / shipping pages  
- `public/llms.txt`  
- Guides and keyword docs  
