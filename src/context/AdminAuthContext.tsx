import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  adminSignIn,
  adminSignOut,
  fetchAdminProfile,
  type AdminRole,
  type AdminUser,
} from "@/services/adminAuthService";

type AdminAuthContextValue = {
  user: User | null;
  admin: AdminUser | null;
  role: AdminRole | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async (u: User | null) => {
    // L4: admin privilege comes only from admin_users, never from a leftover JWT/session.
    if (!u) {
      setUser(null);
      setAdmin(null);
      return;
    }
    const profile = await fetchAdminProfile(u.id).catch(() => null);
    if (!profile) {
      setUser(null);
      setAdmin(null);
      return;
    }
    setUser(u);
    setAdmin(profile);
  }, []);

  useEffect(() => {
    const client = getSupabaseClient();
    let mounted = true;
    void (async () => {
      if (!client) {
        setLoading(false);
        return;
      }
      const { data } = await client.auth.getSession();
      if (!mounted) return;
      await hydrate(data.session?.user ?? null);
      setLoading(false);
    })();

    if (!client) return;
    const { data: sub } = client.auth.onAuthStateChange((_e, session) => {
      void hydrate(session?.user ?? null).finally(() => setLoading(false));
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [hydrate]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await adminSignIn(email, password);
    if (result.error) return { error: result.error };
    setUser(result.user);
    setAdmin(result.admin);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await adminSignOut();
    setUser(null);
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      admin,
      role: admin?.role ?? null,
      loading,
      isAdmin: !!admin,
      signIn,
      signOut,
    }),
    [user, admin, loading, signIn, signOut],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
