import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";

export default function AccountProfilePage() {
  const { user, profile, updateProfile, resetPassword } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
  }, [profile]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
    });
    setSaving(false);
    if (error) toast.error(error);
    else toast.success("Profile updated");
  };

  const onResetPassword = async () => {
    if (!user?.email) return;
    setResetting(true);
    const { error } = await resetPassword(user.email);
    setResetting(false);
    if (error) toast.error(error);
    else toast.success("Password reset email sent. Check your inbox.");
  };

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h2 className="font-heading text-2xl">Profile</h2>
        <p className="text-sm text-[#6B6B6B] mt-1">Update your personal details.</p>
      </div>

      <form onSubmit={onSave} className="rounded-2xl border border-black/[0.06] bg-white p-5 space-y-4">
        <label className="block text-sm">
          <span className="font-medium">Full name</span>
          <input
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 min-h-11"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Phone</span>
          <input
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 min-h-11"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Email</span>
          <input
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 min-h-11 bg-[#FAF8F5]"
            value={user?.email || ""}
            disabled
            readOnly
          />
          <span className="text-xs text-[#6B6B6B] mt-1 block">Email is tied to your sign-in and cannot be changed here.</span>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 text-sm min-h-11 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-5 space-y-3">
        <h3 className="font-semibold">Account security</h3>
        <p className="text-sm text-[#6B6B6B]">
          Use password reset to change your password. We never show admin or role information on this page.
        </p>
        <button
          type="button"
          disabled={resetting || !user?.email}
          onClick={() => void onResetPassword()}
          className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold min-h-11 disabled:opacity-60"
        >
          {resetting ? "Sending…" : "Send password reset email"}
        </button>
        <p className="text-sm text-[#6B6B6B]">
          Need help?{" "}
          <Link to="/contact" className="font-semibold text-[#E8621A]">
            Contact support
          </Link>
        </p>
      </section>
    </div>
  );
}
