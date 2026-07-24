import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader, ImageDropzone } from "@/components/admin/AdminUI";
import { deleteMedia, listMedia, uploadMedia } from "@/services/adminCmsService";

export default function AdminMediaPage() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("uploads");
  const [preview, setPreview] = useState<string | null>(null);

  const load = async () => setItems(await listMedia({ q, folder }));
  useEffect(() => {
    void load().catch((e) => toast.error(e.message));
  }, [folder]);

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Media Library" subtitle="Upload, search, preview, and reuse images." />
      <div className="flex flex-wrap gap-2">
        <input
          className="rounded-xl border bg-white px-3 py-2.5 text-sm flex-1 min-w-[180px]"
          placeholder="Search images…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void load()}
        />
        <select className="rounded-xl border bg-white px-3 py-2.5 text-sm" value={folder} onChange={(e) => setFolder(e.target.value)}>
          {["uploads", "products", "banners", "brands", "categories", "misc"].map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <button type="button" onClick={() => void load()} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">
          Search
        </button>
      </div>

      <ImageDropzone
        onFiles={async (files) => {
          for (const file of files) {
            await uploadMedia(file, folder);
          }
          toast.success("Uploaded");
          await load();
        }}
      />

      {!items.length ? (
        <AdminEmpty message="No media in this folder." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {items.map((m) => (
            <div key={m.id} className="rounded-xl border bg-white overflow-hidden group">
              <button type="button" className="block w-full aspect-square bg-slate-100" onClick={() => setPreview(m.url)}>
                <img src={m.url} alt={m.alt || m.name} className="h-full w-full object-cover" />
              </button>
              <div className="p-2">
                <p className="text-xs truncate" title={m.name}>{m.name}</p>
                <div className="flex justify-between gap-1 mt-1">
                  <button
                    type="button"
                    className="text-[10px] text-orange-600 font-semibold"
                    onClick={async () => {
                      await navigator.clipboard.writeText(m.url);
                      toast.success("URL copied");
                    }}
                  >
                    Copy URL
                  </button>
                  <button
                    type="button"
                    className="text-[10px] text-red-600"
                    onClick={async () => {
                      await deleteMedia(m.id, m.storage_path);
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

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="" className="max-h-[90vh] max-w-[90vw] rounded-xl" />
        </div>
      )}
    </div>
  );
}
