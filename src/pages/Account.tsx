import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import {
  deleteAddress,
  listAddresses,
  saveAddress,
  setDefaultAddress,
  type Address,
} from "@/services/addressService";
import { listOrdersForUser, type OrderHeader } from "@/services/orderService";
import { toast } from "@/components/ui/sonner";
import { formatINR } from "@/lib/ecommerce/pricing";
import { cn } from "@/lib/utils";

type Tab = "profile" | "orders" | "wishlist" | "addresses" | "payments" | "returns";

const EMPTY_ADDRESS = {
  label: "home" as const,
  full_name: "",
  phone: "",
  pincode: "",
  state: "Gujarat",
  city: "",
  area: "",
  landmark: "",
  is_default: false,
};

export default function AccountPage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const [tab, setTab] = useState<Tab>("profile");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [orders, setOrders] = useState<OrderHeader[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDRESS);
  const [editingId, setEditingId] = useState<string | undefined>();

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    void listOrdersForUser(user.id).then(setOrders).catch(() => setOrders([]));
    void listAddresses(user.id).then(setAddresses).catch(() => setAddresses([]));
  }, [user]);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await updateProfile({ full_name: fullName, phone });
    if (error) toast.error(error);
    else toast.success("Profile updated");
  };

  const onSaveAddress = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await saveAddress(user.id, { ...addrForm, id: editingId });
      setAddresses(await listAddresses(user.id));
      setAddrForm(EMPTY_ADDRESS);
      setEditingId(undefined);
      toast.success("Address saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save address");
    }
  };

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "profile", label: "Profile" },
    { id: "orders", label: "Orders", badge: orders.length },
    { id: "wishlist", label: "Wishlist", badge: wishlistCount },
    { id: "addresses", label: "Addresses", badge: addresses.length },
    { id: "payments", label: "Saved Payments" },
    { id: "returns", label: "Returns" },
  ];

  return (
    <>
      <SEO title="My Account" description="Manage your AKM Care profile, orders, wishlist, and addresses." canonical="/account" robots="noindex, follow" />
      <section className="section-padding bg-white">
        <div className="container-premium">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl">My Account</h1>
              <p className="text-sm text-[#6B6B6B] mt-1">{user?.email}</p>
            </div>
            <button type="button" onClick={() => void signOut()} className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold">
              Sign out
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold border",
                  tab === t.id ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "bg-white border-black/10",
                )}
              >
                {t.label}
                {t.badge != null && t.badge > 0 ? ` (${t.badge})` : ""}
              </button>
            ))}
          </div>

          {tab === "profile" && (
            <form onSubmit={saveProfile} className="max-w-lg space-y-4 rounded-2xl border border-black/[0.06] p-6 bg-[#FAF8F5]">
              <label className="block text-sm">
                <span className="font-medium">Full name</span>
                <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 bg-white" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Phone</span>
                <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 bg-white" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Email</span>
                <input className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 bg-white" value={user?.email || ""} disabled />
              </label>
              <button type="submit" className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5">
                Save profile
              </button>
            </form>
          )}

          {tab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-sm text-[#6B6B6B]">
                  No orders yet.{" "}
                  <Link className="text-[#E8621A] font-semibold" to="/shop">
                    Start shopping
                  </Link>
                </p>
              ) : (
                orders.map((o) => (
                  <Link
                    key={o.id}
                    to={
                      o.access_token
                        ? `/order-success?order=${encodeURIComponent(o.order_number)}&token=${encodeURIComponent(o.access_token)}`
                        : `/order-success?order=${encodeURIComponent(o.order_number)}`
                    }
                    className="block rounded-2xl border border-black/[0.06] p-4 hover:border-[#E8621A]/40"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold">{o.order_number}</p>
                        <p className="text-xs text-[#6B6B6B]">{new Date(o.created_at).toLocaleString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#E8621A]">{formatINR(Number(o.grand_total))}</p>
                        <p className="text-xs uppercase tracking-wide">{o.status}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === "wishlist" && (
            <p className="text-sm text-[#6B6B6B]">
              You have {wishlistCount} saved item{wishlistCount === 1 ? "" : "s"}.{" "}
              <Link to="/wishlist" className="font-semibold text-[#E8621A]">
                Open wishlist
              </Link>
            </p>
          )}

          {tab === "addresses" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {addresses.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-black/[0.06] p-4 bg-[#FAF8F5]">
                    <p className="text-xs uppercase tracking-wide text-[#E8621A] font-semibold">
                      {a.label}
                      {a.is_default ? " · Default" : ""}
                    </p>
                    <p className="font-semibold mt-1">{a.full_name}</p>
                    <p className="text-sm text-[#6B6B6B]">
                      {a.area}, {a.city}, {a.state} — {a.pincode}
                    </p>
                    <p className="text-sm text-[#6B6B6B]">{a.phone}</p>
                    <div className="flex gap-3 mt-3">
                      <button
                        type="button"
                        className="text-xs font-semibold"
                        onClick={() => {
                          setEditingId(a.id);
                          setAddrForm({
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
                          className="text-xs font-semibold text-[#E8621A]"
                          onClick={() => void setDefaultAddress(user.id, a.id).then(() => listAddresses(user.id).then(setAddresses))}
                        >
                          Set default
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-xs font-semibold text-destructive"
                        onClick={() => void deleteAddress(a.id).then(() => setAddresses((prev) => prev.filter((x) => x.id !== a.id)))}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={onSaveAddress} className="space-y-3 rounded-2xl border border-black/[0.06] p-5">
                <h2 className="font-heading text-xl">{editingId ? "Edit address" : "Add address"}</h2>
                <select
                  className="w-full rounded-xl border border-black/10 px-3 py-2.5"
                  value={addrForm.label}
                  onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value as Address["label"] }))}
                >
                  <option value="home">Home</option>
                  <option value="office">Office</option>
                  <option value="other">Other</option>
                </select>
                {(["full_name", "phone", "pincode", "state", "city", "area", "landmark"] as const).map((key) => (
                  <input
                    key={key}
                    required={key !== "landmark"}
                    placeholder={key.replace("_", " ")}
                    className="w-full rounded-xl border border-black/10 px-3 py-2.5"
                    value={addrForm[key]}
                    onChange={(e) => setAddrForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                ))}
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={addrForm.is_default} onChange={(e) => setAddrForm((f) => ({ ...f, is_default: e.target.checked }))} />
                  Default address
                </label>
                <button type="submit" className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5">
                  Save address
                </button>
              </form>
            </div>
          )}

          {tab === "payments" && (
            <p className="text-sm text-[#6B6B6B]">Saved payments will appear here in a future update. Cards and UPI tokens are not stored yet.</p>
          )}
          {tab === "returns" && (
            <p className="text-sm text-[#6B6B6B]">Returns are future-ready. Contact support for assistance with eligible orders.</p>
          )}
        </div>
      </section>
    </>
  );
}
