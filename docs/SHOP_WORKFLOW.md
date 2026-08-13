# AKM Care — Shop & Customer Workflow

> Exact customer journey as implemented in code. Paths relative to `src/`.

---

## 1. Journey Map

```text
Open site (/)
  → Homepage (Index.tsx)
  → Shop (/shop)
  → Search / Filters
  → Product listing (ProductGrid + ProductCard)
  → Product details (/shop/product/:slug)
  → Gallery / Wishlist / Compare / Recently Viewed
  → Add to Cart (CartContext)
  → Cart (/cart)
  → Checkout (/checkout)
  → Customer → Address → Shipping → Payment → Review
  → Place Order → razorpay-create-order → Razorpay UI
  → verify → Order Success (/order-success?order=&token=)
  → Account order history (/account) [logged-in only]
```

---

## 2. Step-by-Step Trace

### 2.1 Open website / Homepage

| Concern | Implementation |
|---------|----------------|
| Route | `/` → `pages/Index.tsx` |
| Layout | `components/layout/Layout.tsx` → Navbar, Footer, FloatingCart, CompareTray |
| Sections | Hero, ImageCarousel, StatsBar, ServicesOverview, DailyMotivation, YouTubeCarousel, EcommercePreview, FAQPreview, CTABanner |
| Data | Mostly static / CMS hooks; EcommercePreview uses `useProducts` |

### 2.2 Navigate to Shop

| Concern | Implementation |
|---------|----------------|
| Route | `/shop` → `pages/Shop.tsx` |
| Hook | `useCatalogProducts`, `useCatalogMerchandising`, `useCatalogFacets` |
| Service | `productService.listProducts` → view `catalog_product_list` |
| Mapper | `mappers/catalogMapper.mapCatalogRow` |
| Fallback | If empty/unconfigured → `data/catalog/products.ts` offline seed |
| UI | ShopHero, CategoryStrip, ProductSearch, ProductFilters, ProductGrid, ProductSection |

### 2.3 Search

| Concern | Implementation |
|---------|----------------|
| Component | `components/shop/ProductSearch.tsx` |
| Service | `searchService.searchProducts` |
| Tables | Query `products`, then hydrate via `catalog_product_list` |
| State | Local search UI state; navigates to PDP or filters shop |

### 2.4 Filters

| Concern | Implementation |
|---------|----------------|
| Component | `ProductFilters.tsx` |
| Logic | `lib/ecommerce/filters.ts` + facets from `getFilterFacets` |
| Applied | PostgREST filters in `listProducts` + some client-side color/variant filtering |

### 2.5 Product listing / cards

| Concern | Implementation |
|---------|----------------|
| Components | `ProductGrid.tsx`, `ProductCard.tsx` |
| Actions | Add to cart (`CartContext.addToCart`), wishlist toggle, compare toggle |
| Images | `product.image_url` or `product.images[0].src` from view aggregate |
| Storage | Public URLs under bucket `products` (e.g. `akmc-dpb-lta/image-01.webp`) |

### 2.6 Product details

| Concern | Implementation |
|---------|----------------|
| Route | `/shop/product/:slug` → `ProductDetails.tsx` |
| Hook | `useCatalogProduct(slug)` → `getProductBySlug` |
| Gallery | `ProductGallery.tsx` — cover = first image; thumbs; hover zoom; fullscreen; swipe; lazy + skeleton |
| Contexts | `RecentlyViewedContext.track` on view; wishlist/compare/cart |
| Related | `RelatedProducts` → `getRelatedProducts` → table `related_products` |
| Sticky CTA | `StickyBuyBar.tsx` (mobile) |

### 2.7 Wishlist

| Concern | Implementation |
|---------|----------------|
| Context | `WishlistContext` — `ids[]` |
| Keys | `akm_shop_wishlist_v1` (+ session id) |
| DB | Auth only: `wishlists` via `wishlistService` |
| Page | `/wishlist` → `Wishlist.tsx` loads products by id |

### 2.8 Compare

| Concern | Implementation |
|---------|----------------|
| Context | `CompareContext` — max 4 ids |
| Key | `akm_shop_compare_v1` |
| UI | `CompareTray` in Layout |
| DB | **NOT IMPLEMENTED** (localStorage only) |

### 2.9 Recently viewed

| Concern | Implementation |
|---------|----------------|
| Context | `RecentlyViewedContext` |
| Key | `akm_shop_recently_viewed_v1` |
| UI | `RecentlyViewedStrip` |
| Table `recently_viewed` | Exists in schema; **storefront uses localStorage, not this table** |

### 2.10 Add to cart / cart updates

| Concern | Implementation |
|---------|----------------|
| Context | `CartContext.addToCart` / `updateQuantity` / `removeFromCart` / `saveForLater` |
| Keys | `akm_shop_cart_v1`, `akm_shop_saved_v1` |
| Totals | `lib/ecommerce/pricing.calcCartTotals` + shipping rates `{ standard: 49, express: 99 }` |
| Coupon display | Client: `AKMCARE10` → 10% (display only) |
| DB sync | Auth: `cartService.syncCartToDatabase` → `cart_items` (guest = local only after Critical RLS) |
| Page | `/cart` → `Cart.tsx` → navigate `/checkout` |

### 2.11 Checkout steps

| Step | UI | Validation | Persistence |
|------|-----|------------|-------------|
| Cart review | `Checkout.tsx` step | Qty/remove | Draft `akm_checkout_draft_v2` |
| Customer | name, email, phone | Inline required/email/phone | Draft |
| Address | line1, city, state, pincode (+ saved addresses if auth) | Required fields | Draft; optional `addresses` table |
| Shipping | standard / express | Method selection | `CartContext.shippingMethod` |
| Payment | Razorpay (COD disabled) | Method check | Draft |
| Review | Summary + place order | Full validation before pay | — |

Auth: **not required** for checkout (guest allowed).

### 2.12 Place Order → payment → success

See detailed order workflow below and in §3.

| Concern | Implementation |
|---------|----------------|
| Button | `placeOrder` in `Checkout.tsx` |
| Create | `createRazorpayOrder` → Edge `razorpay-create-order` |
| Pay | Razorpay Checkout.js |
| Verify | `verifyRazorpayPayment` → Edge `razorpay-verify-payment` |
| Fail | `markOrderFailed` → Edge `checkout-mark-failed` |
| Success nav | `/order-success?order={orderNumber}&token={accessToken}` |
| Clear | `clearCart` + remove checkout draft |

### 2.13 Order success / history

| Concern | Implementation |
|---------|----------------|
| Page | `OrderSuccess.tsx` |
| API | RPC `get_order_receipt(p_order_number, p_access_token)` |
| Tables | Returns header + items + payment + shipping JSON |
| Account | `/account` → `listOrdersForUser` → `order_headers` where `user_id = auth.uid()` |

---

## 3. Order Placement (Place Order click) — full trace

```text
placeOrder()
  ├─ validate customer + address fields (inline)
  ├─ reject if COD / non-razorpay
  ├─ loadRazorpayScript()
  ├─ createRazorpayOrder({
  │     items: [{ productId, quantity }],   // NO unitPrice/totals
  │     customer, address, shippingMethod, couponCode, notes, userId
  │  })
  │     └─ POST /functions/v1/razorpay-create-order
  │           ├─ service role: load products, fail if no DB price
  │           ├─ shipping from site_settings or defaults
  │           ├─ coupon from coupons table
  │           ├─ INSERT order_headers (pending, access_token, pricing_snapshot)
  │           ├─ INSERT order_items, order_status, shipping
  │           ├─ Razorpay orders.create(amountPaise)
  │           ├─ UPDATE header.razorpay_order_id; INSERT payments(created)
  │           └─ return keyId, order, orderHeaderId, orderNumber, accessToken, totals
  ├─ sendOrderEmail("order_confirmation") → notify (ops)
  ├─ new Razorpay({ order_id, handler })
  │     handler:
  │       verifyRazorpayPayment({ razorpay_*, orderHeaderId, accessToken })
  │         └─ POST razorpay-verify-payment
  │               ├─ HMAC signature check
  │               ├─ load order_headers by razorpay_order_id
  │               ├─ GET Razorpay payment; amount === grand_total paise
  │               ├─ decrement products.stock_quantity (conditional)
  │               ├─ INSERT legacy orders + stock_movements
  │               ├─ mark header/payment paid; coupon used_count++
  │               ├─ WhatsApp (optional) + Resend customer+ops
  │               └─ return success
  │       sendOrderEmail("payment_success")
  │       clearCart; navigate order-success
  └─ on payment.failed → checkout-mark-failed
```

**Client money fields are not trusted.** Deprecated: `createPendingOrder` / `attachPayment` throw if called.

---

## 4. Tables & Buckets Touched (shop path)

| Step | Tables / RPC / Storage |
|------|------------------------|
| Browse | `catalog_product_list`, underlying `products`, `product_images` |
| Images | Storage bucket `products` (public URLs) |
| Cart DB | `cart_items` (auth) |
| Wishlist DB | `wishlists` (auth) |
| Checkout create | `order_headers`, `order_items`, `payments`, `shipping`, `order_status`, `products` (read), `coupons`, `site_settings` |
| Verify | `products` (stock), `orders` (legacy), `stock_movements`, payments/header update |
| Receipt | RPC `get_order_receipt` |
| Account orders | `order_headers` |

---

## 5. Validations Summary

| Layer | What |
|-------|------|
| Cart UI | Qty 1–100, stock max from product |
| Checkout UI | Name, email format, phone, address fields |
| Edge create | Valid product IDs, positive DB prices, stock ≥ qty, grand_total > 0, coupon rules |
| Edge verify | Signature, payment belongs to order, amount match, stock race guard |

---

## 6. NOT IMPLEMENTED (shop-related)

- Cash on Delivery fulfillment  
- Razorpay **webhooks** (paid state depends on browser verify call)  
- Server-side shipping rate API (fixed table / settings)  
- Real courier pincode check (mock only)  
- Compare / recently viewed cloud sync  
- Calling `shipping_confirmation` / `order_delivered` email events from app code

---

## 7. Related Documents

- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
- [ADMIN_WORKFLOW.md](./ADMIN_WORKFLOW.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
