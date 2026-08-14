import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  deleteAddress,
  listAddresses,
  saveAddress,
  setDefaultAddress,
  type Address,
} from "@/services/addressService";
import { isValidIndianPincode } from "@/lib/pincodeDelivery";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const EMPTY = {
  label: "home" as Address["label"],
  full_name: "",
  phone: "",
  pincode: "",
  state: "Gujarat",
  city: "",
  area: "",
  landmark: "",
  is_default: false,
};

const STATES = [
  "Andhra Pradesh",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Karnataka",
  "Maharashtra",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
  "Other",
];

function isValidPhone(value: string) {
  return /^[6-9]\d{9}$/.test(value.replace(/\s+/g, ""));
}

export default function AccountAddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setAddresses(await listAddresses(user.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.full_name.trim()) next.full_name = "Name is required";
    if (!isValidPhone(form.phone)) next.phone = "Enter a valid 10-digit mobile number";
    if (!form.area.trim()) next.area = "Address is required";
    if (!form.city.trim()) next.city = "City is required";
    if (!form.state.trim()) next.state = "State is required";
    if (!isValidIndianPincode(form.pincode)) next.pincode = "Enter a valid 6-digit pincode";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;
    setSaving(true);
    try {
      await saveAddress(user.id, { ...form, id: editingId });
      setForm(EMPTY);
      setEditingId(undefined);
      setErrors({});
      await load();
      toast.success(editingId ? "Address updated" : "Address saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(undefined);
    setForm(EMPTY);
    setErrors({});
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl">Addresses</h2>
        <p className="text-sm text-[#6B6B6B] mt-1">Saved delivery addresses for checkout.</p>
      </div>

      {loading ? (
        <div className="h-28 rounded-2xl bg-white border animate-pulse" aria-busy="true" />
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center text-sm text-[#6B6B6B]">
          No saved addresses yet. Add one below.
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-2xl border border-black/[0.06] bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-[#E8621A] font-semibold">
                {a.label}
                {a.is_default ? " · Default" : ""}
              </p>
              <p className="font-semibold mt-1">{a.full_name}</p>
              <p className="text-sm text-[#6B6B6B]">
                {a.area}
                {a.landmark ? `, ${a.landmark}` : ""}
              </p>
              <p className="text-sm text-[#6B6B6B]">
                {a.city}, {a.state} — {a.pincode}
              </p>
              <p className="text-sm text-[#6B6B6B]">{a.phone}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <button
                  type="button"
                  className="text-sm font-semibold min-h-11"
                  onClick={() => {
                    setEditingId(a.id);
                    setForm({
                      label: a.label,
                      full_name: a.full_name,
                      phone: a.phone,
                      pincode: a.pincode,
                      state: a.state,
                      city: a.city,
                      area: a.area,
                      landmark: a.landmark || "",
                      is_default: a.is_default,
                    });
                  }}
                >
                  Edit
                </button>
                {!a.is_default && user && (
                  <button
                    type="button"
                    className="text-sm font-semibold text-[#E8621A] min-h-11"
                    onClick={() =>
                      void setDefaultAddress(user.id, a.id)
                        .then(load)
                        .then(() => toast.success("Default address updated"))
                        .catch((err) => toast.error(err instanceof Error ? err.message : "Update failed"))
                    }
                  >
                    Set default
                  </button>
                )}
                <button
                  type="button"
                  className="text-sm font-semibold text-red-600 min-h-11"
                  onClick={() =>
                    void deleteAddress(a.id)
                      .then(() => setAddresses((prev) => prev.filter((x) => x.id !== a.id)))
                      .then(() => toast.success("Address deleted"))
                      .catch((err) => toast.error(err instanceof Error ? err.message : "Delete failed"))
                  }
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSave} className="rounded-2xl border border-black/[0.06] bg-white p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading text-xl">{editingId ? "Edit address" : "Add address"}</h3>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-sm font-semibold text-[#6B6B6B]">
              Cancel
            </button>
          )}
        </div>

        <label className="block text-sm">
          <span className="font-medium">Label</span>
          <select
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 min-h-11"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value as Address["label"] }))}
          >
            <option value="home">Home</option>
            <option value="office">Office</option>
            <option value="other">Other</option>
          </select>
        </label>

        {(
          [
            ["full_name", "Full name"],
            ["phone", "Phone"],
            ["area", "Address line"],
            ["landmark", "Landmark (optional)"],
            ["city", "City"],
            ["pincode", "Pincode"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="font-medium">{label}</span>
            <input
              className={cn(
                "mt-1 w-full rounded-xl border px-3 py-2.5 min-h-11",
                errors[key] ? "border-red-400" : "border-black/10",
              )}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              required={key !== "landmark"}
              autoComplete={key === "phone" ? "tel" : key === "pincode" ? "postal-code" : "street-address"}
            />
            {errors[key] && <span className="text-xs text-red-600 mt-1 block">{errors[key]}</span>}
          </label>
        ))}

        <label className="block text-sm">
          <span className="font-medium">State</span>
          <select
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 min-h-11"
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
          >
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm min-h-11">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
          />
          Set as default address
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 text-sm min-h-11 disabled:opacity-60"
        >
          {saving ? "Saving…" : editingId ? "Update address" : "Save address"}
        </button>
      </form>
    </div>
  );
}
