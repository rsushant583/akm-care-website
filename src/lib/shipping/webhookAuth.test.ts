import { describe, expect, it } from "vitest";
import { timingSafeEqualString, validateShippingWebhookKey } from "./webhookAuth";

describe("webhookAuth", () => {
  it("accepts matching key", () => {
    expect(validateShippingWebhookKey("secret-token", "secret-token")).toEqual({ ok: true });
  });

  it("rejects missing / invalid / unconfigured", () => {
    expect(validateShippingWebhookKey(null, "secret").reason).toBe("missing");
    expect(validateShippingWebhookKey("wrong", "secret").reason).toBe("invalid");
    expect(validateShippingWebhookKey("x", "").reason).toBe("not_configured");
  });

  it("timingSafeEqualString distinguishes length", () => {
    expect(timingSafeEqualString("abc", "abc")).toBe(true);
    expect(timingSafeEqualString("abc", "abd")).toBe(false);
    expect(timingSafeEqualString("abc", "ab")).toBe(false);
  });
});
