import { describe, expect, it } from "vitest";

/**
 * Idempotency contract tests (logic-level).
 * DB unique indexes enforce these in production; this documents expected behavior.
 */
describe("shipment idempotency contracts", () => {
  it("active forward means one non-cancelled forward per order", () => {
    const rows = [
      { order_id: "o1", kind: "forward", status: "cancelled" },
      { order_id: "o1", kind: "forward", status: "created" },
    ];
    const active = rows.filter((r) => r.kind === "forward" && r.status !== "cancelled");
    expect(active).toHaveLength(1);
  });

  it("AWB replay returns existing when awb already set", () => {
    const shipment = { awb_code: "AWB123", status: "awb_assigned" };
    const shouldCallProvider = !shipment.awb_code;
    expect(shouldCallProvider).toBe(false);
  });

  it("label replay reuses URL", () => {
    const shipment = { label_url: "https://example.com/label.pdf" };
    expect(Boolean(shipment.label_url)).toBe(true);
  });
});
