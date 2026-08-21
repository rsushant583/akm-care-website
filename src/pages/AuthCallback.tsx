import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { getSupabaseClient } from "@/lib/supabaseClient";

/**
 * Handles Supabase email-confirm / OAuth / recovery redirects.
 * Lands on a public route so session can be established before /account guard.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [message, setMessage] = useState("Confirming your session…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const next = params.get("next") || "/account";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

    void (async () => {
      const client = getSupabaseClient();
      if (!client) {
        if (!cancelled) {
          setFailed(true);
          setMessage("Authentication is not configured. Please contact support.");
        }
        return;
      }

      try {
        // PKCE / code exchange (newer Supabase email links)
        const code = params.get("code");
        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Hash tokens are consumed by detectSessionInUrl on client init
          const { data, error } = await client.auth.getSession();
          if (error) throw error;
          if (!data.session) {
            // Brief wait for onAuthStateChange to finish hashing tokens
            await new Promise((r) => setTimeout(r, 400));
            const again = await client.auth.getSession();
            if (!again.data.session) {
              throw new Error("No session found. The link may have expired.");
            }
          }
        }

        if (!cancelled) navigate(safeNext, { replace: true });
      } catch (e) {
        if (cancelled) return;
        setFailed(true);
        setMessage(e instanceof Error ? e.message : "Could not complete sign-in from this link.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, params]);

  return (
    <>
      <SEO
        title="Confirming account"
        description="Confirming your AKM Care account."
        canonical="/auth/callback"
        robots="noindex, follow"
      />
      <section className="section-padding bg-[#FAF8F5] min-h-[60vh] flex items-center">
        <div className="container-premium max-w-md mx-auto text-center">
          {!failed ? (
            <>
              <span
                className="mx-auto mb-4 block h-9 w-9 rounded-full border-2 border-[#E8621A]/30 border-t-[#E8621A] animate-spin"
                aria-hidden
              />
              <p className="text-sm text-[#6B6B6B]" role="status">
                {message}
              </p>
            </>
          ) : (
            <>
              <h1 className="font-heading text-2xl mb-2">Link issue</h1>
              <p className="text-sm text-[#6B6B6B] mb-6">{message}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link
                  to="/auth"
                  className="rounded-full bg-[#E8621A] text-white font-semibold px-5 py-2.5 text-sm min-h-11 inline-flex items-center"
                >
                  Sign in
                </Link>
                <Link
                  to="/shop"
                  className="rounded-full border border-black/10 bg-white font-semibold px-5 py-2.5 text-sm min-h-11 inline-flex items-center"
                >
                  Continue shopping
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
