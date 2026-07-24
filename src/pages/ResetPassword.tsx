import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { updatePassword } from "@/services/authService";
import { toast } from "@/components/ui/sonner";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate("/account", { replace: true });
  };

  return (
    <>
      <SEO title="Reset password" canonical="/auth/reset-password" robots="noindex, follow" />
      <section className="section-padding bg-[#FAF8F5] min-h-[60vh]">
        <div className="container-premium max-w-md mx-auto">
          <h1 className="font-heading text-3xl mb-6 text-center">Set a new password</h1>
          <form onSubmit={onSubmit} className="rounded-2xl border border-black/[0.06] bg-white p-6 space-y-4">
            <label className="block text-sm">
              <span className="font-medium">New password</span>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5"
              />
            </label>
            <button type="submit" disabled={busy} className="w-full rounded-full bg-[#E8621A] text-white font-semibold py-3 disabled:opacity-60">
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
          <p className="text-center text-sm mt-6">
            <Link to="/auth" className="font-semibold text-[#E8621A]">
              Back to sign in
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
