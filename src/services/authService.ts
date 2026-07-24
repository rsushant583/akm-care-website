import type { Session, User, AuthError } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabaseClient";

export type AuthResult = { error: AuthError | null };

export async function getSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user;
}

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase not configured", name: "ConfigError", status: 500 } as AuthError };
  const { error } = await client.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { full_name: params.fullName ?? "" },
      emailRedirectTo: `${window.location.origin}/account`,
    },
  });
  return { error };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase not configured", name: "ConfigError", status: 500 } as AuthError };
  const { error } = await client.auth.signInWithPassword({ email, password });
  return { error };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase not configured", name: "ConfigError", status: 500 } as AuthError };
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/account` },
  });
  return { error };
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase not configured", name: "ConfigError", status: 500 } as AuthError };
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { error };
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase not configured", name: "ConfigError", status: 500 } as AuthError };
  const { error } = await client.auth.updateUser({ password });
  return { error };
}

export async function signOut(): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) return { error: null };
  const { error } = await client.auth.signOut();
  return { error };
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  const client = getSupabaseClient();
  if (!client) {
    callback(null);
    return { data: { subscription: { unsubscribe: () => undefined } } };
  }
  return client.auth.onAuthStateChange((_event, session) => callback(session));
}
