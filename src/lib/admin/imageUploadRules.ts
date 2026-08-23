/** Client-side image upload rules for admin product media. */

export const ADMIN_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
export const ADMIN_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const ADMIN_IMAGE_MIN_EDGE = 200; // useful minimum when dimensions are readable

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXT = /\.(jpe?g|png|webp|gif)$/i;

export type ImageValidationResult = { ok: true } | { ok: false; reason: string };

export function validateProductImageFile(file: File): ImageValidationResult {
  const typeOk = ALLOWED_TYPES.has(file.type) || (!file.type && ALLOWED_EXT.test(file.name));
  if (!typeOk) {
    return { ok: false, reason: `"${file.name}" must be JPEG, PNG, WebP, or GIF.` };
  }
  if (file.size <= 0) {
    return { ok: false, reason: `"${file.name}" is empty or unreadable.` };
  }
  if (file.size > ADMIN_IMAGE_MAX_BYTES) {
    return { ok: false, reason: `"${file.name}" exceeds the 5 MB upload limit.` };
  }
  return { ok: true };
}

export function filterValidProductImages(files: File[]): { accepted: File[]; rejected: string[] } {
  const accepted: File[] = [];
  const rejected: string[] = [];
  for (const file of files) {
    const result = validateProductImageFile(file);
    if (result.ok) accepted.push(file);
    else rejected.push(result.reason);
  }
  return { accepted, rejected };
}

/** Optional dimension check — skips quietly if the browser cannot decode. */
export function checkImageMinDimensions(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve({ ok: true });
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.naturalWidth < ADMIN_IMAGE_MIN_EDGE || img.naturalHeight < ADMIN_IMAGE_MIN_EDGE) {
        resolve({
          ok: false,
          reason: `"${file.name}" is too small (min ${ADMIN_IMAGE_MIN_EDGE}×${ADMIN_IMAGE_MIN_EDGE}px).`,
        });
        return;
      }
      resolve({ ok: true });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, reason: `"${file.name}" could not be read as an image.` });
    };
    img.src = url;
  });
}

export async function validateProductImages(files: File[]): Promise<{ accepted: File[]; rejected: string[] }> {
  const { accepted: typeOk, rejected } = filterValidProductImages(files);
  const accepted: File[] = [];
  for (const file of typeOk) {
    const dim = await checkImageMinDimensions(file);
    if (dim.ok) accepted.push(file);
    else rejected.push(dim.reason);
  }
  return { accepted, rejected };
}
