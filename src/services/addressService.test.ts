import { describe, expect, it } from "vitest";
import {
  addressContentFingerprint,
  addressesContentEqual,
  dedupeAddressesForDisplay,
  type Address,
} from "./addressService";

function sample(partial: Partial<Address> & { id: string }): Address {
  return {
    user_id: "user-1",
    label: "home",
    full_name: "Sushant Rai",
    phone: "9180046423",
    pincode: "211004",
    state: "Uttar Pradesh",
    city: "Prayagraj",
    area: "50C/3E Govindpur Post-Teliyarganj Prayagraj",
    landmark: null,
    is_default: false,
    ...partial,
  };
}

describe("addressContentFingerprint", () => {
  it("normalizes whitespace/case and phone digits", () => {
    const a = sample({ id: "1", full_name: "  Sushant   Rai ", phone: "918 004 6423" });
    const b = sample({ id: "2", full_name: "sushant rai", phone: "9180046423" });
    expect(addressContentFingerprint(a)).toBe(addressContentFingerprint(b));
    expect(addressesContentEqual(a, b)).toBe(true);
  });

  it("treats different pincodes as distinct", () => {
    const a = sample({ id: "1", pincode: "211004" });
    const b = sample({ id: "2", pincode: "560102" });
    expect(addressesContentEqual(a, b)).toBe(false);
  });
});

describe("dedupeAddressesForDisplay", () => {
  it("keeps a single card for identical content and prefers default", () => {
    const rows = [
      sample({ id: "a", is_default: false }),
      sample({ id: "b", is_default: true }),
      sample({ id: "c", is_default: false }),
    ];
    const out = dedupeAddressesForDisplay(rows);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("b");
  });

  it("keeps distinct addresses for the same user", () => {
    const rows = [
      sample({ id: "a", area: "Line A" }),
      sample({ id: "b", area: "Line B" }),
    ];
    expect(dedupeAddressesForDisplay(rows)).toHaveLength(2);
  });
});
