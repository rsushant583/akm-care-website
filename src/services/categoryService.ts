import { getSupabaseClient } from "@/lib/supabaseClient";

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  parent_id: string | null;
};

export type SubcategoryRecord = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
};

export type BrandRecord = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export async function listCategories(): Promise<CategoryRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("categories")
    .select("id, name, slug, description, image_url, display_order, parent_id")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data || []) as CategoryRecord[];
}

export async function listSubcategories(categoryId?: string): Promise<SubcategoryRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  let query = client
    .from("subcategories")
    .select("id, category_id, name, slug, description, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as SubcategoryRecord[];
}

export async function listBrands(): Promise<BrandRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("brands")
    .select("id, name, slug, logo_url")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []) as BrandRecord[];
}

/** Shop strip categories — DB first, static fallback labels only if empty */
export async function getShopCategoryOptions(): Promise<{ id: string; label: string }[]> {
  try {
    const cats = await listCategories();
    if (cats.length === 0) {
      return [
        { id: "all", label: "All" },
        { id: "sarees", label: "Sarees" },
        { id: "apparel", label: "Apparel" },
        { id: "imitation-jewelry", label: "Imitation Jewelry" },
        { id: "food", label: "Food" },
      ];
    }
    return [{ id: "all", label: "All" }, ...cats.map((c) => ({ id: c.slug, label: c.name }))];
  } catch {
    return [{ id: "all", label: "All" }];
  }
}
