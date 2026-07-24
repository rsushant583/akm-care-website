import { getSupabaseClient } from "@/lib/supabaseClient";
import type { CartLineItem } from "@/lib/ecommerce/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(id: string) {
  return UUID_RE.test(id);
}

export async function syncCartToDatabase(params: {
  sessionId: string;
  userId?: string | null;
  items: CartLineItem[];
  savedForLater: CartLineItem[];
}) {
  const client = getSupabaseClient();
  if (!client) return;

  const { sessionId, userId, items, savedForLater } = params;

  if (userId) {
    await client.from("cart_items").delete().eq("user_id", userId);
  } else {
    await client.from("cart_items").delete().eq("session_id", sessionId);
  }

  const rows = [...items.map((l) => ({ line: l, saved: false })), ...savedForLater.map((l) => ({ line: l, saved: true }))]
    .filter(({ line }) => isUuid(line.productId))
    .map(({ line, saved }) => ({
      session_id: sessionId,
      user_id: userId || null,
      product_id: line.productId,
      quantity: Math.min(100, Math.max(1, line.quantity)),
      color_id: line.colorId ?? null,
      color_name: line.colorName ?? null,
      variant_id: line.variantId ?? null,
      variant_name: line.variantName ?? null,
      unit_price: line.unitPrice,
      saved_for_later: saved,
      product_snapshot: {
        name: line.name,
        slug: line.slug,
        image: line.image,
        sku: line.sku,
        mrp: line.mrp,
        gstPercent: line.gstPercent,
      },
      updated_at: new Date().toISOString(),
    }));

  if (rows.length === 0) return;
  const { error } = await client.from("cart_items").insert(rows);
  if (error) throw error;
}

export async function loadCartFromDatabase(params: {
  sessionId: string;
  userId?: string | null;
}): Promise<{ items: CartLineItem[]; savedForLater: CartLineItem[] }> {
  const client = getSupabaseClient();
  if (!client) return { items: [], savedForLater: [] };

  let query = client.from("cart_items").select("*");
  if (params.userId) query = query.eq("user_id", params.userId);
  else query = query.eq("session_id", params.sessionId);

  const { data, error } = await query;
  if (error) throw error;

  const toLine = (row: Record<string, unknown>): CartLineItem => {
    const snap = (row.product_snapshot || {}) as Record<string, unknown>;
    return {
      productId: String(row.product_id),
      slug: String(snap.slug || ""),
      name: String(snap.name || "Product"),
      image: String(snap.image || ""),
      sku: String(snap.sku || ""),
      unitPrice: Number(row.unit_price ?? 0),
      mrp: Number(snap.mrp ?? row.unit_price ?? 0),
      gstPercent: Number(snap.gstPercent ?? 5),
      quantity: Number(row.quantity ?? 1),
      colorId: row.color_id ? String(row.color_id) : undefined,
      colorName: row.color_name ? String(row.color_name) : undefined,
      variantId: row.variant_id ? String(row.variant_id) : undefined,
      variantName: row.variant_name ? String(row.variant_name) : undefined,
      maxQuantity: 100,
    };
  };

  const items: CartLineItem[] = [];
  const savedForLater: CartLineItem[] = [];
  for (const row of data || []) {
    const line = toLine(row as Record<string, unknown>);
    if ((row as { saved_for_later?: boolean }).saved_for_later) savedForLater.push(line);
    else items.push(line);
  }
  return { items, savedForLater };
}

/** Merge guest session cart into authenticated user cart (quantities summed). */
export function mergeCartLines(local: CartLineItem[], remote: CartLineItem[]): CartLineItem[] {
  const map = new Map<string, CartLineItem>();
  const key = (l: CartLineItem) => `${l.productId}::${l.colorId ?? ""}::${l.variantId ?? ""}`;
  for (const line of [...remote, ...local]) {
    const k = key(line);
    const existing = map.get(k);
    if (!existing) {
      map.set(k, { ...line });
      continue;
    }
    map.set(k, {
      ...existing,
      quantity: Math.min(existing.maxQuantity || 100, existing.quantity + line.quantity),
    });
  }
  return [...map.values()];
}
