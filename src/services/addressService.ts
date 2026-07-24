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

export async function getProfile(userId: string): Promise<Profile | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<Profile | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("profiles")
    .upsert({ ...profile, updated_at: new Date().toISOString() })
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function listAddresses(userId: string): Promise<Address[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
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
  if (!client) throw new Error("Supabase not configured");
  const payload = { ...address, user_id: userId, updated_at: new Date().toISOString() };
  if (address.id) {
    const { data, error } = await client.from("addresses").update(payload).eq("id", address.id).select("*").single();
    if (error) throw error;
    return data as Address;
  }
  const { data, error } = await client.from("addresses").insert(payload).select("*").single();
  if (error) throw error;
  return data as Address;
}

export async function deleteAddress(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from("addresses").delete().eq("id", id);
  if (error) throw error;
}

export async function setDefaultAddress(userId: string, id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from("addresses").update({ is_default: false }).eq("user_id", userId);
  const { error } = await client.from("addresses").update({ is_default: true }).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
