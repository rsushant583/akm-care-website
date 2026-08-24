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

export type AddressInput = Omit<Address, "id" | "user_id"> & { id?: string };

function normText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normPhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function normPin(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 6);
}

/**
 * Canonical content fingerprint for duplicate detection within a single user.
 * Does NOT include user_id — callers must always scope by user.
 */
export function addressContentFingerprint(
  address: Pick<Address, "label" | "full_name" | "phone" | "pincode" | "state" | "city" | "area" | "landmark">,
): string {
  return [
    address.label,
    normText(address.full_name),
    normPhone(address.phone),
    normPin(address.pincode),
    normText(address.state),
    normText(address.city),
    normText(address.area),
    normText(address.landmark),
  ].join("|");
}

export function addressesContentEqual(
  a: Pick<Address, "label" | "full_name" | "phone" | "pincode" | "state" | "city" | "area" | "landmark">,
  b: Pick<Address, "label" | "full_name" | "phone" | "pincode" | "state" | "city" | "area" | "landmark">,
): boolean {
  return addressContentFingerprint(a) === addressContentFingerprint(b);
}

/** Prefer default, then oldest — keeps one card per unique content. */
export function dedupeAddressesForDisplay(rows: Address[]): Address[] {
  const seen = new Map<string, Address>();
  const ordered = [...rows].sort((a, b) => {
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
  for (const row of ordered) {
    const key = addressContentFingerprint(row);
    if (!seen.has(key)) seen.set(key, row);
  }
  return Array.from(seen.values());
}

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
  return dedupeAddressesForDisplay((data || []) as Address[]);
}

export async function findMatchingAddress(
  userId: string,
  address: AddressInput,
): Promise<Address | null> {
  const client = getSupabaseClient();
  const authId = await requireAuthUserId();
  if (!client || !authId || authId !== userId) return null;

  const { data, error } = await client
    .from("addresses")
    .select("*")
    .eq("user_id", authId)
    .eq("label", address.label)
    .eq("pincode", normPin(address.pincode));
  if (error) throw error;

  const target = addressContentFingerprint(address);
  const match = ((data || []) as Address[]).find(
    (row) => addressContentFingerprint(row) === target,
  );
  return match ?? null;
}

/**
 * Idempotent save:
 * - With id → update that row (scoped to user)
 * - Without id → update matching content for this user, else insert once
 */
export async function saveAddress(userId: string, address: AddressInput): Promise<Address> {
  const client = getSupabaseClient();
  const authId = await requireAuthUserId();
  if (!client) throw new Error("Supabase not configured");
  if (!authId || authId !== userId) throw new Error("Not authorized");

  const normalized: AddressInput = {
    ...address,
    full_name: address.full_name.trim(),
    phone: address.phone.trim(),
    pincode: normPin(address.pincode),
    state: address.state.trim(),
    city: address.city.trim(),
    area: address.area.trim(),
    landmark: address.landmark?.trim() || null,
  };

  const payload = {
    label: normalized.label,
    full_name: normalized.full_name,
    phone: normalized.phone,
    pincode: normalized.pincode,
    state: normalized.state,
    city: normalized.city,
    area: normalized.area,
    landmark: normalized.landmark,
    is_default: normalized.is_default,
    user_id: authId,
    updated_at: new Date().toISOString(),
  };

  if (normalized.id) {
    const { data, error } = await client
      .from("addresses")
      .update(payload)
      .eq("id", normalized.id)
      .eq("user_id", authId)
      .select("*")
      .single();
    if (error) throw error;
    return data as Address;
  }

  const existing = await findMatchingAddress(authId, normalized);
  if (existing) {
    const { data, error } = await client
      .from("addresses")
      .update(payload)
      .eq("id", existing.id)
      .eq("user_id", authId)
      .select("*")
      .single();
    if (error) throw error;
    return data as Address;
  }

  const { data, error } = await client.from("addresses").insert(payload).select("*").single();
  if (error) {
    // Unique index race: re-fetch match and update
    if (error.code === "23505") {
      const raced = await findMatchingAddress(authId, normalized);
      if (raced) {
        const { data: updated, error: updateError } = await client
          .from("addresses")
          .update(payload)
          .eq("id", raced.id)
          .eq("user_id", authId)
          .select("*")
          .single();
        if (updateError) throw updateError;
        return updated as Address;
      }
    }
    throw error;
  }
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
