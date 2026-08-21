# Product image guidelines (AKM Care)

Practical rules for catalog photography and delivery. Keep `src/lib/images/productImage.ts` as the only place that builds delivery URLs / `srcSet` / sizes / priority props.

## 1. Where masters belong

- **Working masters:** `public/catalog/{slug}/` during import (optional local backup).
- **Production source of truth:** Supabase Storage bucket `products`, path `{slug}/image-NN.webp`.
- Do **not** import product photos through `src/assets/` or the Vite JS bundle.

## 2. Naming convention

| Layer | Pattern | Example |
|--------|---------|---------|
| Local folder | `{slug}/` | `akmc-sani-1007/` |
| Local files | `01.png` … `NN.png` (or `.jpg` / `.webp`) | `01.png` |
| Storage objects | `{slug}/image-NN.webp` | `akmc-sani-1007/image-01.webp` |
| Admin uploads | `products/{productId}/{timestamp}-{safeName}` | versioned path |

Use the product **slug** (unchanged) as the Storage folder name.

## 3. Recommended dimensions

- Master long edge: **~2000–3000px**
- Aspect: portrait **3:4** (matches storefront cards / PDP)
- Current SANI/ROOH local masters are smaller (~440–710px) — prefer larger masters for future uploads

## 4. Recommended formats

- Master upload: **JPEG** or **WebP**
- Stored delivery object: **WebP** (quality ~90 at ingest)
- Avoid mislabeled extensions (JPEG bytes named `.png`)

## 5. Maximum recommended upload size

- Prefer **&lt; 5 MB** per master frame
- Hard limit follows Supabase Storage / transform limits (do not rely on transforms yet)

## 6. Storage location

- Bucket: **`products`** (public read)
- Public URL shape:  
  `https://{project}.supabase.co/storage/v1/object/public/products/{slug}/image-01.webp`

## 7. Cache behavior

- Admin product uploads use **timestamped paths** → safe to set `Cache-Control: 31536000` on the object.
- Scripted catalog uploads to stable names (`image-01.webp`) also set long cache; **re-upload replaces** the object when masters change (no query-string busting).
- Do **not** apply immutable caching to buckets/paths that overwrite the same URL without a new key.

## 8. How `product_images` should reference images

- One row per gallery frame: `url`, `alt`, `storage_path`, `sort_order`, `is_primary`
- `products.image_url` = primary (`sort_order = 0`) Storage URL
- Prefer absolute Storage URLs over `/catalog/...` for production

## 9. How ProductCard receives images

- `product.images[0]?.src` or `product.image_url`
- Via `getProductImgProps({ role: "card", priority })`
- Aspect **3:4**; fallback `PRODUCT_IMAGE_FALLBACK` (`/placeholder.svg`)

## 10. How PDP receives images

- Full `product.images[]` into `ProductGallery`
- Main: `role: "pdpMain"`, priority only for the main LCP frame
- Thumbs: `role: "thumb"`, lazy
- Fullscreen: `role: "pdpFullscreen"` only when opened (same original URL until transforms exist)

## 11. When lazy loading is used

- Home rails, related, recently viewed, search thumbs, category strip, collection banner, non-LCP cards, PDP thumbs

## 12. When high priority is allowed

- Homepage hero **primary** mosaic tile only
- Shop grid: **first card only** (`index === 0`)
- PDP main gallery image
- Never “first N products” by habit on below-the-fold rails

## 13. Alt-text convention

- Meaningful: product name (and gallery alt when present)
- Decorative / chrome: `alt=""`
- Never filenames (`01.png`, `image-01.webp`)

## 14. What NOT to upload

- QR codes, watermarks, accidental logos, UI screenshots
- Aggressively crushed masters that lose textile / embroidery / border detail
- Invented / AI-replaced product photos for real SKUs
- Bundle imports of catalog images into the frontend build

## Transforms (future)

- Endpoint currently **403** on this project — keep `VITE_SUPABASE_IMAGE_TRANSFORMS` unset/false
- When enabled and verified, `productImage.ts` emits `srcSet` at **400 / 600 / 800 / 1200 / 1600** without component rewrites

## Migration note (SANI / ROOH)

- Local files: `public/catalog/akmc-sani-1007/01.png`–`07.png`, `public/catalog/akmc-rooh-0002/01.png`–`08.png`
- Script: `scripts/migrate-sani-rooh-to-storage.mjs`
- Keep local files until Storage URLs are verified on homepage + PDP
