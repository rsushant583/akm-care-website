import { getSupabaseClient } from "@/lib/supabaseClient";
import { adminUploadFile } from "@/services/adminDashboardService";

export async function listCoupons() {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("coupons").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertCoupon(payload: Record<string, unknown> & { id?: string; code: string }) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const row = {
    ...payload,
    code: String(payload.code).toUpperCase().trim(),
    updated_at: new Date().toISOString(),
  };
  delete (row as { id?: string }).id;
  if (payload.id) {
    const { data, error } = await client.from("coupons").update(row).eq("id", payload.id).select("*").single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await client.from("coupons").insert(row).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteCoupon(id: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const { error } = await client.from("coupons").delete().eq("id", id);
  if (error) throw error;
}

export async function listBanners() {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("banners").select("*").order("display_order");
  if (error) throw error;
  return data || [];
}

export async function upsertBanner(payload: Record<string, unknown> & { id?: string; title: string; image_url: string }) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const row = { ...payload, updated_at: new Date().toISOString() };
  delete (row as { id?: string }).id;
  if (payload.id) {
    const { data, error } = await client.from("banners").update(row).eq("id", payload.id).select("*").single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await client.from("banners").insert(row).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteBanner(id: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const { error } = await client.from("banners").delete().eq("id", id);
  if (error) throw error;
}

export async function listCmsPages() {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("cms_pages").select("*").order("title");
  if (error) throw error;
  return data || [];
}

export async function updateCmsPage(id: string, content: Record<string, unknown>, title?: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const { data: session } = await client.auth.getUser();
  const { data, error } = await client
    .from("cms_pages")
    .update({
      content,
      title: title || undefined,
      updated_at: new Date().toISOString(),
      updated_by: session.user?.id ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listMedia(opts?: { q?: string; folder?: string }) {
  const client = getSupabaseClient();
  if (!client) return [];
  let q = client.from("media_assets").select("*").order("created_at", { ascending: false }).limit(200);
  if (opts?.folder) q = q.eq("folder", opts.folder);
  if (opts?.q?.trim()) q = q.ilike("name", `%${opts.q.trim()}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function uploadMedia(file: File, folder = "uploads") {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const path = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const { url } = await adminUploadFile({ bucket: "media", path, file });
  const { data: session } = await client.auth.getUser();
  const { data, error } = await client
    .from("media_assets")
    .insert({
      name: file.name,
      url,
      storage_path: path,
      bucket: "media",
      folder,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: session.user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMedia(id: string, storagePath?: string | null) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  if (storagePath) await client.storage.from("media").remove([storagePath]);
  const { error } = await client.from("media_assets").delete().eq("id", id);
  if (error) throw error;
}

export async function getAllSettings() {
  const client = getSupabaseClient();
  if (!client) return {} as Record<string, unknown>;
  const { data, error } = await client.from("site_settings").select("*");
  if (error) throw error;
  const map: Record<string, unknown> = {};
  for (const row of data || []) map[row.key] = row.value;
  return map;
}

export async function saveSetting(key: string, value: Record<string, unknown>) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const { data: session } = await client.auth.getUser();
  const { error } = await client.from("site_settings").upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
    updated_by: session.user?.id ?? null,
  });
  if (error) throw error;
}

export async function adminCrudList(table: string) {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from(table).select("*").order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return data || [];
}

export async function adminCrudUpsert(table: string, payload: Record<string, unknown>, id?: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  if (id) {
    const { error } = await client.from(table).update(payload).eq("id", id);
    if (error) throw error;
    return;
  }
  const { error } = await client.from(table).insert(payload);
  if (error) throw error;
}

export async function adminCrudDelete(table: string, id: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function getAnalytics() {
  const client = getSupabaseClient();
  if (!client) {
    return { topSelling: [], lowStock: [], newCustomers: [], categoryPerf: [] };
  }
  const [products, customers, orders] = await Promise.all([
    client.from("products").select("id, name, popularity, stock_quantity, category_label, category").order("popularity", { ascending: false }).limit(10),
    client.from("profiles").select("id, full_name, email, created_at").order("created_at", { ascending: false }).limit(10),
    client.from("order_items").select("product_name, quantity, line_total").limit(500),
  ]);

  const lowStock = (products.data || [])
    .filter((p) => Number(p.stock_quantity) <= 5)
    .sort((a, b) => Number(a.stock_quantity) - Number(b.stock_quantity))
    .slice(0, 10);

  const catMap = new Map<string, number>();
  for (const p of products.data || []) {
    const name = String(p.category_label || p.category || "Other");
    catMap.set(name, (catMap.get(name) || 0) + 1);
  }

  const sellMap = new Map<string, number>();
  for (const row of orders.data || []) {
    const name = String(row.product_name || "Item");
    sellMap.set(name, (sellMap.get(name) || 0) + Number(row.quantity || 0));
  }
  const topFromOrders = [...sellMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, qty]) => ({ name, qty }));

  return {
    topSelling: topFromOrders.length ? topFromOrders : (products.data || []).map((p) => ({ name: p.name, qty: p.popularity || 0 })),
    lowStock,
    newCustomers: customers.data || [],
    categoryPerf: [...catMap.entries()].map(([name, value]) => ({ name, value })),
  };
}
