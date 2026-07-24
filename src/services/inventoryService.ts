import { getSupabaseClient } from "@/lib/supabaseClient";

export type InventorySnapshot = {
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  available: number;
  warehouseCode: string;
};

export async function getInventoryForProduct(productId: string): Promise<InventorySnapshot | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from("inventory")
    .select("product_id, quantity_on_hand, quantity_reserved, warehouse_code")
    .eq("product_id", productId)
    .eq("warehouse_code", "DEFAULT")
    .is("variant_id", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    // Fallback to products.stock_quantity
    const { data: product, error: pErr } = await client
      .from("products")
      .select("id, stock_quantity")
      .eq("id", productId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!product) return null;
    const qty = Number(product.stock_quantity ?? 0);
    return {
      productId,
      quantityOnHand: qty,
      quantityReserved: 0,
      available: qty,
      warehouseCode: "DEFAULT",
    };
  }

  const onHand = Number(data.quantity_on_hand ?? 0);
  const reserved = Number(data.quantity_reserved ?? 0);
  return {
    productId: String(data.product_id),
    quantityOnHand: onHand,
    quantityReserved: reserved,
    available: Math.max(0, onHand - reserved),
    warehouseCode: String(data.warehouse_code ?? "DEFAULT"),
  };
}

export async function listLowStock(threshold = 5): Promise<{ product_id: string; quantity_on_hand: number }[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("inventory")
    .select("product_id, quantity_on_hand")
    .lte("quantity_on_hand", threshold)
    .order("quantity_on_hand", { ascending: true })
    .limit(100);

  if (error) throw error;
  return (data || []) as { product_id: string; quantity_on_hand: number }[];
}
