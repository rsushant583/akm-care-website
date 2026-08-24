/**
 * Pure helpers mirroring checkout address save contract — keeps UI free of
 * accidental insert-without-id regressions.
 */
import { describe, expect, it } from "vitest";
import {
  addressContentFingerprint,
  addressesContentEqual,
  type Address,
} from "@/services/addressService";

type DraftShape = {
  customer: { name: string; phone: string };
  address: { line1: string; line2: string; city: string; state: string; pincode: string };
};

function draftToAddressShape(
  draft: DraftShape,
  label: "home" | "office" | "other",
): Pick<Address, "label" | "full_name" | "phone" | "pincode" | "state" | "city" | "area" | "landmark"> {
  return {
    label,
    full_name: draft.customer.name,
    phone: draft.customer.phone,
    pincode: draft.address.pincode,
    state: draft.address.state,
    city: draft.address.city,
    area: draft.address.line1,
    landmark: draft.address.line2 || null,
  };
}

/** Simulates goNext save payload selection. */
function resolveSaveId(
  selectedSavedId: string | null,
  saved: Address[],
  draft: DraftShape,
  label: "home" | "office" | "other",
): string | undefined {
  if (selectedSavedId) return selectedSavedId;
  const shape = draftToAddressShape(draft, label);
  const match = saved.find((row) => addressesContentEqual(row, shape));
  return match?.id;
}

describe("checkout address save contract", () => {
  const draft: DraftShape = {
    customer: { name: "Sushant Rai", phone: "9180046423" },
    address: {
      line1: "50C/3E Govindpur",
      line2: "",
      city: "Prayagraj",
      state: "Uttar Pradesh",
      pincode: "211004",
    },
  };

  const saved: Address[] = [
    {
      id: "canonical-id",
      user_id: "u1",
      label: "home",
      full_name: "Sushant Rai",
      phone: "9180046423",
      pincode: "211004",
      state: "Uttar Pradesh",
      city: "Prayagraj",
      area: "50C/3E Govindpur",
      landmark: null,
      is_default: true,
    },
  ];

  it("selecting an existing address keeps the same id for save", () => {
    expect(resolveSaveId("canonical-id", saved, draft, "home")).toBe("canonical-id");
  });

  it("matching draft content without selectedSavedId still resolves to existing id", () => {
    expect(resolveSaveId(null, saved, draft, "home")).toBe("canonical-id");
  });

  it("genuinely new content has no id (insert once)", () => {
    const next = {
      ...draft,
      address: { ...draft.address, line1: "Brand new street 12" },
    };
    expect(resolveSaveId(null, saved, next, "home")).toBeUndefined();
  });

  it("fingerprint is stable across whitespace for hydration matching", () => {
    const a = draftToAddressShape(draft, "home");
    const b = {
      ...a,
      area: "  50C/3E   Govindpur ",
      full_name: "SUSHANT RAI",
    };
    expect(addressContentFingerprint(a)).toBe(addressContentFingerprint(b));
  });
});
