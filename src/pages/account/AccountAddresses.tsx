import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { customerSafeMessage } from "@/lib/ecommerce/customerCopy";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
  "Other",
];

function isValidPhone(value: string) {
  return /^[6-9]\d{9}$/.test(value.replace(/\s+/g, ""));
}

export default function AccountAddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [customState, setCustomState] = useState("");
  const [editingId, setEditingId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setAddresses(await listAddresses(user.id));
    } catch (e) {
      setError(customerSafeMessage(e, "Could not load addresses. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const stateOptions = useMemo(() => {
    if (form.state && !STATES.includes(form.state) && form.state !== "Other") {
      return [form.state, ...STATES];
    }
    return STATES;
  }, [form.state]);

  const selectValue = STATES.includes(form.state) || stateOptions.includes(form.state) ? form.state : "Other";

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.full_name.trim()) next.full_name = "Name is required";
    if (!isValidPhone(form.phone)) next.phone = "Enter a valid 10-digit mobile number";
    if (!form.area.trim()) next.area = "Address is required";
    if (!form.city.trim()) next.city = "City is required";
    const resolvedState = selectValue === "Other" ? customState.trim() : form.state.trim();
    if (!resolvedState) next.state = "State is required";
    if (!isValidIndianPincode(form.pincode)) next.pincode = "Enter a valid 6-digit pincode";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;
    setSaving(true);
    try {
      const resolvedState = selectValue === "Other" ? customState.trim() : form.state.trim();
      await saveAddress(user.id, { ...form, state: resolvedState, id: editingId });
      setForm(EMPTY);
      setCustomState("");
      setEditingId(undefined);
      setErrors({});
      await load();
      toast.success(editingId ? "Address updated" : "Address saved");
    } catch (err) {
      toast.error(customerSafeMessage(err, "Could not save address. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(undefined);
    setForm(EMPTY);
    setCustomState("");
    setErrors({});
  };

  const onDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAddress(deleteId);
      setAddresses((prev) => prev.filter((x) => x.id !== deleteId));
      if (editingId === deleteId) cancelEdit();
      toast.success("Address deleted");
    } catch (err) {
      toast.error(customerSafeMessage(err, "Could not delete address. Please try again."));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl">Addresses</h2>
        <p className="text-sm text-[#6B6B6B] mt-1">Saved delivery addresses for checkout.</p>
      </div>

      {loading ? (
        <div className="h-28 rounded-2xl bg-white border animate-pulse" aria-busy="true" role="status">
          <span className="sr-only">Loading addresses</span>
        </div>
      ) : error && addresses.length === 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm" role="alert">
          <p className="font-semibold text-red-800">Unable to load addresses</p>
          <p className="text-red-700 mt-1">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded-full bg-[#1A1A1A] text-white px-4 py-2.5 text-sm font-semibold min-h-11"
          >
            Retry
          </button>
        </div>
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
                  className="text-sm font-semibold min-h-11 px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8621A]"
                  onClick={() => {
                    setEditingId(a.id);
                    const known = STATES.includes(a.state);
                    setForm({
                      label: a.label,
                      full_name: a.full_name,
                      phone: a.phone,
                      pincode: a.pincode,
                      state: known ? a.state : "Other",
                      city: a.city,
                      area: a.area,
                      landmark: a.landmark || "",
                      is_default: a.is_default,
                    });
                    setCustomState(known && a.state !== "Other" ? "" : a.state === "Other" ? "" : a.state);
                    setErrors({});
                  }}
                >
                  Edit
                </button>
                {!a.is_default && user && (
                  <button
                    type="button"
                    className="text-sm font-semibold text-[#E8621A] min-h-11 px-1"
                    onClick={() =>
                      void setDefaultAddress(user.id, a.id)
                        .then(load)
                        .then(() => toast.success("Default address updated"))
                        .catch((err) =>
                          toast.error(customerSafeMessage(err, "Could not update default address.")),
                        )
                    }
                  >
                    Set default
                  </button>
                )}
                <button
                  type="button"
                  className="text-sm font-semibold text-red-600 min-h-11 px-1"
                  onClick={() => setDeleteId(a.id)}
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
            <button type="button" onClick={cancelEdit} className="text-sm font-semibold text-[#6B6B6B] min-h-11">
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
            className={cn(
              "mt-1 w-full rounded-xl border px-3 py-2.5 min-h-11",
              errors.state ? "border-red-400" : "border-black/10",
            )}
            value={selectValue}
            onChange={(e) => {
              const v = e.target.value;
              setForm((f) => ({ ...f, state: v }));
              if (v !== "Other") setCustomState("");
            }}
          >
            {stateOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {selectValue === "Other" ? (
          <label className="block text-sm">
            <span className="font-medium">State / UT name</span>
            <input
              className={cn(
                "mt-1 w-full rounded-xl border px-3 py-2.5 min-h-11",
                errors.state ? "border-red-400" : "border-black/10",
              )}
              value={customState}
              onChange={(e) => setCustomState(e.target.value)}
              autoComplete="address-level1"
            />
          </label>
        ) : null}
        {errors.state && <span className="text-xs text-red-600 block">{errors.state}</span>}

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

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this address?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the saved address from your account. It does not change orders already placed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep address</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onDelete()}>Delete address</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
