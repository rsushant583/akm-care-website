import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup" | "forgot";

export default function AuthPage() {
  const { signIn, signUp, signInGoogle, resetPassword, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/account";
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && mode !== "forgot") {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, mode, navigate, from]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) toast.error(error);
        else toast.success("Password reset email sent. Check your inbox.");
        return;
      }
      if (mode === "signup") {
        const { error } = await signUp(email, password, fullName);
        if (error) toast.error(error);
        else {
          toast.success("Account created. Please verify your email if required.");
          navigate(from, { replace: true });
        }
        return;
      }
      const { error } = await signIn(email, password);
      if (error) toast.error(error);
      else {
        toast.success("Welcome back");
        navigate(from, { replace: true });
      }
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    const { error } = await signInGoogle();
    setBusy(false);
    if (error) toast.error(error);
  };

  return (
    <>
      <SEO title="Sign in" description="Sign in to AKM Care to manage orders, wishlist, and addresses." canonical="/auth" robots="noindex, follow" />
      <section className="section-padding bg-[#FAF8F5] min-h-[70vh]">
        <div className="container-premium max-w-md mx-auto">
          <h1 className="font-heading text-3xl mb-2 text-center">
            {mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Sign in"}
          </h1>
          <p className="text-sm text-[#6B6B6B] text-center mb-8">
            Access your cart, wishlist, addresses, and orders.
          </p>

          <div className="flex gap-2 justify-center mb-6">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold",
                  mode === m ? "bg-[#E8621A] text-white" : "bg-white border border-black/10",
                )}
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-black/[0.06] bg-white p-6">
            {mode === "signup" && (
              <label className="block text-sm">
                <span className="font-medium">Full name</span>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5"
                />
              </label>
            )}
            <label className="block text-sm">
              <span className="font-medium">Email</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5"
              />
            </label>
            {mode !== "forgot" && (
              <label className="block text-sm">
                <span className="font-medium">Password</span>
                <input
                  required
                  type="password"
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5"
                />
              </label>
            )}

            {mode === "login" && (
              <button type="button" className="text-xs font-semibold text-[#E8621A]" onClick={() => setMode("forgot")}>
                Forgot password?
              </button>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-[#E8621A] text-white font-semibold py-3 disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "forgot" ? "Send reset link" : mode === "signup" ? "Create account" : "Sign in"}
            </button>

            {mode !== "forgot" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onGoogle()}
                className="w-full rounded-full border border-black/10 font-semibold py-3 bg-[#FAF8F5]"
              >
                Continue with Google
              </button>
            )}
          </form>

          <p className="text-center text-sm text-[#6B6B6B] mt-6">
            <Link to="/shop" className="font-semibold text-[#E8621A]">
              Continue shopping
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
