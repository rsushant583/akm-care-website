const PURCHASE_KEY_PREFIX = "ga4_purchase_";

function storageKey(orderNumber: string) {
  return `${PURCHASE_KEY_PREFIX}${orderNumber.trim()}`;
}

/** Returns true if this order_number was already tracked in the current browser session. */
export function hasTrackedPurchase(orderNumber: string): boolean {
  const key = storageKey(orderNumber);
  if (!key || key === PURCHASE_KEY_PREFIX) return false;
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/** Mark order_number as tracked for the current browser session. */
export function markPurchaseTracked(orderNumber: string): void {
  const key = storageKey(orderNumber);
  if (!key || key === PURCHASE_KEY_PREFIX) return;
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

/** Fire purchase callback at most once per order_number per session. */
export function trackPurchaseOnce(orderNumber: string, fire: () => boolean): boolean {
  const id = orderNumber.trim();
  if (!id) return false;
  if (hasTrackedPurchase(id)) return false;
  if (!fire()) return false;
  markPurchaseTracked(id);
  return true;
}
