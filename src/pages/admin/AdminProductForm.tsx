import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { AdminPageHeader, ImageDropzone, ImagePreviewList } from "@/components/admin/AdminUI";
import {
  createProduct,
  getAdminProduct,
  listBrands,
  listCategoriesAdmin,
  listSubcategories,
  updateProduct,
  uploadProductImages,
  type AdminProduct,
} from "@/services/adminCatalogService";

const empty = {
  name: "",
  slug: "",
  sku: "",
  product_code: "",
  price: 0,
  mrp: 0,
  selling_price: 0,
  akm_care_price: 0,
  discount_percent: 0,
  stock_quantity: 0,
  status: "available",
  short_description: "",
  detailed_description: "",
  description: "",
  video_url: "",
  category: "apparel",
  category_label: "",
  brand_id: "",
  category_id: "",
  subcategory_id: "",
  gst_percent: 5,
  hsn: "",
  warranty: "",
  shipping_time: "",
  packing_type: "",
  freight_cost: "",
  weight: "",
  dimensions: "",
  seo_title: "",
  seo_description: "",
  is_featured: false,
  is_trending: false,
  is_best_seller: false,
  is_new_arrival: false,
  variantsText: "",
  colorsText: "",
  sizesText: "",
};

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [images, setImages] = useState<string[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [productId, setProductId] = useState<string | null>(isNew ? null : id!);

  useEffect(() => {
    void Promise.all([listBrands(), listCategoriesAdmin()]).then(([b, c]) => {
      setBrands(b);
      setCategories(c);
    });
  }, []);

  useEffect(() => {
    if (form.category_id) void listSubcategories(form.category_id).then(setSubs);
    else setSubs([]);
  }, [form.category_id]);

  useEffect(() => {
    if (isNew) return;
    void getAdminProduct(id!).then((p) => {
      if (!p) return;
      hydrate(p);
    });
  }, [id, isNew]);

  const hydrate = (p: AdminProduct) => {
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const colors = Array.isArray(p.colors) ? p.colors : [];
    setForm({
      ...empty,
      name: p.name || "",
      slug: p.slug || "",
      sku: p.sku || "",
      product_code: p.product_code || "",
      price: Number(p.price || 0),
      mrp: Number(p.mrp || 0),
      selling_price: Number(p.selling_price || 0),
      akm_care_price: Number(p.akm_care_price || 0),
      discount_percent: Number(p.discount_percent || 0),
      stock_quantity: Number(p.stock_quantity || 0),
      status: p.status || "available",
      short_description: p.short_description || "",
      detailed_description: p.detailed_description || p.description || "",
      description: p.description || "",
      video_url: p.video_url || "",
      category: p.category || "apparel",
      category_label: p.category_label || "",
      brand_id: p.brand_id || "",
      category_id: p.category_id || "",
      subcategory_id: p.subcategory_id || "",
      gst_percent: Number(p.gst_percent ?? 5),
      hsn: p.hsn || "",
      warranty: p.warranty || "",
      shipping_time: p.shipping_time || "",
      packing_type: p.packing_type || "",
      freight_cost: p.freight_cost || "",
      weight: p.weight || "",
      dimensions: p.dimensions || "",
      seo_title: p.seo_title || "",
      seo_description: p.seo_description || "",
      is_featured: !!p.is_featured,
      is_trending: !!p.is_trending,
      is_best_seller: !!p.is_best_seller,
      is_new_arrival: !!p.is_new_arrival,
      variantsText: variants
        .map((v: any) => (typeof v === "string" ? v : v?.name))
        .filter(Boolean)
        .join(", "),
      colorsText: colors
        .map((c: any) => (typeof c === "string" ? c : c?.name))
        .filter(Boolean)
        .join(", "),
      sizesText: "",
    });
    const imgs = Array.isArray(p.images) ? (p.images as string[]) : [];
    setImages(imgs.length ? imgs : p.image_url ? [p.image_url] : []);
    setProductId(p.id);
  };

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const buildPayload = () => {
    const variants = form.variantsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
    const sizes = form.sizesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name, type: "size" }));
    const colors = form.colorsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
    return {
      name: form.name,
      slug: form.slug || undefined,
      sku: form.sku || null,
      product_code: form.product_code || null,
      price: Number(form.price),
      mrp: Number(form.mrp) || null,
      selling_price: Number(form.selling_price) || Number(form.price),
      akm_care_price: Number(form.akm_care_price) || Number(form.price),
      discount_percent: Number(form.discount_percent) || 0,
      stock_quantity: Number(form.stock_quantity) || 0,
      status: form.status,
      short_description: form.short_description,
      detailed_description: form.detailed_description,
      description: form.detailed_description || form.description,
      video_url: form.video_url || null,
      category: form.category,
      category_label: form.category_label || categories.find((c) => c.id === form.category_id)?.name || null,
      brand_id: form.brand_id || null,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      gst_percent: Number(form.gst_percent) || 5,
      hsn: form.hsn || null,
      warranty: form.warranty || null,
      shipping_time: form.shipping_time || null,
      packing_type: form.packing_type || null,
      freight_cost: form.freight_cost || null,
      weight: form.weight || null,
      dimensions: form.dimensions || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      is_featured: form.is_featured,
      is_trending: form.is_trending,
      is_best_seller: form.is_best_seller,
      is_new_arrival: form.is_new_arrival,
      variants: [...variants, ...sizes],
      colors,
      images,
      image_url: images[0] || null,
    };
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    setBusy(true);
    try {
      const payload = buildPayload();
      if (isNew && !productId) {
        const created = await createProduct(payload as any);
        setProductId(created.id);
        toast.success("Product created");
        navigate(`/admin/products/${created.id}`, { replace: true });
      } else if (productId) {
        await updateProduct(productId, payload as any);
        toast.success("Product saved");
      }
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const onUpload = async (files: File[]) => {
    if (!productId) {
      // create draft first
      try {
        const created = await createProduct({
          name: form.name || "Untitled product",
          price: Number(form.price) || 0,
          stock_quantity: Number(form.stock_quantity) || 0,
        });
        setProductId(created.id);
        const urls = await uploadProductImages(created.id, files);
        setImages((prev) => [...prev, ...urls]);
        navigate(`/admin/products/${created.id}`, { replace: true });
        toast.success("Images uploaded");
      } catch (err: any) {
        toast.error(err.message || "Upload failed — save product name first");
      }
      return;
    }
    try {
      const urls = await uploadProductImages(productId, files);
      setImages((prev) => [...prev, ...urls]);
      toast.success("Images uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={isNew ? "Add Product" : "Edit Product"}
        subtitle="Full catalog fields including SEO, GST, variants, and media."
        actions={
          <Link to="/admin/products" className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">
            Back to list
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="space-y-6 max-w-5xl">
        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold">Basics</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name *" value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Slug" value={form.slug} onChange={(v) => set("slug", v)} />
            <Field label="SKU" value={form.sku} onChange={(v) => set("sku", v)} />
            <Field label="Product code" value={form.product_code} onChange={(v) => set("product_code", v)} />
            <Field label="MRP" type="number" value={String(form.mrp)} onChange={(v) => set("mrp", Number(v))} />
            <Field label="Selling price" type="number" value={String(form.selling_price)} onChange={(v) => set("selling_price", Number(v))} />
            <Field label="AKM Care price *" type="number" value={String(form.akm_care_price || form.price)} onChange={(v) => { set("akm_care_price", Number(v)); set("price", Number(v)); }} />
            <Field label="Discount %" type="number" value={String(form.discount_percent)} onChange={(v) => set("discount_percent", Number(v))} />
            <Field label="Stock" type="number" value={String(form.stock_quantity)} onChange={(v) => set("stock_quantity", Number(v))} />
            <label className="text-sm">
              <span className="font-medium">Status</span>
              <select className="mt-1 w-full rounded-xl border px-3 py-2.5" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="available">Available</option>
                <option value="sold_out">Sold out</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          <label className="text-sm block">
            <span className="font-medium">Short description</span>
            <textarea className="mt-1 w-full rounded-xl border px-3 py-2.5 min-h-20" value={form.short_description} onChange={(e) => set("short_description", e.target.value)} />
          </label>
          <label className="text-sm block">
            <span className="font-medium">Rich description</span>
            <textarea className="mt-1 w-full rounded-xl border px-3 py-2.5 min-h-40 font-mono text-xs" value={form.detailed_description} onChange={(e) => set("detailed_description", e.target.value)} placeholder="Supports plain/HTML text for now" />
          </label>
        </section>

        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold">Media</h2>
          <ImageDropzone onFiles={onUpload} />
          <ImagePreviewList urls={images} onRemove={(url) => setImages((prev) => prev.filter((u) => u !== url))} />
          <Field label="Product video URL (future-ready)" value={form.video_url} onChange={(v) => set("video_url", v)} />
        </section>

        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold">Organization</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="font-medium">Brand</span>
              <select className="mt-1 w-full rounded-xl border px-3 py-2.5" value={form.brand_id} onChange={(e) => set("brand_id", e.target.value)}>
                <option value="">—</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="font-medium">Category</span>
              <select className="mt-1 w-full rounded-xl border px-3 py-2.5" value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="font-medium">Subcategory</span>
              <select className="mt-1 w-full rounded-xl border px-3 py-2.5" value={form.subcategory_id} onChange={(e) => set("subcategory_id", e.target.value)}>
                <option value="">—</option>
                {subs.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <Field label="Category label (legacy)" value={form.category_label} onChange={(v) => set("category_label", v)} />
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold">Variants & inventory details</h2>
          <Field label="Variants (comma-separated)" value={form.variantsText} onChange={(v) => set("variantsText", v)} />
          <Field label="Sizes (comma-separated)" value={form.sizesText} onChange={(v) => set("sizesText", v)} />
          <Field label="Colors (comma-separated)" value={form.colorsText} onChange={(v) => set("colorsText", v)} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="GST %" type="number" value={String(form.gst_percent)} onChange={(v) => set("gst_percent", Number(v))} />
            <Field label="HSN" value={form.hsn} onChange={(v) => set("hsn", v)} />
            <Field label="Warranty" value={form.warranty} onChange={(v) => set("warranty", v)} />
            <Field label="Shipping time" value={form.shipping_time} onChange={(v) => set("shipping_time", v)} />
            <Field label="Packing type" value={form.packing_type} onChange={(v) => set("packing_type", v)} />
            <Field label="Freight cost" value={form.freight_cost} onChange={(v) => set("freight_cost", v)} />
            <Field label="Weight" value={form.weight} onChange={(v) => set("weight", v)} />
            <Field label="Dimensions" value={form.dimensions} onChange={(v) => set("dimensions", v)} />
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold">SEO & merchandising</h2>
          <Field label="SEO title" value={form.seo_title} onChange={(v) => set("seo_title", v)} />
          <label className="text-sm block">
            <span className="font-medium">SEO description</span>
            <textarea className="mt-1 w-full rounded-xl border px-3 py-2.5 min-h-20" value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-4 text-sm">
            {(
              [
                ["is_featured", "Featured"],
                ["is_trending", "Trending"],
                ["is_best_seller", "Best seller"],
                ["is_new_arrival", "New arrival"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!(form as any)[key]} onChange={(e) => set(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
        </section>

        <button type="submit" disabled={busy} className="rounded-xl bg-orange-500 text-white px-6 py-3 font-semibold disabled:opacity-60">
          {busy ? "Saving…" : "Save product"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="text-sm block">
      <span className="font-medium">{label}</span>
      <input type={type} className="mt-1 w-full rounded-xl border px-3 py-2.5" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
