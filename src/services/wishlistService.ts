import { getSupabaseClient } from "@/lib/supabaseClient";
import { isUuid } from "@/services/cartService";

export async function syncWishlist(params: {
  sessionId: string;
  userId?: string | null;
  productIds: string[];
}) {
  const client = getSupabaseClient();
  if (!client) return;

  const ids = params.productIds.filter(isUuid);
  if (params.userId) {
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
    return;
  }

  await client.from("wishlists").delete().eq("session_id", params.sessionId);
  if (ids.length === 0) return;
  const { error } = await client.from("wishlists").insert(
    ids.map((product_id) => ({
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
  if (!client) return [];
  let query = client.from("wishlists").select("product_id");
  if (params.userId) query = query.eq("user_id", params.userId);
  else query = query.eq("session_id", params.sessionId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((r) => String(r.product_id));
}

export function mergeWishlistIds(local: string[], remote: string[]): string[] {
  return [...new Set([...remote, ...local])];
}
