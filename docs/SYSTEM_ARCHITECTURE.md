# AKM Care — System Architecture

> Generated from a full codebase analysis. **No application code was modified for this document.**  
> Stack: Vite + React 18 + TypeScript + React Router 6 + TanStack Query + Supabase + Tailwind/shadcn + Razorpay Edge Functions.  
> Repository: `akm-care-website` · Project ref: `tdqepnmysycxklqcvpai`

---

## 1. Executive Summary

AKM Care is a **SPA e-commerce + corporate marketing site**. The browser talks to **Supabase** (Auth, Postgres + RLS, Storage) using the **anon key only**. Money paths (order create, payment verify, mark-failed) run in **Supabase Edge Functions** with the **service role**. Admin UI is the same SPA under `/admin/*`, gated by `admin_users` + RLS.

| Layer | Technology |
|-------|------------|
| UI | React 18, lazy routes, Layout chrome |
| State | React Context (Auth, Cart, Wishlist, Compare, RecentlyViewed, AdminAuth) + TanStack Query |
| Data | Supabase PostgREST + RPC + Storage |
| Payments | Razorpay Checkout.js → Edge Functions |
| Hosting | Vercel SPA rewrite + security headers |
| Edge | Deno functions under `supabase/functions/` |

---

## 2. Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Vercel static SPA)                                    │
│  React · Contexts · Services · anon Supabase client             │
└───────────────┬─────────────────────────────┬───────────────────┘
                │ PostgREST / Auth / Storage  │ fetch /functions/v1/*
                ▼                             ▼
┌───────────────────────────────┐   ┌─────────────────────────────┐
│  Supabase Platform            │   │  Edge Functions (Deno)      │
│  · Auth (JWT)                 │   │  · razorpay-create-order    │
│  · Postgres + RLS             │   │  · razorpay-verify-payment  │
│  · Storage buckets            │   │  · checkout-mark-failed     │
│  · Realtime (partially used)  │   │  · notify / notify-smtp     │
└───────────────┬───────────────┘   └──────────────┬──────────────┘
                │                                  │ service role
                ▼                                  ▼
         catalog_product_list              order_headers, payments,
         products, product_images          products.stock_quantity,
         admin_users, profiles             Razorpay API, Resend
```

### Layer responsibilities

1. **Presentation** — Pages under `src/pages`, shop/admin components, SEO via `react-helmet-async`.
2. **Application state** — Contexts for session, cart, wishlist, compare, recently viewed, admin role.
3. **Domain services** — `src/services/*` map UI → Supabase tables/views/RPCs; `src/lib/paymentService.ts` / `emailService.ts` call Edge Functions.
4. **API / Auth** — Supabase Auth JWT on browser requests; Edge Functions typically invoked with anon Bearer + server secrets.
5. **Persistence** — Postgres tables (see `DATABASE_SCHEMA.md`); Storage for product/CMS images.
6. **Integrations** — Razorpay, Resend (and optional SMTP/WhatsApp env).

---

## 3. Folder Structure

```text
akm-omni-platform-main/
├── src/
│   ├── App.tsx                 # Providers + routes
│   ├── pages/                  # Route pages (public + admin/)
│   ├── components/
│   │   ├── shop/               # ProductCard, Gallery, Filters, …
│   │   ├── admin/              # AdminLayout, AdminGuard, AdminUI
│   │   ├── auth/               # ProtectedRoute
│   │   ├── home/               # Landing sections
│   │   ├── layout/             # Navbar, Footer, Layout
│   │   └── ui/                 # shadcn primitives
│   ├── context/                # Auth, AdminAuth, Cart, Wishlist, Compare, RecentlyViewed
│   ├── hooks/                  # Catalog, CMS, admin realtime hooks
│   ├── services/               # Supabase data access + mappers/
│   ├── lib/                    # supabaseClient, payment, email, ecommerce helpers
│   └── data/                   # Offline catalog seed fallback
├── supabase/
│   ├── migrations/             # Authoritative schema (8 migrations)
│   ├── functions/              # Edge Functions
│   ├── seed_catalog.sql        # 5 saree products
│   └── seed_admin.sql
├── scripts/                    # catalog import, admin bootstrap, per-SKU image imports
├── public/                     # Static assets, sitemap, robots
├── docs/                       # This documentation set
├── vercel.json
└── package.json
```

---

## 4. Provider / Component Hierarchy

```text
QueryClientProvider
  HelmetProvider
    TooltipProvider
      AuthProvider
        AdminAuthProvider
          CartProvider
            WishlistProvider
              CompareProvider
                RecentlyViewedProvider
                  BrowserRouter
                    Layout  (skips Navbar/Footer on /admin)
                      Routes (lazy pages)
```

`DailyQuoteProvider` is mounted inside `Layout` for non-admin pages.

---

## 5. Routing (all routes)

| Path | Page | Auth |
|------|------|------|
| `/` | Index | Public |
| `/about`, `/training`, `/services` | Corporate | Public |
| `/shop` | Shop | Public |
| `/shop/product/:slug` | ProductDetails | Public |
| `/cart`, `/wishlist`, `/checkout` | Commerce | Public (guest OK) |
| `/order-success` | OrderSuccess | Public (needs `order` + `token`) |
| `/auth`, `/auth/reset-password` | Auth | Public |
| `/account` | Account | **ProtectedRoute** (session required) |
| `/sell-your-product`, `/careers`, `/contact`, `/faq`, `/csr`, `/media`, `/motivation`, `/personal-booking`, `/disclaimer` | Forms/content | Public |
| `/admin/login` | AdminLogin | Public |
| `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/:id`, `/admin/categories`, `/admin/brands`, `/admin/inventory`, `/admin/orders`, `/admin/customers`, `/admin/banners`, `/admin/coupons`, `/admin/content`, `/admin/media`, `/admin/analytics`, `/admin/settings`, `/admin/motivation`, `/admin/faq`, `/admin/services`, `/admin/inbox` | Admin portal | **AdminGuard** (`admin_users`) |
| `*` | NotFound | Public |

Legacy `src/pages/Admin.tsx` redirects to `/admin/login` and is **not** mounted in `App.tsx`.

---

## 6. State Management

| Context | File | Persistence | Notes |
|---------|------|-------------|-------|
| Auth | `AuthContext.tsx` | Supabase Auth session | Profile from `profiles` |
| AdminAuth | `AdminAuthContext.tsx` | Same session + `admin_users` | UI gate only; RLS is real ACL |
| Cart | `CartContext.tsx` | `akm_shop_cart_v1`, `akm_shop_saved_v1`, `akm_cart_session_id` | DB sync **auth users only** → `cart_items` |
| Wishlist | `WishlistContext.tsx` | `akm_shop_wishlist_v1` | DB sync auth → `wishlists` |
| Compare | `CompareContext.tsx` | `akm_shop_compare_v1` | Max 4; local only |
| RecentlyViewed | `RecentlyViewedContext.tsx` | `akm_shop_recently_viewed_v1` | Max 12; local only |
| Checkout draft | `Checkout.tsx` | `akm_checkout_draft_v2` | PII in localStorage (known risk) |

Client-side coupon display: hardcoded `AKMCARE10` → 10% in `CartContext`. Server validates coupons from `coupons` table in Edge create-order.

---

## 7. Data Flow Diagrams

### Authentication

```text
User → Auth.tsx → authService.signInWithEmail / signInWithGoogle
     → Supabase Auth → JWT in client
     → AuthContext sets user/session
     → addressService.getProfile → profiles
```

### Product browse

```text
Shop / PDP → useCatalogProducts / useCatalogProduct
          → productService → catalog_product_list view
          → mapCatalogRow → CatalogProduct
          → ProductGrid / ProductGallery
```

### Image upload (admin)

```text
AdminProductForm → adminUpload / adminCatalogService
                → Storage bucket products (or media)
                → product_images rows + products.image_url
```

### Search

```text
ProductSearch → searchService.searchProducts
             → products (text) then catalog_product_list by ids
```

---

## 8. Deployment Architecture

```text
GitHub main → Vercel build (vite build) → CDN SPA
                                      ↓
                         vercel.json SPA rewrite → index.html
                                      ↓
                         Browser env: VITE_SUPABASE_* (anon only)
                                      ↓
                         Supabase cloud (DB / Auth / Storage / Functions)
```

Edge secrets (dashboard / CLI): `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RESEND_API_KEY` / `VITE_RESEND_API_KEY`, optional WhatsApp/SMTP.

---

## 9. Dependency Graph (conceptual)

```text
Pages → Hooks → Services → getSupabaseClient() → PostgREST
Pages → paymentService / emailService → Edge Functions
Pages → Contexts ← localStorage / Auth
Admin pages → admin*Service → PostgREST (JWT + is_admin_user RLS)
```

---

## 10. Module Completion Status

| Module | Status | Notes |
|--------|--------|-------|
| Homepage | ✅ | Hero, carousel, shop preview, FAQ, CTA |
| About / CSR / Careers / Contact / FAQ | ✅ | Forms insert into Supabase tables |
| Shop / Search / Filters | ✅ | View-backed; offline seed fallback |
| Product Details / Gallery | ✅ | Zoom, fullscreen, swipe, lazy load |
| Cart / Wishlist / Compare / Recently Viewed | ✅ | Compare/recent local-only |
| Checkout | ✅ | Razorpay; COD **not** enabled |
| Orders (customer) | 🟡 | Receipt via token; account lists own `order_headers` |
| Payments | 🟡 | Client-triggered verify; **no Razorpay webhooks** |
| Admin portal | ✅ | Catalog, orders, CMS, inbox, analytics shell |
| Inventory table | 🟡 | Exists; sales decrement `products.stock_quantity` only |
| Coupons | 🟡 | Admin CRUD + server validate; client still hardcodes display coupon |
| Vendor marketplace | 🟡 | Public apply form; weak admin RLS on vendor tables |
| Notifications | 🟡 | Ops email via `notify`; shipping/delivered events unused |
| Analytics | 🟡 | Dashboard aggregates; not a full analytics product |
| CMS | ✅ | Pages, banners, media, settings |
| Realtime | 🟡 | Hooks subscribe; publication may need dashboard config |

---

## 11. Scores (as of analysis)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Production readiness** | **68 / 100** | Shop + admin usable; payment path hardened; gaps: webhooks, storage policy OR, coupon client hardcode, CSP/HSTS |
| **Scalability** | **62 / 100** | SPA + PostgREST OK for catalog; Edge pricing is sequential; no reservation/queue |
| **Maintainability** | **70 / 100** | Clear services/layers; dual order tables + unused shared pricing module add debt |
| **Security** | **72 / 100** | Critical checkout RLS fixed; remaining High items (authenticated storage upload policy, notify abuse surface, CORS `*`) |
| **Code quality** | **71 / 100** | Consistent patterns; some large pages (Checkout, Shop); legacy hooks (`useOrders` → `orders`) |

---

## 12. Related Documents

- [SHOP_WORKFLOW.md](./SHOP_WORKFLOW.md) — customer journey end-to-end  
- [ADMIN_WORKFLOW.md](./ADMIN_WORKFLOW.md) — admin + order processing visibility  
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — tables, RLS, storage  
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) — authz, secrets, residual risks  
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — env, Vercel, Edge deploy  

---

## 13. Strengths & Technical Debt

**Strengths**
- Clear separation: pages → services → Supabase  
- Server-authoritative checkout pricing after Critical remediation  
- Admin without browser service-role key  
- Rich shop UX (gallery, compare, filters) without redesign debt in docs scope  

**Debt / weaknesses**
- Dual models: `order_headers` vs legacy `orders`  
- `inventory` table not updated on sale  
- `authenticated_upload_catalog_buckets` still OR’d with admin storage policies  
- Client `AKMCARE10` vs DB coupons  
- `_shared/checkoutPricing.ts` unused (logic inlined in create-order)  
- Large components: `Checkout.tsx`, `Shop.tsx`, `ProductDetails.tsx`  
- Pincode delivery is mock (`mockDeliveryAvailable`)
