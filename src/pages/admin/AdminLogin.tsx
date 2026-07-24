import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { toast } from "@/components/ui/sonner";

export default function AdminLoginPage() {
  const { signIn, isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isAdmin) navigate("/admin", { replace: true });
  }, [isAdmin, loading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Welcome to Admin");
    navigate("/admin", { replace: true });
  };

  return (
    <>
      <SEO title="Admin Login" canonical="/admin/login" robots="noindex, nofollow" />
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">AKM Care</p>
            <h1 className="text-2xl font-bold mt-1">Admin Portal</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in with your staff account. Access is role-restricted.</p>
          </div>
          <label className="block text-sm">
            <span className="font-medium">Email</span>
            <input
              required
              type="email"
              autoComplete="username"
              className="mt-1 w-full rounded-xl border px-3 py-2.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Password</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-xl border px-3 py-2.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-orange-500 text-white font-semibold py-3 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in to Admin"}
          </button>
          <p className="text-xs text-slate-500 leading-relaxed">
            Access requires a Supabase Auth user listed in <code className="text-[11px]">admin_users</code>.
            Create the first Super Admin with <code className="text-[11px]">npm run admin:bootstrap</code>, then sign in here.
            Product saves use your session + RLS (no browser service-role key).
          </p>
          <p className="text-center text-xs text-slate-500">
            <Link to="/" className="text-orange-600 font-semibold">
              ← Back to storefront
            </Link>
          </p>
        </form>
      </div>
    </>
  );
}
