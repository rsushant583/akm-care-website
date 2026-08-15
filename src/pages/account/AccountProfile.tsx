import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import { customerSafeMessage } from "@/lib/ecommerce/customerCopy";

function isValidPhone(value: string) {
  const trimmed = value.replace(/\s+/g, "");
  if (!trimmed) return true;
  return /^[6-9]\d{9}$/.test(trimmed);
}

export default function AccountProfilePage() {
  const { user, profile, updateProfile, resetPassword } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
  }, [profile]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Enter your full name.");
      return;
    }
    if (!isValidPhone(phone)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number, or leave it blank.");
      return;
    }
    setPhoneError(null);
    setSaving(true);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
    });
    setSaving(false);
    if (error) toast.error(customerSafeMessage(error, "Could not update profile. Please try again."));
    else toast.success("Profile updated");
  };

  const onResetPassword = async () => {
    if (!user?.email) return;
    setResetting(true);
    const { error } = await resetPassword(user.email);
    setResetting(false);
    if (error) toast.error(customerSafeMessage(error, "Could not send the reset email. Please try again."));
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
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Phone</span>
          <input
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 min-h-11"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) setPhoneError(null);
            }}
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={Boolean(phoneError)}
            aria-describedby={phoneError ? "profile-phone-error" : undefined}
          />
          {phoneError ? (
            <span id="profile-phone-error" className="text-xs text-red-600 mt-1 block">
              {phoneError}
            </span>
          ) : (
            <span className="text-xs text-[#6B6B6B] mt-1 block">10-digit Indian mobile number. Optional.</span>
          )}
        </label>
        <label className="block text-sm">
          <span className="font-medium">Email</span>
          <input
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 min-h-11 bg-[#FAF8F5]"
            value={user?.email || ""}
            disabled
            readOnly
          />
          <span className="text-xs text-[#6B6B6B] mt-1 block">
            Email is tied to your sign-in and cannot be changed here.
          </span>
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
