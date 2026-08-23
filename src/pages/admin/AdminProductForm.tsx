import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Save } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { AdminPageHeader, ImageDropzone, ImagePreviewList } from "@/components/admin/AdminUI";
import {
  OFFICIAL_BROWSABLE_CATEGORIES,
  getCategoryLabel,
} from "@/data/catalog/categories";
import {
  createProduct,
  getAdminProduct,
  listBrands,
  listSubcategories,
  removeProductImage,
  setPrimaryProductImage,
  updateProduct,
  uploadProductImages,
  type AdminProduct,
  type ProductInput,
} from "@/services/adminCatalogService";
import { mergeSpecifications, parseProductSpecifications } from "@/lib/ecommerce/productPresentation";
import { calcDiscountPercent, formatINR } from "@/lib/ecommerce/pricing";
import { buildAdminProductPreview } from "@/lib/admin/adminProductPreview";
import { getDraftBlockers, getPublishBlockers } from "@/lib/admin/productPublishValidation";
import { ADMIN_IMAGE_ACCEPT, validateProductImages } from "@/lib/admin/imageUploadRules";
import { isWithinNewArrivalWindow, loadCatalogSettings } from "@/lib/admin/catalogSettings";
import { DESCRIPTION_GUIDANCE, getProductCompleteness } from "@/lib/admin/productCompleteness";

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
  status: "draft",
  short_description: "",
  detailed_description: "",
  description: "",
  video_url: "",
  category: "",
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
  spec_colour: "",
  spec_fabric: "",
  spec_work: "",
  spec_pattern: "",
  spec_occasion: "",
  spec_includes: "",
  spec_care: "",
  existingSpecifications: {} as Record<string, unknown>,
  created_at: "" as string,
};

function isOfficialCategoryId(id: string) {
  return OFFICIAL_BROWSABLE_CATEGORIES.some((c) => c.id === id);
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [images, setImages] = useState<string[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [subs, setSubs] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [productId, setProductId] = useState<string | null>(isNew ? null : id!);
  const [showPreview, setShowPreview] = useState(false);
  const [newArrivalDays, setNewArrivalDays] = useState(30);

  useEffect(() => {
    void listBrands().then((rows) =>
      setBrands(rows.map((b) => ({ id: String(b.id), name: String(b.name || "") }))),
    );
    void loadCatalogSettings().then((s) => setNewArrivalDays(s.new_arrival_days));
  }, []);

  useEffect(() => {
    if (form.category_id) {
      void listSubcategories(form.category_id).then((rows) =>
        setSubs(rows.map((s) => ({ id: String(s.id), name: String(s.name || "") }))),
      );
    } else setSubs([]);
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
    const specs = parseProductSpecifications(p.specifications);
    const existingSpecifications =
      p.specifications && typeof p.specifications === "object" && !Array.isArray(p.specifications)
        ? (p.specifications as Record<string, unknown>)
        : {};
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
      status: p.status || "draft",
      short_description: p.short_description || "",
      detailed_description: p.detailed_description || p.description || "",
      description: p.description || "",
      video_url: p.video_url || "",
      // Preserve stored values exactly — do not remap legacy categories.
      category: p.category || "",
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
        .map((v: unknown) =>
          typeof v === "string" ? v : v && typeof v === "object" && "name" in v ? String((v as { name?: unknown }).name ?? "") : "",
        )
        .filter(Boolean)
        .join(", "),
      colorsText: colors
        .map((c: unknown) =>
          typeof c === "string" ? c : c && typeof c === "object" && "name" in c ? String((c as { name?: unknown }).name ?? "") : "",
        )
        .filter(Boolean)
        .join(", "),
      sizesText: "",
      spec_colour: specs.colour || "",
      spec_fabric: specs.fabric || "",
      spec_work: specs.work || "",
      spec_pattern: specs.pattern || "",
      spec_occasion: specs.occasion || "",
      spec_includes: specs.includes || "",
      spec_care: specs.care || "",
      existingSpecifications,
      created_at: p.created_at || "",
    });
    const imgs = Array.isArray(p.images) ? (p.images as string[]) : [];
    setImages(imgs.length ? imgs : p.image_url ? [p.image_url] : []);
    setProductId(p.id);
  };

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const setOfficialCategory = (categoryId: string) => {
    if (!categoryId) {
      setForm((f) => ({ ...f, category: "", category_label: "" }));
      return;
    }
    const official = OFFICIAL_BROWSABLE_CATEGORIES.find((c) => c.id === categoryId);
    if (official) {
      setForm((f) => ({ ...f, category: official.id, category_label: official.label }));
      return;
    }
  };

  const hasLegacyCategory = Boolean(form.category) && !isOfficialCategoryId(form.category);

  const syncDiscountFromPrices = (mrp: number, akm: number) => {
    const auto = calcDiscountPercent(mrp, akm);
    setForm((f) => ({ ...f, discount_percent: auto > 0 ? auto : 0 }));
  };

  const preview = useMemo(
    () =>
      buildAdminProductPreview({
        ...form,
        images,
      }),
    [form, images],
  );

  const completeness = useMemo(
    () =>
      getProductCompleteness({
        name: form.name,
        category: form.category,
        mrp: form.mrp,
        selling_price: form.selling_price,
        akm_care_price: form.akm_care_price,
        price: form.price,
        stock_quantity: form.stock_quantity,
        images,
        short_description: form.short_description,
        specifications: form.existingSpecifications,
        spec_colour: form.spec_colour,
        spec_fabric: form.spec_fabric,
        spec_work: form.spec_work,
        spec_pattern: form.spec_pattern,
        spec_occasion: form.spec_occasion,
        spec_includes: form.spec_includes,
        spec_care: form.spec_care,
      }),
    [form, images],
  );

  const publishBlockers = useMemo(
    () =>
      getPublishBlockers({
        name: form.name,
        category: form.category,
        selling_price: form.selling_price,
        akm_care_price: form.akm_care_price,
        price: form.price,
        mrp: form.mrp,
        stock_quantity: form.stock_quantity,
        images,
      }),
    [form, images],
  );

  const buildPayload = (statusOverride?: string) => {
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
    const category = form.category || null;
    const category_label =
      form.category_label || (category ? getCategoryLabel(category) : undefined) || null;
    const mrp = Number(form.mrp) || 0;
    const akm = Number(form.akm_care_price) || Number(form.price) || 0;
    const selling = Number(form.selling_price) || akm;
    const autoDiscount = calcDiscountPercent(mrp, akm);
    const status = statusOverride ?? form.status;
    const createdAt = form.created_at || new Date().toISOString();
    const suggestNew =
      status === "available" &&
      (form.is_new_arrival || isWithinNewArrivalWindow(createdAt, newArrivalDays));

    return {
      name: form.name,
      slug: form.slug || undefined,
      sku: form.sku || null,
      product_code: form.product_code || null,
      price: akm,
      mrp: mrp || null,
      selling_price: selling,
      akm_care_price: akm,
      discount_percent: autoDiscount > 0 ? autoDiscount : Number(form.discount_percent) || 0,
      stock_quantity: Number(form.stock_quantity) || 0,
      status,
      short_description: form.short_description,
      detailed_description: form.detailed_description,
      description: form.detailed_description || form.description,
      video_url: form.video_url || null,
      category,
      category_label,
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
      // Leave blank to use storefront auto SEO; keep manual override when set.
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      is_featured: form.is_featured,
      is_trending: form.is_trending,
      is_best_seller: form.is_best_seller,
      is_new_arrival: suggestNew,
      variants: [...variants, ...sizes],
      colors,
      images,
      image_url: images[0] || null,
      specifications: mergeSpecifications(form.existingSpecifications, {
        colour: form.spec_colour,
        fabric: form.spec_fabric,
        work: form.spec_work,
        pattern: form.spec_pattern,
        occasion: form.spec_occasion,
        includes: form.spec_includes,
        care: form.spec_care,
      }),
    };
  };

  const persist = async (statusOverride?: string, mode: "draft" | "publish" | "save" = "save") => {
    if (mode === "draft") {
      const blockers = getDraftBlockers({ name: form.name });
      if (blockers.length) {
        toast.error(blockers[0]);
        return;
      }
    } else if (mode === "publish") {
      if (publishBlockers.length) {
        toast.error(publishBlockers[0]);
        return;
      }
    } else {
      // Generic save — respect current status rules
      if (form.status === "draft") {
        const blockers = getDraftBlockers({ name: form.name });
        if (blockers.length) {
          toast.error(blockers[0]);
          return;
        }
      } else {
        if (publishBlockers.length) {
          toast.error(publishBlockers[0]);
          return;
        }
      }
    }

    const stock = Number(form.stock_quantity);
    if (!Number.isFinite(stock) || stock < 0) {
      toast.error("Stock cannot be negative");
      return;
    }
    const price = Number(form.akm_care_price || form.price);
    if (Number.isFinite(price) && price < 0) {
      toast.error("Price cannot be negative");
      return;
    }

    setBusy(true);
    try {
      const status =
        statusOverride ??
        (mode === "draft" ? "draft" : mode === "publish" ? "available" : form.status);
      const payload = buildPayload(status);
      set("status", status);
      if (status === "available" && Number(payload.discount_percent) > 0) {
        set("discount_percent", Number(payload.discount_percent));
      }
      if (isNew && !productId) {
        const created = await createProduct(payload as ProductInput);
        setProductId(created.id);
        set("created_at", created.created_at || "");
        toast.success(mode === "publish" ? "Product published" : mode === "draft" ? "Draft saved" : "Product created");
        navigate(`/admin/products/${created.id}`, { replace: true });
      } else if (productId) {
        await updateProduct(productId, payload as Partial<AdminProduct>);
        toast.success(
          mode === "publish"
            ? "Product published"
            : mode === "draft" || status === "draft"
              ? "Draft saved"
              : "Product saved",
        );
      }
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : undefined) || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await persist(undefined, form.status === "draft" ? "draft" : "save");
  };

  const onUpload = async (files: File[]) => {
    const { accepted, rejected } = await validateProductImages(files);
    for (const reason of rejected) toast.error(reason);
    if (!accepted.length) return;

    if (!productId) {
      if (!form.name.trim()) {
        toast.error("Enter a product name before uploading images");
        return;
      }
      try {
        const created = await createProduct({
          name: form.name.trim(),
          price: Number(form.akm_care_price || form.price) || 0,
          stock_quantity: Math.max(0, Number(form.stock_quantity) || 0),
          category: form.category || null,
          category_label: form.category_label || (form.category ? getCategoryLabel(form.category) : null) || null,
          status: "draft",
        } as ProductInput);
        setProductId(created.id);
        set("status", "draft");
        set("created_at", created.created_at || "");
        const urls = await uploadProductImages(created.id, accepted);
        setImages((prev) => [...prev, ...urls]);
        navigate(`/admin/products/${created.id}`, { replace: true });
        toast.success("Images uploaded — draft created");
      } catch (err: unknown) {
        toast.error((err instanceof Error ? err.message : undefined) || "Upload failed — save product name first");
      }
      return;
    }
    try {
      const urls = await uploadProductImages(productId, accepted);
      setImages((prev) => [...prev, ...urls]);
      toast.success("Images uploaded");
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : undefined) || "Upload failed");
    }
  };

  const onRemoveImage = async (url: string) => {
    if (!productId) {
      setImages((prev) => prev.filter((u) => u !== url));
      return;
    }
    try {
      const next = await removeProductImage(productId, url);
      setImages(next);
      toast.success("Image removed");
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : undefined) || "Could not remove image");
    }
  };

  const onSetPrimary = async (url: string) => {
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);
    if (!productId) return;
    try {
      await setPrimaryProductImage(productId, url);
      toast.success("Primary image updated");
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : undefined) || "Could not set primary image");
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={isNew ? "Add Product" : "Edit Product"}
        subtitle="Fill factual fields → preview → save draft or publish. No invented attributes."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPreview ? "Hide preview" : "Preview"}
            </button>
            <Link to="/admin/products" className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">
              Back to list
            </Link>
          </div>
        }
      />

      {showPreview && (
        <section className="mb-6 rounded-2xl border bg-white p-5 max-w-5xl">
          <h2 className="font-semibold mb-3">Customer-facing preview</h2>
          <p className="text-xs text-slate-500 mb-4">
            Preview only — does not publish or create orders. Blank attributes stay blank.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="aspect-[3/4] rounded-xl bg-slate-100 overflow-hidden mb-3">
                {images[0] ? (
                  <img src={images[0]} alt={preview.seo.imageAlt} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">No image</div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.slice(0, 6).map((src) => (
                    <img key={src} src={src} alt="" className="h-14 w-14 rounded-lg object-cover border shrink-0" />
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {preview.badges.map((b) => (
                  <span key={b.kind} className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100">
                    {b.label}
                  </span>
                ))}
              </div>
              <h3 className="text-xl font-bold leading-snug">{preview.displayTitle}</h3>
              <p className="text-sm text-slate-500">{preview.product.categoryLabel || "No category"}</p>
              <p className="text-lg font-semibold">
                {formatINR(preview.product.akmCarePrice)}
                {preview.product.mrp > preview.product.akmCarePrice && (
                  <span className="ml-2 text-sm text-slate-400 line-through">{formatINR(preview.product.mrp)}</span>
                )}
              </p>
              {(preview.product.shortDescription || preview.product.detailedDescription) && (
                <p className="text-sm text-slate-600 line-clamp-6">
                  {preview.product.shortDescription || preview.product.detailedDescription}
                </p>
              )}
              {preview.details.length > 0 && (
                <dl className="text-sm space-y-1 border-t pt-3">
                  {preview.details.map((row) => (
                    <div key={row.label} className="flex gap-2">
                      <dt className="text-slate-500 w-28 shrink-0">{row.label}</dt>
                      <dd className="font-medium">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </section>
      )}

      <form onSubmit={onSubmit} className="space-y-6 max-w-5xl">
        <section className="rounded-2xl border bg-white p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Product information</h2>
            <p className="text-sm font-semibold text-slate-700">
              Completeness: <span className="text-orange-600">{completeness.percent}%</span>
            </p>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: `${completeness.percent}%` }}
              aria-hidden
            />
          </div>
          <div className="rounded-xl bg-slate-50 border px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Customer-facing title preview</p>
            <p className="font-semibold mt-0.5">{preview.displayTitle || "—"}</p>
            {preview.titlePreview.usedFallback && (
              <p className="text-xs text-slate-500 mt-1">
                Using a safe fallback title until colour / fabric / work are filled (leave blank when unknown — do not invent).
              </p>
            )}
          </div>
          {completeness.missing.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Missing</p>
              <ul className="list-disc pl-5 text-sm text-slate-700 space-y-0.5">
                {completeness.missing.slice(0, 8).map((m) => (
                  <li key={m.id}>{m.label}</li>
                ))}
              </ul>
            </div>
          )}
          {completeness.tips.length > 0 && (
            <ul className="text-xs text-slate-500 space-y-1">
              {completeness.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold">Basics</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name *" value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Slug" value={form.slug} onChange={(v) => set("slug", v)} />
            <Field label="SKU" value={form.sku} onChange={(v) => set("sku", v)} />
            <Field label="Product code" value={form.product_code} onChange={(v) => set("product_code", v)} />
            <Field
              label="MRP"
              type="number"
              value={String(form.mrp)}
              onChange={(v) => {
                const mrp = Number(v);
                set("mrp", mrp);
                syncDiscountFromPrices(mrp, Number(form.akm_care_price || form.price));
              }}
            />
            <Field label="Selling price" type="number" value={String(form.selling_price)} onChange={(v) => set("selling_price", Number(v))} />
            <Field
              label="AKM Care price *"
              type="number"
              value={String(form.akm_care_price || form.price)}
              onChange={(v) => {
                const akm = Number(v);
                set("akm_care_price", akm);
                set("price", akm);
                syncDiscountFromPrices(Number(form.mrp), akm);
              }}
            />
            <label className="text-sm">
              <span className="font-medium">Discount % (auto from MRP)</span>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border px-3 py-2.5 bg-slate-50"
                value={String(form.discount_percent)}
                readOnly
                title="Calculated from MRP and AKM Care price for Deals"
              />
            </label>
            <Field label="Stock" type="number" value={String(form.stock_quantity)} onChange={(v) => set("stock_quantity", Number(v))} />
            <label className="text-sm">
              <span className="font-medium">Status</span>
              <select className="mt-1 w-full rounded-xl border px-3 py-2.5" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="draft">Draft (hidden on shop)</option>
                <option value="available">Published / Available</option>
                <option value="sold_out">Sold out</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          <label className="text-sm block">
            <span className="font-medium">Short description</span>
            <p className="text-xs text-slate-500 mt-0.5 mb-1">{DESCRIPTION_GUIDANCE.short}</p>
            <textarea className="mt-1 w-full rounded-xl border px-3 py-2.5 min-h-20" value={form.short_description} onChange={(e) => set("short_description", e.target.value)} />
          </label>
          <label className="text-sm block">
            <span className="font-medium">Rich description</span>
            <p className="text-xs text-slate-500 mt-0.5 mb-1">{DESCRIPTION_GUIDANCE.detailed}</p>
            <textarea className="mt-1 w-full rounded-xl border px-3 py-2.5 min-h-40 font-mono text-xs" value={form.detailed_description} onChange={(e) => set("detailed_description", e.target.value)} placeholder="Supports plain/HTML text for now" />
          </label>
        </section>

        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold">Media</h2>
          <p className="text-xs text-slate-500">JPEG, PNG, WebP, or GIF · max 5 MB · min 200×200px. First image is primary unless you choose another.</p>
          <ImageDropzone onFiles={onUpload} accept={ADMIN_IMAGE_ACCEPT} label="Drag & drop product images, or click to browse" />
          <ImagePreviewList
            urls={images}
            primaryUrl={images[0]}
            onRemove={(url) => void onRemoveImage(url)}
            onSetPrimary={(url) => void onSetPrimary(url)}
          />
          <Field label="Product video URL (optional)" value={form.video_url} onChange={(v) => set("video_url", v)} />
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
              <span className="font-medium">Category *</span>
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2.5"
                value={form.category}
                onChange={(e) => setOfficialCategory(e.target.value)}
              >
                <option value="">—</option>
                {hasLegacyCategory && (
                  <option value={form.category}>
                    {form.category_label || form.category} (legacy)
                  </option>
                )}
                {OFFICIAL_BROWSABLE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
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
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold">Storefront attributes (optional)</h2>
          <p className="text-xs text-[#6B6B6B]">
            These fields power customer-facing titles and product details. Leave blank when unknown — do not invent values.
            Saving merges into existing <code className="text-[11px]">specifications</code> and preserves unrelated keys (blouse, size, packing, etc.).
          </p>
          <div className="rounded-xl bg-slate-50 border px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Title uses</p>
            <p className="font-semibold mt-0.5">{preview.displayTitle || "—"}</p>
            {preview.titlePreview.gaps.length > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Optional for richer titles: {preview.titlePreview.gaps.join(", ")}
              </p>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Colour" value={form.spec_colour} onChange={(v) => set("spec_colour", v)} />
            <Field label="Fabric / Material" value={form.spec_fabric} onChange={(v) => set("spec_fabric", v)} />
            <Field label="Work" value={form.spec_work} onChange={(v) => set("spec_work", v)} />
            <Field label="Pattern" value={form.spec_pattern} onChange={(v) => set("spec_pattern", v)} />
            <Field label="Occasion" value={form.spec_occasion} onChange={(v) => set("spec_occasion", v)} />
            <Field label="Includes / What's included" value={form.spec_includes} onChange={(v) => set("spec_includes", v)} />
            <Field label="Care" value={form.spec_care} onChange={(v) => set("spec_care", v)} />
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
          <div className="rounded-xl bg-slate-50 border px-3 py-3 text-sm space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Automatic SEO (used when overrides are blank)</p>
            <p><span className="text-slate-500">Page title:</span> {preview.seo.title}</p>
            <p><span className="text-slate-500">Meta description:</span> {preview.seo.description}</p>
            <p><span className="text-slate-500">Image alt:</span> {preview.seo.imageAlt}</p>
          </div>
          <Field label="SEO title override (optional)" value={form.seo_title} onChange={(v) => set("seo_title", v)} />
          <label className="text-sm block">
            <span className="font-medium">SEO description override (optional)</span>
            <textarea className="mt-1 w-full rounded-xl border px-3 py-2.5 min-h-20" value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-4 text-sm">
            {(
              [
                ["is_featured", "Featured (manual)"],
                ["is_trending", "Trending (manual)"],
                ["is_best_seller", "Best seller (manual — only with real sales evidence)"],
                ["is_new_arrival", "New arrival (also auto within window on publish)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!form[key]} onChange={(e) => set(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
        </section>

        {publishBlockers.length > 0 && form.status !== "draft" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold mb-1">Before publishing:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              {publishBlockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 sticky bottom-3 z-10 bg-slate-100/95 backdrop-blur rounded-2xl border p-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void persist("draft", "draft")}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-5 py-3 font-semibold disabled:opacity-60"
          >
            <Save size={16} />
            Save Draft
          </button>
          <button
            type="button"
            disabled={busy || publishBlockers.length > 0}
            onClick={() => void persist("available", "publish")}
            className="rounded-xl bg-orange-500 text-white px-5 py-3 font-semibold disabled:opacity-60"
            title={publishBlockers[0] || "Publish to shop"}
          >
            {busy ? "Working…" : "Publish"}
          </button>
          {form.status === "available" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void persist("draft", "draft")}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold disabled:opacity-60"
            >
              Unpublish / Hide
            </button>
          )}
          <button type="submit" disabled={busy} className="rounded-xl border bg-white px-5 py-3 font-semibold disabled:opacity-60">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
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
