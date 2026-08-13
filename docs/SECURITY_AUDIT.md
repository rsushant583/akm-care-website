# AKM Care — Security Architecture & Residual Risks

> Documents **current** security behavior after Critical remediation (`20260724140000` + Edge checkout).  
> This is documentation only — not a new audit engagement. For historical Critical findings see the in-IDE security canvas.

---

## 1. Authentication

| Topic | Implementation |
|-------|----------------|
| Provider | Supabase Auth (email/password, Google OAuth) |
| Browser client | Anon key only — `src/lib/supabaseClient.ts` |
| Session | Stored by Supabase JS SDK |
| Customer gate | `ProtectedRoute` for `/account` only |
| Admin gate | `AdminGuard` + row in `admin_users` |
| Password policy | UI minLength 6 (weak) |
| MFA | **NOT IMPLEMENTED** |
| `profiles.is_blocked` | Writable by admin; **NOT enforced at login** |

---

## 2. Authorization & RLS

| Surface | Control |
|---------|---------|
| Catalog read | Public |
| Catalog write | `is_admin_user()` |
| Cart / wishlist DB | Authenticated owner only |
| Order money tables | **No client insert/update**; Edge service role |
| Order read | Owner `user_id` OR admin; guests use `get_order_receipt` token |
| Admin UI | Client guard + RLS (UI roles mostly cosmetic) |

Functions: `is_admin_user()`, `admin_has_role()`, `get_order_receipt()`.

---

## 3. Payments Security

```text
Client sends: productId + quantity + shippingMethod + couponCode + customer/address
Server computes: unit prices, GST totals, shipping, discount, grand_total
Verify: HMAC + Razorpay payment amount == order_headers.grand_total (paise)
```

| Control | Status |
|---------|--------|
| Server pricing | ✅ |
| Amount check vs Razorpay API | ✅ |
| Client attachPayment | ❌ Removed (throws) |
| Webhooks | ✅ `razorpay-webhook` (signature + idempotent events). Browser verify kept. |
| CORS on payment functions | Origin allowlist + optional `ALLOWED_ORIGINS` |
| Binding userId on create | JWT `auth.getUser()` only — body `userId` ignored |
| Stock hold | Atomic `reserve_product_stock` at create; release on fail |
| Coupon usage | Atomic `reserve_coupon_usage` at create; release on fail |

---

## 4. Storage Permissions

| Bucket | Risk note |
|--------|-----------|
| Catalog buckets | Public read OK; **legacy `authenticated_upload_*` policies still exist** alongside admin policies (OR semantics) — any logged-in user may upload |
| `vendor-documents` | Public insert; private; limited SELECT policies |
| `media` | Admin write |

---

## 5. Secrets & Environment

| Variable | Where | Risk |
|----------|-------|------|
| `VITE_SUPABASE_ANON_KEY` | Browser | Expected public |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts / Edge only | Must never be `VITE_` |
| `RAZORPAY_KEY_SECRET` | Edge | Server only — never `VITE_` |
| `RAZORPAY_WEBHOOK_SECRET` | Edge webhook | Server only — never `VITE_` |
| `ALLOWED_ORIGINS` | Edge CORS | Optional comma-separated allowlist |
| `VITE_RESEND_API_KEY` | Naming footgun — prefer `RESEND_API_KEY` in Edge | Medium |
| `VITE_ADMIN_PIN` | Legacy unused | Low |

Browser explicitly **does not** initialize service-role client.

---

## 6. Edge Function Surfaces

| Function | Auth model | Notes |
|----------|------------|-------|
| `razorpay-create-order` | Anon or user JWT | Service role DB; pricing locked; JWT binds user_id |
| `razorpay-verify-payment` | Anon Bearer | Signature + amount + order token |
| `razorpay-webhook` | Razorpay HMAC | `verify_jwt=false`; webhook secret required |
| `checkout-mark-failed` | Anon + access_token | Cannot fail paid orders; releases stock/coupon holds |
| `notify` | No JWT check | Event allowlist, HTML escape, ops-only recipient |
| `notify-smtp` | No JWT check | SMTP fallback |

Rate limiting: **NOT IMPLEMENTED** at app layer (rely on Supabase/platform defaults).

---

## 7. Frontend Security Notes

| Topic | Status |
|-------|--------|
| XSS via CMS HTML | Risk if raw HTML rendered without sanitize (**DOMPurify not standard**) |
| Open redirect on Auth `from` | Medium — should allowlist relative paths |
| Checkout PII in localStorage | `akm_checkout_draft_v2` stores name/email/phone/address |
| Clickjacking | Mitigated via `X-Frame-Options: DENY` in `vercel.json` |
| CSP / HSTS | **Missing** on Vercel headers |

---

## 8. Residual Risk Summary

| Severity | Item | Status |
|----------|------|--------|
| Critical (checkout forgery / PII IDOR / client pricing) | Addressed in Critical remediation | Closed |
| High | Authenticated catalog storage upload policy | Open |
| High | Payment CORS `*` | Closed (origin allowlist) |
| High | Admin RBAC mostly UI-only | Tightened in `20260813120000` (staff read-only on settings/orders/coupons) |
| Medium | No payment webhooks | Closed (browser verify retained) |
| Medium | Notify still callable with anon (mitigated allowlist) | Open |
| Medium | Weak passwords / no MFA | Open |
| Medium | `is_blocked` unused | Open |

---

## 9. Recommended Security Backlog (documentation only)

1. Drop `authenticated_upload_catalog_buckets` (admin-only uploads).  
2. Restrict Edge CORS to production origins — allowlist shipped; confirm `ALLOWED_ORIGINS` in production.  
3. Encode staff vs admin roles in RLS — done in `20260813120000` (catalog writes still `is_admin_user()`).  
4. Rename Resend secret; rotate if ever exposed.  
5. Add CSP + HSTS; validate Auth redirect `from`.  
6. Enforce `is_blocked` in Auth hydrate / Auth Hook.  
7. Reduce PII in localStorage checkout draft.  
8. Apply Phase 5.5 migration + redeploy payment Edge Functions before treating production as secured.

---

## 10. Related Documents

- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
- [SHOP_WORKFLOW.md](./SHOP_WORKFLOW.md)
- [ADMIN_WORKFLOW.md](./ADMIN_WORKFLOW.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
