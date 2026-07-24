import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader, ImageDropzone } from "@/components/admin/AdminUI";
import { deleteBanner, listBanners, upsertBanner } from "@/services/adminCmsService";
import { adminUploadFile } from "@/services/adminDashboardService";

const PLACEMENTS = [
  { value: "home_hero", label: "Homepage Hero" },
  { value: "promotional", label: "Promotional" },
  { value: "seasonal", label: "Seasonal" },
  { value: "offer", label: "Offer" },
  { value: "festival", label: "Festival" },
  { value: "shop", label: "Shop" },
];

const empty = {
  id: "",
  title: "",
  subtitle: "",
  image_url: "",
  link_url: "",
  placement: "home_hero",
  display_order: 0,
  is_active: true,
};

export default function AdminBannersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState(empty);

  const load = async () => setItems(await listBanners());
  useEffect(() => {
    void load().catch((e) => toast.error(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Banners" subtitle="Manage hero, promo, seasonal, offer, and festival banners." />

      <div className="rounded-2xl border bg-white p-5 space-y-3 max-w-2xl">
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Link URL" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
        <select className="w-full rounded-xl border px-3 py-2.5 text-sm" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
          {PLACEMENTS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <ImageDropzone
          multiple={false}
          label="Upload banner image"
          onFiles={async (files) => {
            const file = files[0];
            if (!file) return;
            const { url } = await adminUploadFile({ bucket: "banners", path: `banners/${Date.now()}-${file.name}`, file });
            setForm((f) => ({ ...f, image_url: url }));
            toast.success("Banner image uploaded");
          }}
        />
        {form.image_url && <img src={form.image_url} alt="" className="w-full max-h-48 object-cover rounded-xl" />}
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Active
        </label>
        <button
          type="button"
          className="rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold"
          onClick={async () => {
            if (!form.title || !form.image_url) return toast.error("Title and image required");
            await upsertBanner({
              id: form.id || undefined,
              title: form.title,
              subtitle: form.subtitle || null,
              image_url: form.image_url,
              link_url: form.link_url || null,
              placement: form.placement,
              display_order: Number(form.display_order) || 0,
              is_active: form.is_active,
            });
            toast.success("Banner saved");
            setForm(empty);
            await load();
          }}
        >
          {form.id ? "Update banner" : "Add banner"}
        </button>
      </div>

      {!items.length ? (
        <AdminEmpty message="No banners yet." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((b) => (
            <div key={b.id} className="rounded-2xl border bg-white overflow-hidden">
              <img src={b.image_url} alt="" className="h-40 w-full object-cover" />
              <div className="p-4">
                <p className="font-semibold">{b.title}</p>
                <p className="text-xs text-slate-500 capitalize">{b.placement.replace(/_/g, " ")} · {b.is_active ? "Active" : "Off"}</p>
                <div className="flex gap-3 mt-3 text-sm">
                  <button type="button" onClick={() => setForm({ ...empty, ...b, subtitle: b.subtitle || "", link_url: b.link_url || "" })}>Edit</button>
                  <button
                    type="button"
                    className="text-red-600"
                    onClick={async () => {
                      await deleteBanner(b.id);
                      await load();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
