import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminEmpty, AdminPageHeader, Chip } from "@/components/admin/AdminUI";
import { bulkUpdateStock, listInventory, markOutOfStock, updateStock } from "@/services/adminCatalogService";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [lowOnly, setLowOnly] = useState(false);
  const [edits, setEdits] = useState<Record<string, number>>({});

  const load = async () => {
    const rows = await listInventory(lowOnly);
    setItems(rows);
    const map: Record<string, number> = {};
    for (const r of rows) map[r.id] = r.stock_quantity;
    setEdits(map);
  };

  useEffect(() => {
    void load().catch((e) => toast.error(e.message));
  }, [lowOnly]);

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        subtitle="View stock, bulk update, and mark out of stock."
        actions={
          <button
            type="button"
            className="rounded-xl bg-orange-500 text-white px-4 py-2.5 text-sm font-semibold"
            onClick={async () => {
              const rows = Object.entries(edits).map(([id, stock_quantity]) => ({ id, stock_quantity }));
              await bulkUpdateStock(rows);
              toast.success("Bulk stock updated");
              await load();
            }}
          >
            Save all changes
          </button>
        }
      />

      <div className="flex gap-2 mb-4">
        <Chip active={!lowOnly} onClick={() => setLowOnly(false)}>All stock</Chip>
        <Chip active={lowOnly} onClick={() => setLowOnly(true)}>Low inventory (≤5)</Chip>
      </div>

      {!items.length ? (
        <AdminEmpty message="No inventory rows." />
      ) : (
        <div className="rounded-2xl border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-slate-500">{row.sku || "—"}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      className="w-24 rounded-lg border px-2 py-1.5"
                      value={edits[row.id] ?? 0}
                      onChange={(e) => setEdits((m) => ({ ...m, [row.id]: Number(e.target.value) }))}
                    />
                  </td>
                  <td className="px-4 py-3 capitalize">{row.status}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      className="text-orange-600 font-semibold"
                      onClick={async () => {
                        await updateStock(row.id, edits[row.id] ?? 0);
                        toast.success("Updated");
                        await load();
                      }}
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      className="text-red-600"
                      onClick={async () => {
                        await markOutOfStock(row.id);
                        toast.success("Marked out of stock");
                        await load();
                      }}
                    >
                      OOS
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
