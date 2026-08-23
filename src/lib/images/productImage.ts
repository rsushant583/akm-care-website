/**
 * Central product-image helpers for the AKM Care storefront.
 *
 * Phase 8.2: transforms remain OFF. Probed `/storage/v1/render/image/...` → HTTP 403.
 * Do not emit render URLs until Storage Image Transformations are enabled and verified.
 *
 * Opt-in only via VITE_SUPABASE_IMAGE_TRANSFORMS=true (keep false in all current envs).
 */

export const PRODUCT_IMAGE_FALLBACK = "/placeholder.svg";

/**
 * Must stay false until the render endpoint returns 200 on this project.
 * Setting the env alone is not enough if this constant is forced false in CI notes —
 * we still honor the env so enabling later does not require a code rewrite.
 */
export const SUPABASE_IMAGE_TRANSFORMS_ENABLED =
  String(import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORMS || "").toLowerCase() === "true";

export type ProductImageRole =
  | "card"
  | "cardList"
  | "thumb"
  | "pdpMain"
  | "pdpFullscreen"
  | "hero"
  | "category"
  | "banner"
  | "search"
  | "recent"
  | "related";

type TransformOpts = {
  width?: number;
  height?: number;
  /** 20–100; default 82 for fashion (preserve textile detail). */
  quality?: number;
  resize?: "contain" | "cover" | "fill";
};

const ROLE_DIMS: Record<ProductImageRole, { width: number; height: number }> = {
  card: { width: 600, height: 800 },
  cardList: { width: 288, height: 384 },
  thumb: { width: 160, height: 200 },
  pdpMain: { width: 1200, height: 1600 },
  pdpFullscreen: { width: 1600, height: 2133 },
  hero: { width: 800, height: 1000 },
  category: { width: 400, height: 500 },
  banner: { width: 800, height: 640 },
  search: { width: 96, height: 128 },
  recent: { width: 240, height: 320 },
  related: { width: 480, height: 640 },
};

/**
 * Future transform srcSet widths (shared ladder).
 * Only emitted when SUPABASE_IMAGE_TRANSFORMS_ENABLED is true.
 */
export const PRODUCT_IMAGE_SRCSET_WIDTHS = [400, 600, 800, 1200, 1600] as const;

/** Role → subset of the shared ladder (never invent widths outside this set). */
const ROLE_SRCSET_WIDTHS: Record<ProductImageRole, number[]> = {
  card: [400, 600, 800],
  cardList: [400, 600],
  thumb: [400],
  pdpMain: [600, 800, 1200],
  pdpFullscreen: [800, 1200, 1600],
  hero: [600, 800, 1200],
  category: [400, 600],
  banner: [600, 800, 1200],
  search: [400],
  recent: [400, 600],
  related: [400, 600, 800],
};

/**
 * Layout-aware sizes (matched to current storefront grids/rails).
 * Shop grid: 2 / 3 / 4 columns. Rails: ~11–13.25rem cards on mobile.
 */
const ROLE_SIZES: Record<ProductImageRole, string> = {
  card: "(max-width: 639px) 50vw, (max-width: 1279px) 33vw, 25vw",
  cardList: "(max-width: 639px) 7rem, 9rem",
  thumb: "4.25rem",
  pdpMain: "(max-width: 1023px) 100vw, min(36rem, 48vw)",
  pdpFullscreen: "100vw",
  hero: "(max-width: 1023px) 100vw, 50vw",
  category: "(max-width: 1023px) 10.75rem, 16vw",
  banner: "(max-width: 767px) 100vw, 45vw",
  search: "3rem",
  recent: "10rem",
  related: "(max-width: 1023px) 13rem, 25vw",
};

const STORAGE_OBJECT_RE =
  /^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i;

export function isSupabaseStoragePublicUrl(url: string): boolean {
  return STORAGE_OBJECT_RE.test(url.trim());
}

export function resolveProductImageSrc(
  src?: string | null,
  fallback: string = PRODUCT_IMAGE_FALLBACK,
): string {
  const trimmed = typeof src === "string" ? src.trim() : "";
  return trimmed || fallback;
}

/**
 * Build a Storage render URL when transforms are enabled.
 * Returns the original URL otherwise (including local `/catalog/...` paths).
 * Never invents transform URLs while transforms are unavailable.
 */
export function getProductImageUrl(src?: string | null, opts: TransformOpts = {}): string {
  const resolved = resolveProductImageSrc(src);
  if (resolved === PRODUCT_IMAGE_FALLBACK) return resolved;
  if (!SUPABASE_IMAGE_TRANSFORMS_ENABLED) return resolved;

  const match = resolved.match(STORAGE_OBJECT_RE);
  if (!match) return resolved;

  const [, origin, bucket, objectPath] = match;
  const params = new URLSearchParams();
  if (opts.width) params.set("width", String(Math.min(2500, Math.max(1, Math.round(opts.width)))));
  if (opts.height) params.set("height", String(Math.min(2500, Math.max(1, Math.round(opts.height)))));
  params.set("resize", opts.resize || "contain");
  // Fashion default: preserve textile detail over aggressive KB targets.
  params.set("quality", String(opts.quality ?? 82));

  return `${origin}/storage/v1/render/image/public/${bucket}/${objectPath}?${params.toString()}`;
}

export function getProductImageSrcSet(
  src?: string | null,
  role: ProductImageRole = "card",
): string | undefined {
  if (!SUPABASE_IMAGE_TRANSFORMS_ENABLED) return undefined;
  const resolved = resolveProductImageSrc(src);
  if (!isSupabaseStoragePublicUrl(resolved)) return undefined;

  const dims = ROLE_DIMS[role];
  const widths = ROLE_SRCSET_WIDTHS[role];
  return widths
    .map((w) => {
      const h = Math.round((w * dims.height) / dims.width);
      return `${getProductImageUrl(resolved, { width: w, height: h, resize: "contain", quality: 82 })} ${w}w`;
    })
    .join(", ");
}

export function getProductImageSizes(role: ProductImageRole = "card"): string {
  return ROLE_SIZES[role];
}

export function getProductImageDimensions(role: ProductImageRole = "card"): {
  width: number;
  height: number;
} {
  return ROLE_DIMS[role];
}

/** Prefer gallery alt; otherwise product name (never filenames). */
export function getProductImageAlt(
  productName: string,
  imageAlt?: string | null,
  options?: { decorative?: boolean },
): string {
  if (options?.decorative) return "";
  const fromImage = typeof imageAlt === "string" ? imageAlt.trim() : "";
  if (fromImage && !/\.(png|jpe?g|webp|gif|avif)$/i.test(fromImage)) return fromImage;
  return productName.trim() || "Product image";
}

export type ProductImgLoading = {
  src: string;
  srcSet?: string;
  sizes?: string;
  width: number;
  height: number;
  loading: "eager" | "lazy";
  decoding: "async";
  fetchPriority?: "high" | "low" | "auto";
  alt: string;
};

/**
 * Convenience props for storefront <img> elements.
 * Does not change catalog data — only delivery attributes.
 *
 * `priority` must only be true for genuine LCP / above-the-fold images.
 */
export function getProductImgProps(input: {
  src?: string | null;
  alt?: string | null;
  productName?: string;
  role?: ProductImageRole;
  priority?: boolean;
  decorative?: boolean;
}): ProductImgLoading {
  const role = input.role ?? "card";
  const dims = getProductImageDimensions(role);
  const resolved = resolveProductImageSrc(input.src);
  const src = getProductImageUrl(resolved, {
    width: dims.width,
    height: dims.height,
    resize: "contain",
    quality: 82,
  });
  const srcSet = getProductImageSrcSet(resolved, role);
  const priority = Boolean(input.priority);

  return {
    src,
    srcSet,
    sizes: srcSet ? getProductImageSizes(role) : undefined,
    width: dims.width,
    height: dims.height,
    loading: priority ? "eager" : "lazy",
    decoding: "async",
    fetchPriority: priority ? "high" : undefined,
    alt: getProductImageAlt(input.productName || "", input.alt, {
      decorative: input.decorative,
    }),
  };
}
