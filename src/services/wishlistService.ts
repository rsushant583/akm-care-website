import { getSupabaseClient } from "@/lib/supabaseClient";
import { isUuid } from "@/services/cartService";

async function requireAuthUserId(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user.id;
}

export async function syncWishlist(params: {
  sessionId: string;
  userId?: string | null;
  productIds: string[];
}) {
  const client = getSupabaseClient();
  if (!client) return;
  const authId = await requireAuthUserId();
  if (!authId) return;
  if (params.userId && params.userId !== authId) return;

  const ids = params.productIds.filter(isUuid);
  await client.from("wishlists").delete().eq("user_id", authId);
  if (ids.length === 0) return;
  const { error } = await client.from("wishlists").insert(
    ids.map((product_id) => ({
      user_id: authId,
      session_id: params.sessionId,
      product_id,
    })),
  );
  if (error) throw error;
}

export async function loadWishlistIds(params: {
  sessionId: string;
  userId?: string | null;
}): Promise<string[]> {
  const client = getSupabaseClient();
  const authId = await requireAuthUserId();
  if (!client || !authId) return [];
  if (params.userId && params.userId !== authId) return [];
  const { data, error } = await client.from("wishlists").select("product_id").eq("user_id", authId);
  if (error) throw error;
  return (data || []).map((r) => String(r.product_id));
}

export function mergeWishlistIds(local: string[], remote: string[]): string[] {
  return [...new Set([...remote, ...local])];
}
