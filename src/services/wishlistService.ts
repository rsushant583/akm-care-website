import { getSupabaseClient } from "@/lib/supabaseClient";
import { isUuid } from "@/services/cartService";

export async function syncWishlist(params: {
  sessionId: string;
  userId?: string | null;
  productIds: string[];
}) {
  const client = getSupabaseClient();
  if (!client) return;
  if (!params.userId) return; // guests: localStorage only (C3)

  const ids = params.productIds.filter(isUuid);
  await client.from("wishlists").delete().eq("user_id", params.userId);
  if (ids.length === 0) return;
  const { error } = await client.from("wishlists").insert(
    ids.map((product_id) => ({
      user_id: params.userId,
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
  if (!client || !params.userId) return [];
  const { data, error } = await client.from("wishlists").select("product_id").eq("user_id", params.userId);
  if (error) throw error;
  return (data || []).map((r) => String(r.product_id));
}

export function mergeWishlistIds(local: string[], remote: string[]): string[] {
  return [...new Set([...remote, ...local])];
}
