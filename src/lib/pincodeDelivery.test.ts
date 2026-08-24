import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  checkPincodeServiceability,
  isValidIndianPincode,
  mockDeliveryAvailable,
  resolvePincodeLocation,
} from "./pincodeDelivery";

describe("isValidIndianPincode", () => {
  it("accepts exactly 6 digits", () => {
    expect(isValidIndianPincode("560102")).toBe(true);
  });

  it("rejects short, long, empty, and non-numeric", () => {
    expect(isValidIndianPincode("123")).toBe(false);
    expect(isValidIndianPincode("1234567")).toBe(false);
    expect(isValidIndianPincode("")).toBe(false);
    expect(isValidIndianPincode("12A456")).toBe(false);
  });
});

describe("mockDeliveryAvailable", () => {
  it("marks 560102 as available (digit sum not divisible by 3)", () => {
    expect(mockDeliveryAvailable("560102")).toBe(true);
  });

  it("marks digit-sum multiples of 3 as unavailable", () => {
    // 1+1+0+0+0+1 = 3
    expect(mockDeliveryAvailable("110001")).toBe(false);
  });
});

describe("resolvePincodeLocation", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            Status: "Success",
            PostOffice: [
              {
                Name: "HSR Layout",
                District: "Bangalore",
                State: "Karnataka",
                DeliveryStatus: "Delivery",
              },
            ],
          },
        ],
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps postal office fields to location", async () => {
    const loc = await resolvePincodeLocation("560102");
    expect(loc).toEqual({
      area: "HSR Layout",
      city: "Bangalore",
      state: "Karnataka",
    });
  });
});

describe("checkPincodeServiceability", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            Status: "Success",
            PostOffice: [
              {
                Name: "HSR Layout",
                District: "Bangalore",
                State: "Karnataka",
                DeliveryStatus: "Delivery",
              },
            ],
          },
        ],
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns available + location for serviceable pin", async () => {
    const result = await checkPincodeServiceability("560102");
    expect(result.available).toBe(true);
    expect(result.location?.area).toBe("HSR Layout");
  });

  it("returns unavailable for mock-negative pin", async () => {
    const result = await checkPincodeServiceability("110001");
    expect(result.available).toBe(false);
  });
});
