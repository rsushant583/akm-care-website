# AKM Care — Deployment Guide

---

## 1. Runtime Topology

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend SPA | Vercel | **Must** run `npm run build` (sitemap + Vite + HTML shells + verify). Not `vite build`. |
| Database / Auth / Storage | Supabase project `tdqepnmysycxklqcvpai` | Migrations via CLI |
| Edge Functions | Supabase Functions | Deno |
| Payments | Razorpay | Keys in Edge secrets |
| Email | Resend (primary), SMTP fallback | Edge `notify` / `notify-smtp` |

---

## 2. Environment Variables

### Browser (Vercel / `.env`)

| Name | Required | Purpose |
|------|----------|---------|
| `VITE_SUPABASE_URL` | Yes | Browser catalog **and** Edge middleware product existence checks |
| `VITE_SUPABASE_ANON_KEY` | Yes | Same (runtime + build) |
| `VITE_YOUTUBE_API_KEY` | Optional | YouTube carousel |
| `VITE_RESEND_API_KEY` | Avoid in browser | Prefer server-only name |
| `VITE_ADMIN_PIN` | Legacy | Unused by `/admin` |

### Server / scripts only

| Name | Purpose |
|------|---------|
| `SUPABASE_URL` | Same project URL for scripts |
| `SUPABASE_SERVICE_ROLE_KEY` | Migrations scripts, bootstrap, catalog import |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_FULL_NAME` | First admin bootstrap |

### Edge Function secrets

| Name | Purpose |
|------|---------|
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected typically |
| `SUPABASE_ANON_KEY` | Create-order JWT user bind |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payments — never `VITE_` |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook HMAC — never `VITE_` |
| `ALLOWED_ORIGINS` | Optional CORS allowlist (comma-separated) |
| `RESEND_API_KEY` or `VITE_RESEND_API_KEY` | Email |
| `OPS_NOTIFICATION_EMAIL` | Optional ops inbox override |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_TO_NUMBER` | Optional WhatsApp |
| `SMTP_USER` / `SMTP_PASS` | notify-smtp |

**Never** put service role or Razorpay secret in `VITE_` vars.

---

## 3. Build & Local Dev

```bash
npm install
npm run dev          # Vite dev server
npm run build        # Production bundle
npm run preview      # Preview build
npm run test         # Vitest
npm run test:e2e     # Playwright
```

---

## 4. Database & Seeds

```bash
npm run db:push                    # supabase db push (linked project)
# Manual seeds (not always in config sql_paths):
npx supabase db query --linked -f supabase/seed_catalog.sql
npx supabase db query --linked -f supabase/seed_admin.sql
npm run admin:bootstrap            # create/promote super admin
```

Catalog image imports (idempotent upserts):

```bash
npm run catalog:import-dpb-lta
npm run catalog:import-mte-mmle
npm run catalog:import-rfx-mcmd
npm run catalog:import             # Excel + local folder pipeline
```

---

## 5. Edge Function Deploy

```bash
npm run deploy:edge
# or per function:
npx supabase functions deploy razorpay-create-order --project-ref tdqepnmysycxklqcvpai
npx supabase functions deploy razorpay-verify-payment --project-ref tdqepnmysycxklqcvpai
npx supabase functions deploy checkout-mark-failed --project-ref tdqepnmysycxklqcvpai
npx supabase functions deploy razorpay-webhook --project-ref tdqepnmysycxklqcvpai
npx supabase functions deploy notify --project-ref tdqepnmysycxklqcvpai
npx supabase functions deploy notify-smtp --project-ref tdqepnmysycxklqcvpai
```

Phase 5.5 also requires applying `supabase/migrations/20260813120000_phase55_payment_admin_hardening.sql`, setting `RAZORPAY_WEBHOOK_SECRET`, and pointing the Razorpay dashboard webhook to `/functions/v1/razorpay-webhook` (`payment.captured`, `payment.failed`, `order.paid`).

---

## 6. Vercel Configuration

File: `vercel.json` plus Dashboard env.

| Setting | Value |
| --- | --- |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js | 20 (`engines` + `.nvmrc`) |
| Framework | Vite |

`vercel.json` also sets:

- Apex `akmcare.in` → `https://www.akmcare.in` **308** (disable any Dashboard 307 “redirect to www” to avoid a chain)
- SPA rewrite excluding dotted files and `/seo-category/` (category HTML is fetched by middleware)
- Headers for `robots.txt`, `sitemap.xml`, `llms.txt`, `og-image.jpg`

### Runtime env for Edge middleware 404s

`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` must be available at **runtime**, not only at build.

- Product exists → 200
- Product missing → 404
- Env missing / Supabase down → **fail-open 200** (shop stays online; client still noindexes empty PDPs)

See `docs/SEARCH_CONSOLE_SETUP.md` for the post-deploy crawl checklist.

---

## 7. Post-Deploy Smoke Checklist

1. `/shop` lists products from `catalog_product_list`.  
2. PDP gallery loads Storage WebP URLs.  
3. Add to cart → checkout → Razorpay test mode create+verify.  
4. `/order-success?order=&token=` shows receipt.  
5. `/admin/login` → Orders shows `order_headers`.  
6. Contact form triggers `notify` (ops email).  
7. Confirm no service-role key in built JS (`grep` dist for `service_role` claim should fail).

---

## 8. Production Readiness Snapshot

| Area | Score | Gap to close |
|------|-------|--------------|
| Production readiness | 68/100 | Webhooks, CSP/HSTS, storage upload policy |
| Scalability | 62/100 | Stock reservation, CDN image pipeline at scale |
| Maintainability | 70/100 | Dual order tables, shared pricing module unused |
| Security | 72/100 | See SECURITY_AUDIT.md residual High items |
| Code quality | 71/100 | Split large pages; remove legacy hooks drift |

---

## 9. Related Docs

- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)  
- [SHOP_WORKFLOW.md](./SHOP_WORKFLOW.md)  
- [ADMIN_WORKFLOW.md](./ADMIN_WORKFLOW.md)  
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)  
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
