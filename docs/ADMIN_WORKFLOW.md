# AKM Care — Admin Workflow & Order Operations

> How the `/admin` portal works and how staff learn about customer orders.

---

## 1. Admin Authentication

```text
/admin/login → AdminLogin.tsx
  → AdminAuthContext.signIn
  → adminAuthService.adminSignIn (Supabase email/password)
  → fetchAdminProfile → SELECT admin_users WHERE user_id = auth.uid() AND is_active
  → if row exists → isAdmin=true, role = super_admin | admin | staff
  → navigate /admin
```

| Piece | Path |
|-------|------|
| Context | `src/context/AdminAuthContext.tsx` |
| Service | `src/services/adminAuthService.ts` |
| Guard | `AdminGuard` in `src/components/admin/AdminLayout.tsx` |
| Table | `admin_users` |
| Bootstrap | `npm run admin:bootstrap` (`scripts/bootstrap-admin.mjs`) + `seed_admin.sql` |

**Important:** UI role helpers (`canManageSettings`, etc.) are **mostly UX**. Most RLS policies use `is_admin_user()` for any active admin role. Fine-grained RBAC in RLS is **partial** (super_admin mainly for managing `admin_users`).

Legacy PIN (`VITE_ADMIN_PIN`) is **unused** by the portal.

---

## 2. Admin Route Map

Mounted via `src/pages/admin/AdminRoutes.tsx` under `/admin/*`.

| Route | Page | Purpose |
|-------|------|---------|
| `/admin/login` | AdminLogin | Sign in |
| `/admin` | AdminDashboard | KPIs / charts |
| `/admin/products` | AdminProducts | List |
| `/admin/products/new` | AdminProductForm | Create |
| `/admin/products/:id` | AdminProductForm | Edit |
| `/admin/categories` | AdminCategories | Categories |
| `/admin/brands` | AdminBrands | Brands |
| `/admin/inventory` | AdminInventory | Stock list |
| `/admin/orders` | AdminOrders | Order management |
| `/admin/orders/:id` | AdminOrderDetail | Order detail / timeline |
| `/admin/customers` | AdminCustomers | Profiles + block |
| `/admin/banners` | AdminBanners | Banners |
| `/admin/coupons` | AdminCoupons | Coupons |
| `/admin/content` | AdminContent | CMS pages |
| `/admin/media` | AdminMedia | Media library |
| `/admin/analytics` | AdminAnalytics | Analytics views |
| `/admin/settings` | AdminSettings | site_settings |
| `/admin/motivation` | AdminMotivation | Quotes |
| `/admin/faq` | AdminFaqManage | FAQ |
| `/admin/services` | AdminServicesManage | Services |
| `/admin/inbox` | AdminInbox | Contact/feedback/etc. |

Public Layout chrome is skipped when path starts with `/admin`.

---

## 3. Product Admin Workflow

```text
AdminProducts → AdminProductForm
  → load product via adminCatalogService
  → edit fields (name, prices, stock, GST, HSN, …)
  → upload images → Storage (products bucket) + product_images
  → save → UPDATE/INSERT products (RLS is_admin_user)
  → set cover = first image / image_url
```

| Concern | Implementation |
|---------|----------------|
| Service | `adminCatalogService.ts` |
| Tables | `products`, `product_images`, `product_variants`, `product_colors`, `brands`, `categories`, `subcategories` |
| Storage | Bucket `products` (and related catalog buckets) |
| Permissions | JWT of admin user; RLS `is_admin_user()` |
| Reorder / delete images | Form manages image URL list; writes `product_images` |

Inventory page reads/updates stock-oriented fields (`AdminInventory` + `inventory` / `products`).

---

## 4. CMS / Merchandising / Settings

| Module | Service methods | Tables / storage |
|--------|-----------------|------------------|
| Coupons | adminCmsService | `coupons` |
| Banners | adminCmsService | `banners` + storage |
| Content | adminCmsService | `cms_pages` |
| Media | adminCmsService | `media_assets` + bucket `media` |
| Settings | adminCmsService | `site_settings` (shipping JSON, tax, contact) |
| Dashboard | adminDashboardService | Aggregates products/orders/profiles/vendors |
| Inbox | useInbox + admin pages | contact_*, feedback_*, career_*, product_interests |

---

## 5. Admin Order Processing (post-purchase)

### 5.1 How does admin know a new order exists?

| Mechanism | Status |
|-----------|--------|
| **Admin Orders page** | ✅ `listAdminOrders()` on `order_headers` + `order_items` (newest first, limit 300) |
| **Dashboard counts** | ✅ Same `getDashboardStats()`; refreshes on realtime order events |
| **Email to ops** | ✅ On payment fulfill (Resend) + optional `notify` |
| **WhatsApp** | 🟡 Optional — only if `WHATSAPP_*` env set |
| **Realtime push to admin UI** | ✅ Phase 5.6 — `order_headers` INSERT/UPDATE via `AdminOrderAlertsProvider` |
| **Polling** | ❌ Not used — DB query remains source of truth; Search/refresh still works |
| **Razorpay webhooks** | ✅ Implemented (`razorpay-webhook`); paid state also via browser verify |

### 5.2 Where is the order stored?

| Store | Role |
|-------|------|
| `order_headers` | Canonical order (totals, customer, status, `access_token`, `razorpay_order_id`) |
| `order_items` | Line items with server prices |
| `payments` | Razorpay ids + status |
| `shipping` | Method / tracking fields |
| `order_status` | History notes |
| `orders` (legacy) | Per-line paid rows written by verify (older model) |

### 5.3 Where does it appear?

- `/admin/orders` — `AdminOrders.tsx` via `adminOrdersService.listAdminOrders`
- `/admin/orders/:id` — detail, shipping, payment, timeline
- Customer `/account` — only if `user_id` was set at create-order
- `/order-success` — guest/auth via receipt token RPC

### 5.4 Status updates by admin

```text
AdminOrders → updateOrderStatus(orderId, status)
  → UPDATE order_headers.status
  → INSERT order_status note "Status set to … by admin"
```

Statuses include: pending, confirmed, packed, shipped, out_for_delivery, delivered, cancelled, returned, refunded (see `ORDER_STATUSES`).

Shipping confirmation / delivered **customer emails** from admin status change: **NOT IMPLEMENTED** (email event types exist in `emailService` but are not wired to `updateOrderStatus`).

---

## 6. Customers

| Action | Service | Table |
|--------|---------|-------|
| List | `listCustomers` | `profiles` |
| Block | `setCustomerBlocked` | `profiles.is_blocked` |
| Orders for customer | `getCustomerOrders` | `order_headers` |

**Note:** `is_blocked` is **not enforced** at login in `AuthContext` (known gap).

---

## 7. Permissions Matrix (simplified)

| Action | Who |
|--------|-----|
| Public catalog read | Anyone (anon) |
| Place paid order | Anyone via Edge (service role writes) |
| Admin catalog write | Active `admin_users` |
| Admin order manage | Active `admin_users` |
| Manage admin_users | `super_admin` via `admin_has_role` |
| Browser service role | **Never** (`supabaseClient.ts`) |

---

## 8. NOT IMPLEMENTED (admin ops)

- Automatic fulfillment emails on status change  
- Vendor application moderation UI backed by complete RLS  
- Refund orchestration with Razorpay API  
- MFA for admin accounts

---

## 9. Related Documents

- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
- [SHOP_WORKFLOW.md](./SHOP_WORKFLOW.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
