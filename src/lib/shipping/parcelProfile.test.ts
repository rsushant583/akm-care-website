import { describe, expect, it } from "vitest";
import {
  EMPTY_PACKED_PARCEL_FORM,
  PACKAGE_REQUIRED_MESSAGE,
  buildCreateShipmentRequest,
  packedParcelValidationMessage,
  parseParcelProfile,
  parcelProfileToForm,
  requirePackedParcel,
  resolveParcelProfile,
} from "./parcelProfile";

describe("parcelProfile", () => {
  it("rejects empty / incomplete profiles", () => {
    expect(parseParcelProfile(null)).toBeNull();
    expect(parseParcelProfile({ weight_kg: 0.5 })).toBeNull();
    expect(parseParcelProfile({ weight_kg: 0, length_cm: 10, breadth_cm: 10, height_cm: 10 })).toBeNull();
  });

  it("rejects zero, negative, and non-numeric values", () => {
    expect(parseParcelProfile({ weight_kg: -1, length_cm: 10, breadth_cm: 10, height_cm: 10 })).toBeNull();
    expect(parseParcelProfile({ weight_kg: "abc", length_cm: 10, breadth_cm: 10, height_cm: 10 })).toBeNull();
    expect(parseParcelProfile({ weight_kg: "", length_cm: 10, breadth_cm: 10, height_cm: 10 })).toBeNull();
    expect(packedParcelValidationMessage(EMPTY_PACKED_PARCEL_FORM)).toBe(PACKAGE_REQUIRED_MESSAGE);
  });

  it("parses valid store default and camelCase packed input", () => {
    const p = parseParcelProfile({ weight_kg: 0.5, length_cm: 30, breadth_cm: 20, height_cm: 5 });
    expect(p).toEqual({ weightKg: 0.5, lengthCm: 30, breadthCm: 20, heightCm: 5 });
    expect(parseParcelProfile({ weightKg: 0.8, lengthCm: 12, breadthCm: 8, heightCm: 4 })).toEqual({
      weightKg: 0.8,
      lengthCm: 12,
      breadthCm: 8,
      heightCm: 4,
    });
  });

  it("never invents defaults when missing", () => {
    const r = resolveParcelProfile({ storeDefault: null, productOverride: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe(PACKAGE_REQUIRED_MESSAGE);
  });

  it("prefers complete product override over store default", () => {
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

  it("prefers explicit packed parcel over product override and store default", () => {
    const r = resolveParcelProfile({
      packedParcel: { weight_kg: 0.9, length_cm: 18, breadth_cm: 12, height_cm: 6 },
      storeDefault: { weight_kg: 1, length_cm: 40, breadth_cm: 30, height_cm: 10 },
      productOverride: {
        package_weight_kg: 0.4,
        package_length_cm: 25,
        package_breadth_cm: 15,
        package_height_cm: 4,
      },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.profile).toEqual({ weightKg: 0.9, lengthCm: 18, breadthCm: 12, heightCm: 6 });
    }
  });

  it("does not treat catalog weight/dimensions text as parcel", () => {
    const r = resolveParcelProfile({
      storeDefault: null,
      productOverride: {
        package_weight_kg: null,
      } as never,
    });
    expect(r.ok).toBe(false);
  });

  it("requirePackedParcel fails closed and never reaches a provider callback", () => {
    let providerCalled = false;
    const callProvider = () => {
      providerCalled = true;
    };
    expect(() => requirePackedParcel(undefined)).toThrow(PACKAGE_REQUIRED_MESSAGE);
    expect(() => requirePackedParcel({ weight_kg: 0, length_cm: 10, breadth_cm: 10, height_cm: 10 })).toThrow(
      PACKAGE_REQUIRED_MESSAGE,
    );
    try {
      requirePackedParcel({ weight_kg: "nope" });
      callProvider();
    } catch {
      // expected
    }
    expect(providerCalled).toBe(false);
    const packed = requirePackedParcel({ weight_kg: 0.5, length_cm: 30, breadth_cm: 20, height_cm: 5 });
    expect(packed.weightKg).toBe(0.5);
  });

  it("uses store default only as a form prefill and does not write credentials into create body", () => {
    const store = parseParcelProfile({ weight_kg: 0.5, length_cm: 30, breadth_cm: 20, height_cm: 5 });
    expect(store).not.toBeNull();
    if (!store) return;
    expect(parcelProfileToForm(store)).toEqual({
      weight_kg: "0.5",
      length_cm: "30",
      breadth_cm: "20",
      height_cm: "5",
    });
    const body = buildCreateShipmentRequest("order-1", store);
    expect(Object.keys(body).sort()).toEqual(["action", "orderId", "parcel"]);
    expect(JSON.stringify(body)).not.toMatch(/password|token|secret|authorization|bearer|email/i);
    expect(body.parcel).toEqual({ weight_kg: 0.5, length_cm: 30, breadth_cm: 20, height_cm: 5 });
  });
});
