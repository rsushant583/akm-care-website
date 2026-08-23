import { describe, expect, it } from "vitest";
import {
  canAdvanceFulfillment,
  canAdvanceShippingStatus,
  mapProviderStatusToShipping,
  shippingEventDedupeKey,
  suggestedFulfillmentFromShipping,
  toProjectionStatus,
} from "./statusMap";

describe("shipping statusMap", () => {
  it("maps provider statuses", () => {
    expect(mapProviderStatusToShipping({ currentStatus: "IN TRANSIT" })).toBe("in_transit");
    expect(mapProviderStatusToShipping({ currentStatus: "OUT FOR DELIVERY" })).toBe("out_for_delivery");
    expect(mapProviderStatusToShipping({ currentStatus: "DELIVERED" })).toBe("delivered");
    expect(mapProviderStatusToShipping({ currentStatus: "RTO Initiated" })).toBe("rto");
    expect(mapProviderStatusToShipping({ currentStatus: "PICKED UP" })).toBe("picked_up");
    expect(mapProviderStatusToShipping({ currentStatus: "SOMETHING WEIRD" })).toBeNull();
  });

  it("enforces monotonic shipping transitions", () => {
    expect(canAdvanceShippingStatus("created", "awb_assigned")).toBe(true);
    expect(canAdvanceShippingStatus("in_transit", "delivered")).toBe(true);
    expect(canAdvanceShippingStatus("delivered", "in_transit")).toBe(false);
    expect(canAdvanceShippingStatus("delivered", "shipped" as never)).toBe(false);
    expect(canAdvanceShippingStatus("delivered", "rto")).toBe(true);
    expect(canAdvanceShippingStatus("picked_up", "cancelled")).toBe(false);
    expect(canAdvanceShippingStatus("awb_assigned", "cancelled")).toBe(true);
  });

  it("never regresses fulfillment", () => {
    expect(canAdvanceFulfillment("packed", "shipped")).toBe(true);
    expect(canAdvanceFulfillment("delivered", "shipped")).toBe(false);
    expect(canAdvanceFulfillment("delivered", "returned")).toBe(true);
    expect(suggestedFulfillmentFromShipping("in_transit")).toBe("shipped");
    expect(suggestedFulfillmentFromShipping("rto")).toBe("returned");
  });

  it("projects safely", () => {
    expect(toProjectionStatus("created")).toBe("pending");
    expect(toProjectionStatus("awb_assigned")).toBe("ready");
    expect(toProjectionStatus("out_for_delivery")).toBe("shipped");
    expect(toProjectionStatus("rto")).toBe("returned");
  });

  it("builds webhook dedupe keys", () => {
    expect(
      shippingEventDedupeKey({
        awb: "AWB1",
        currentStatusId: 20,
        providerTimestamp: "23 05 2023 11:43:52",
      }),
    ).toBe("sr:AWB1:20:23 05 2023 11:43:52");
  });
});
