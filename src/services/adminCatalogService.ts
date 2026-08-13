import { getSupabaseClient } from "@/lib/supabaseClient";
import { adminUploadFile } from "@/services/adminDashboardService";

export type AdminProduct = {
  id: string;
  name: string;
  slug: string | null;
  sku: string | null;
  product_code: string | null;
  price: number;
  mrp: number | null;
  selling_price: number | null;
  akm_care_price: number | null;
  discount_percent: number | null;
  stock_quantity: number;
  status: string | null;
  description: string | null;
  short_description: string | null;
  detailed_description: string | null;
  image_url: string | null;
  images: unknown;
  video_url: string | null;
  category: string | null;
  category_label: string | null;
  brand_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  variants: unknown;
  colors: unknown;
  gst_percent: number | null;
  hsn: string | null;
  warranty: string | null;
  shipping_time: string | null;
  packing_type: string | null;
  freight_cost: string | null;
  weight: string | null;
  dimensions: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_featured: boolean | null;
  is_trending: boolean | null;
  is_best_seller: boolean | null;
  is_new_arrival: boolean | null;
  tags: unknown;
  display_order: number | null;
  created_at: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function requireAdminClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");

  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    throw new Error("Sign in at /admin/login as an admin user before managing products.");
  }

  const { data: adminRow, error: adminError } = await client
    .from("admin_users")
    .select("user_id, role, is_active")
    .eq("user_id", sessionData.session.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError) throw adminError;
  if (!adminRow) {
    throw new Error("This account is not authorized for admin product management.");
  }

  return client;
}

function mapRlsError(error: { message: string }, action: string): Error {
  if (/row-level security/i.test(error.message)) {
    return new Error(
      `Product ${action} blocked by RLS. Sign in with an account listed in admin_users (npm run admin:bootstrap).`,
    );
  }
  return error as Error;
}

export async function listAdminProducts(opts?: { q?: string; status?: string }) {
  const client = getSupabaseClient();
  if (!client) return [] as AdminProduct[];
  let q = client.from("products").select("*").order("updated_at", { ascending: false }).limit(500);
  if (opts?.status === "archived") q = q.eq("status", "archived");
  else if (opts?.status && opts.status !== "all") q = q.eq("status", opts.status);
  else q = q.neq("status", "archived");
  if (opts?.q?.trim()) {
    const s = opts.q.trim();
    q = q.or(`name.ilike.%${s}%,sku.ilike.%${s}%,slug.ilike.%${s}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as AdminProduct[];
}

export async function getAdminProduct(id: string) {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as AdminProduct | null;
}

export type ProductInput = Partial<AdminProduct> & { name: string; price: number };

export async function createProduct(input: ProductInput) {
  const client = await requireAdminClient();
  const slug = input.slug || slugify(input.name);
  const payload = {
    ...input,
    slug,
    akm_care_price: input.akm_care_price ?? input.selling_price ?? input.price,
    selling_price: input.selling_price ?? input.price,
    status: input.status || (Number(input.stock_quantity || 0) > 0 ? "available" : "sold_out"),
    images: input.images ?? [],
    variants: input.variants ?? [],
    colors: input.colors ?? [],
    tags: input.tags ?? [],
  };
  const { data, error } = await client.from("products").insert(payload).select("*").single();
  if (error) throw mapRlsError(error, "insert");
  return data as AdminProduct;
}

export async function updateProduct(id: string, input: Partial<AdminProduct>) {
  const client = await requireAdminClient();
  const { data, error } = await client.from("products").update(input).eq("id", id).select("*").single();
  if (error) throw mapRlsError(error, "update");
  return data as AdminProduct;
}

export async function deleteProduct(id: string) {
  const client = await requireAdminClient();
  const { error } = await client.from("products").delete().eq("id", id);
  if (error) throw mapRlsError(error, "delete");
}

export async function archiveProduct(id: string) {
  return updateProduct(id, { status: "archived" });
}

export async function duplicateProduct(id: string) {
  const src = await getAdminProduct(id);
  if (!src) throw new Error("Product not found");
  const { id: _id, created_at: _c, ...rest } = src;
  return createProduct({
    ...rest,
    name: `${src.name} (Copy)`,
    slug: `${src.slug || slugify(src.name)}-copy-${Date.now().toString(36)}`,
    sku: src.sku ? `${src.sku}-COPY` : null,
    is_featured: false,
  });
}

export async function uploadProductImages(productId: string, files: File[]) {
  const urls: string[] = [];
  for (const file of files) {
    const path = `products/${productId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { url } = await adminUploadFile({ bucket: "products", path, file });
    urls.push(url);
    const client = getSupabaseClient();
    if (client) {
      await client.from("product_images").insert({
        product_id: productId,
        url,
        storage_path: path,
        is_primary: urls.length === 1,
        sort_order: urls.length - 1,
      });
    }
  }
  const product = await getAdminProduct(productId);
  if (product) {
    const existing = Array.isArray(product.images) ? (product.images as string[]) : [];
    const images = [...existing, ...urls];
    await updateProduct(productId, {
      images,
      image_url: product.image_url || images[0] || null,
    });
  }
  return urls;
}

export async function listBrands() {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("brands").select("*").order("name");
  if (error) throw error;
  return data || [];
}

export async function upsertBrand(payload: {
  id?: string;
  name: string;
  slug?: string;
  logo_url?: string | null;
  description?: string | null;
  is_active?: boolean;
}) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const row = {
    name: payload.name,
    slug: payload.slug || slugify(payload.name),
    logo_url: payload.logo_url ?? null,
    description: payload.description ?? null,
    is_active: payload.is_active ?? true,
    updated_at: new Date().toISOString(),
  };
  if (payload.id) {
    const { data, error } = await client.from("brands").update(row).eq("id", payload.id).select("*").single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await client.from("brands").insert(row).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteBrand(id: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const { error } = await client.from("brands").delete().eq("id", id);
  if (error) throw error;
}

export async function listCategoriesAdmin() {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("categories").select("*").order("display_order");
  if (error) throw error;
  return data || [];
}

export async function listSubcategories(categoryId?: string) {
  const client = getSupabaseClient();
  if (!client) return [];
  let q = client.from("subcategories").select("*").order("display_order");
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function upsertCategory(payload: {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  display_order?: number;
  is_active?: boolean;
}) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const row = {
    name: payload.name,
    slug: payload.slug || slugify(payload.name),
    description: payload.description ?? null,
    image_url: payload.image_url ?? null,
    parent_id: payload.parent_id ?? null,
    display_order: payload.display_order ?? 0,
    is_active: payload.is_active ?? true,
    updated_at: new Date().toISOString(),
  };
  if (payload.id) {
    const { data, error } = await client.from("categories").update(row).eq("id", payload.id).select("*").single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await client.from("categories").insert(row).select("*").single();
  if (error) throw error;
  return data;
}

export async function reorderCategories(orderedIds: string[]) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  await Promise.all(
    orderedIds.map((id, i) => client.from("categories").update({ display_order: i }).eq("id", id)),
  );
}

export async function deleteCategory(id: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const { error } = await client.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertSubcategory(payload: {
  id?: string;
  category_id: string;
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  display_order?: number;
  is_active?: boolean;
}) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const row = {
    category_id: payload.category_id,
    name: payload.name,
    slug: payload.slug || slugify(payload.name),
    description: payload.description ?? null,
    image_url: payload.image_url ?? null,
    display_order: payload.display_order ?? 0,
    is_active: payload.is_active ?? true,
  };
  if (payload.id) {
    const { data, error } = await client.from("subcategories").update(row).eq("id", payload.id).select("*").single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await client.from("subcategories").insert(row).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteSubcategory(id: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase not configured");
  const { error } = await client.from("subcategories").delete().eq("id", id);
  if (error) throw error;
}

export async function listInventory(lowStockOnly = false, threshold = 5) {
  const client = getSupabaseClient();
  if (!client) return [];
  let q = client
    .from("products")
    .select("id, name, sku, stock_quantity, status, image_url")
    .neq("status", "archived")
    .order("stock_quantity", { ascending: true })
    .limit(500);
  if (lowStockOnly) q = q.lte("stock_quantity", threshold);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function updateStock(productId: string, stock_quantity: number) {
  const qty = Math.max(0, Math.floor(stock_quantity));
  const updated = await updateProduct(productId, {
    stock_quantity: qty,
    status: qty > 0 ? "available" : "sold_out",
  });

  // Keep inventory table in sync with products.stock_quantity (storefront SoT remains products.stock_quantity)
  try {
    const client = await requireAdminClient();
    const { data: existing } = await client
      .from("inventory")
      .select("id")
      .eq("product_id", productId)
      .eq("warehouse_code", "DEFAULT")
      .is("variant_id", null)
      .maybeSingle();

    if (existing?.id) {
      await client
        .from("inventory")
        .update({ quantity_on_hand: qty })
        .eq("id", existing.id);
    } else {
      await client.from("inventory").insert({
        product_id: productId,
        warehouse_code: "DEFAULT",
        quantity_on_hand: qty,
        quantity_reserved: 0,
      });
    }
  } catch {
    /* inventory sync is best-effort; products.stock_quantity already updated */
  }

  return updated;
}

export async function bulkUpdateStock(rows: { id: string; stock_quantity: number }[]) {
  await Promise.all(rows.map((r) => updateStock(r.id, r.stock_quantity)));
}

export async function markOutOfStock(productId: string) {
  return updateStock(productId, 0);
}
