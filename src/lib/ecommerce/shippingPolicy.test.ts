import { describe, expect, it } from "vitest";
import { SHIPPING_POLICY, formatProductShippingCopy, isCustomShippingWindow } from "./shippingPolicy";

describe("shipping policy", () => {
  it("treats the store standard as the default window", () => {
    expect(SHIPPING_POLICY.standardWindow).toBe("3–5 business days");
    expect(SHIPPING_POLICY.expressWindow).toBe("1–2 business days");
    expect(SHIPPING_POLICY.returnWindowDays).toBe(7);
    expect(isCustomShippingWindow(SHIPPING_POLICY.standardWindow)).toBe(false);
    expect(isCustomShippingWindow("within 24 Hours")).toBe(true);
  });

  it("labels catalog-specific windows without overwriting them", () => {
    const copy = formatProductShippingCopy("within 24 Hours");
    expect(copy).toContain("within 24 Hours");
    expect(copy).toContain(SHIPPING_POLICY.standardWindow);
    expect(formatProductShippingCopy(SHIPPING_POLICY.standardWindow)).toContain(SHIPPING_POLICY.standardWindow);
    expect(formatProductShippingCopy("")).toContain(SHIPPING_POLICY.standardWindow);
  });
});
