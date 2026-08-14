import { getSupabaseClient } from "@/lib/supabaseClient";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

export type Address = {
  id: string;
  user_id: string;
  label: "home" | "office" | "other";
  full_name: string;
  phone: string;
  pincode: string;
  state: string;
  city: string;
  area: string;
  landmark: string | null;
  is_default: boolean;
};

async function requireAuthUserId(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user.id;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const client = getSupabaseClient();
  const authId = await requireAuthUserId();
  if (!client || !authId || authId !== userId) return null;
  const { data, error } = await client
    .from("profiles")
    .select("id,full_name,email,phone,avatar_url")
    .eq("id", authId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

/** Only allow safe customer-editable profile fields — never role/admin metadata. */
export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<Profile | null> {
  const client = getSupabaseClient();
  const authId = await requireAuthUserId();
  if (!client || !authId || authId !== profile.id) return null;
  const safe = {
    id: authId,
    full_name: profile.full_name ?? null,
    phone: profile.phone ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await client
    .from("profiles")
    .upsert(safe)
    .select("id,full_name,email,phone,avatar_url")
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function listAddresses(userId: string): Promise<Address[]> {
  const client = getSupabaseClient();
  const authId = await requireAuthUserId();
  if (!client || !authId || authId !== userId) return [];
  const { data, error } = await client
    .from("addresses")
    .select("*")
    .eq("user_id", authId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Address[];
}

export async function saveAddress(
  userId: string,
  address: Omit<Address, "id" | "user_id"> & { id?: string },
): Promise<Address> {
  const client = getSupabaseClient();
  const authId = await requireAuthUserId();
  if (!client) throw new Error("Supabase not configured");
  if (!authId || authId !== userId) throw new Error("Not authorized");
  const payload = { ...address, user_id: authId, updated_at: new Date().toISOString() };
  if (address.id) {
    const { data, error } = await client
      .from("addresses")
      .update(payload)
      .eq("id", address.id)
      .eq("user_id", authId)
      .select("*")
      .single();
    if (error) throw error;
    return data as Address;
  }
  const { data, error } = await client.from("addresses").insert(payload).select("*").single();
  if (error) throw error;
  return data as Address;
}

export async function deleteAddress(id: string): Promise<void> {
  const client = getSupabaseClient();
  const authId = await requireAuthUserId();
  if (!client || !authId) return;
  const { error } = await client.from("addresses").delete().eq("id", id).eq("user_id", authId);
  if (error) throw error;
}

export async function setDefaultAddress(userId: string, id: string): Promise<void> {
  const client = getSupabaseClient();
  const authId = await requireAuthUserId();
  if (!client || !authId || authId !== userId) return;
  await client.from("addresses").update({ is_default: false }).eq("user_id", authId);
  const { error } = await client
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", authId);
  if (error) throw error;
}
