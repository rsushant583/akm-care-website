import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import * as authService from "@/services/authService";
import { getProfile, upsertProfile, type Profile } from "@/services/addressService";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signInGoogle: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    try {
      const p = await getProfile(uid);
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const s = await authService.getSession();
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) await loadProfile(s.user.id);
      setLoading(false);
    })();

    const { data } = authService.onAuthStateChange((s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) void loadProfile(s.user.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await authService.signInWithEmail(email, password);
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    const { error } = await authService.signUpWithEmail({ email, password, fullName });
    return { error: error?.message ?? null };
  }, []);

  const signInGoogle = useCallback(async () => {
    const { error } = await authService.signInWithGoogle();
    return { error: error?.message ?? null };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await authService.resetPassword(email);
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [loadProfile, user]);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!user) return { error: "Not signed in" };
      try {
        const next = await upsertProfile({ id: user.id, ...profile, ...patch });
        setProfile(next);
        return { error: null };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Failed to update profile" };
      }
    },
    [profile, user],
  );

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signInGoogle,
      resetPassword,
      signOut,
      refreshProfile,
      updateProfile,
    }),
    [
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signInGoogle,
      resetPassword,
      signOut,
      refreshProfile,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
