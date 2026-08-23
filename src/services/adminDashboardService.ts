import { getSupabaseClient } from "@/lib/supabaseClient";

export async function adminUploadFile(params: {
  bucket: "products" | "brands" | "categories" | "banners" | "thumbnails" | "media";
  path: string;
  file: File;
}) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const { error } = await client.storage.from(params.bucket).upload(params.path, params.file, {
    upsert: true,
    contentType: params.file.type,
  });
  if (error) throw error;
  const { data } = client.storage.from(params.bucket).getPublicUrl(params.path);
  return { url: data.publicUrl, path: params.path };
}

export async function getDashboardStats(opts?: { lowStockThreshold?: number }) {
  const client = getSupabaseClient();
  const low = opts?.lowStockThreshold ?? 5;
  if (!client) {
    return {
      totalProducts: 0,
      activeProducts: 0,
      draftProducts: 0,
      outOfStock: 0,
      lowStock: 0,
      missingImage: 0,
      missingCategory: 0,
      pendingOrders: 0,
      todayOrders: 0,
      categories: 0,
      orders: 0,
      revenue: 0,
      customers: 0,
      vendors: 0,
    };
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    products,
    active,
    drafts,
    oos,
    categories,
    orders,
    paidOrders,
    customers,
    vendors,
    pendingOrders,
    todayOrders,
    catalogSlice,
  ] = await Promise.all([
    client.from("products").select("id", { count: "exact", head: true }).neq("status", "archived"),
    client.from("products").select("id", { count: "exact", head: true }).eq("status", "available"),
    client.from("products").select("id", { count: "exact", head: true }).eq("status", "draft"),
    client.from("products").select("id", { count: "exact", head: true }).neq("status", "archived").lte("stock_quantity", 0),
    client.from("categories").select("id", { count: "exact", head: true }),
    client.from("order_headers").select("id", { count: "exact", head: true }),
    client.from("order_headers").select("grand_total").in("payment_status", ["paid"]).limit(5000),
    client.from("profiles").select("id", { count: "exact", head: true }),
    client.from("vendor_applications").select("id", { count: "exact", head: true }),
    client
      .from("order_headers")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "confirmed", "packed"]),
    client
      .from("order_headers")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString()),
    client
      .from("products")
      .select("id, stock_quantity, image_url, images, category, status")
      .neq("status", "archived")
      .limit(2000),
  ]);

  const revenue = (paidOrders.data || []).reduce((n, r) => n + Number(r.grand_total || 0), 0);

  let lowStock = 0;
  let missingImage = 0;
  let missingCategory = 0;
  for (const row of catalogSlice.data || []) {
    const stock = Number(row.stock_quantity ?? 0);
    if (stock > 0 && stock <= low) lowStock += 1;
    const imgs = Array.isArray(row.images) ? row.images : [];
    if (!String(row.image_url || "").trim() && !imgs.some((u: unknown) => String(u || "").trim())) {
      missingImage += 1;
    }
    if (!String(row.category || "").trim()) missingCategory += 1;
  }

  return {
    totalProducts: products.count ?? 0,
    activeProducts: active.count ?? 0,
    draftProducts: drafts.count ?? 0,
    outOfStock: oos.count ?? 0,
    lowStock,
    missingImage,
    missingCategory,
    pendingOrders: pendingOrders.count ?? 0,
    todayOrders: todayOrders.count ?? 0,
    categories: categories.count ?? 0,
    orders: orders.count ?? 0,
    revenue,
    customers: customers.count ?? 0,
    vendors: vendors.count ?? 0,
  };
}

export async function getSalesSeries(days = 14) {
  const client = getSupabaseClient();
  if (!client) return [] as { date: string; orders: number; revenue: number }[];
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await client
    .from("order_headers")
    .select("created_at, grand_total, payment_status")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  const map = new Map<string, { orders: number; revenue: number }>();
  for (let i = 0; i <= days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { orders: 0, revenue: 0 });
  }
  for (const row of data || []) {
    const key = String(row.created_at).slice(0, 10);
    const cur = map.get(key) || { orders: 0, revenue: 0 };
    cur.orders += 1;
    if (row.payment_status === "paid") cur.revenue += Number(row.grand_total || 0);
    map.set(key, cur);
  }
  return [...map.entries()].map(([date, v]) => ({ date, ...v }));
}

export async function getCategoryDistribution() {
  const client = getSupabaseClient();
  if (!client) return [] as { name: string; value: number }[];
  const { data } = await client.from("products").select("category_label, category");
  const map = new Map<string, number>();
  for (const row of data || []) {
    const name = String(row.category_label || row.category || "Other");
    map.set(name, (map.get(name) || 0) + 1);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}
