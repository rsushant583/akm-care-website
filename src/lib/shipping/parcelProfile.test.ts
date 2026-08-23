import { describe, expect, it } from "vitest";
import {
  PACKAGE_REQUIRED_MESSAGE,
  parseParcelProfile,
  resolveParcelProfile,
} from "./parcelProfile";

describe("parcelProfile", () => {
  it("rejects empty / incomplete profiles", () => {
    expect(parseParcelProfile(null)).toBeNull();
    expect(parseParcelProfile({ weight_kg: 0.5 })).toBeNull();
    expect(parseParcelProfile({ weight_kg: 0, length_cm: 10, breadth_cm: 10, height_cm: 10 })).toBeNull();
  });

  it("parses valid store default", () => {
    const p = parseParcelProfile({ weight_kg: 0.5, length_cm: 30, breadth_cm: 20, height_cm: 5 });
    expect(p).toEqual({ weightKg: 0.5, lengthCm: 30, breadthCm: 20, heightCm: 5 });
  });

  it("never invents defaults when missing", () => {
    const r = resolveParcelProfile({ storeDefault: null, productOverride: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe(PACKAGE_REQUIRED_MESSAGE);
  });

  it("prefers complete product override", () => {
    const r = resolveParcelProfile({
      storeDefault: { weight_kg: 1, length_cm: 40, breadth_cm: 30, height_cm: 10 },
      productOverride: {
        package_weight_kg: 0.4,
        package_length_cm: 25,
        package_breadth_cm: 15,
        package_height_cm: 4,
      },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.profile.weightKg).toBe(0.4);
  });

  it("does not treat catalog weight/dimensions text as parcel", () => {
    const r = resolveParcelProfile({
      storeDefault: null,
      productOverride: {
        // Incomplete numeric override — catalog text fields are not consulted here
        package_weight_kg: null,
      } as never,
    });
    expect(r.ok).toBe(false);
  });
});
