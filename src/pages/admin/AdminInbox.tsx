import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminPageHeader, Chip } from "@/components/admin/AdminUI";
import { adminCrudList, adminCrudUpsert } from "@/services/adminCmsService";

const SECTIONS = [
  { key: "contacts", table: "contact_submissions", label: "Contacts" },
  { key: "feedback", table: "feedback_submissions", label: "Feedback" },
  { key: "interests", table: "product_interests", label: "Product interests" },
  { key: "applications", table: "career_applications", label: "Applications" },
] as const;

export default function AdminInboxPage() {
  const [active, setActive] = useState<(typeof SECTIONS)[number]["key"]>("contacts");
  const [data, setData] = useState<Record<string, any[]>>({
    contacts: [],
    feedback: [],
    interests: [],
    applications: [],
  });

  const load = async () => {
    const [contacts, feedback, interests, applications] = await Promise.all(
      SECTIONS.map((s) => adminCrudList(s.table)),
    );
    setData({ contacts, feedback, interests, applications });
  };

  useEffect(() => {
    void load().catch((e) => toast.error(e.message));
  }, []);

  const current = SECTIONS.find((s) => s.key === active)!;
  const rows = data[active] || [];
  const unread = useMemo(
    () => Object.fromEntries(SECTIONS.map((s) => [s.key, (data[s.key] || []).filter((x) => !x.is_read).length])),
    [data],
  );

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Inbox" subtitle="Contact, feedback, product interest, and career submissions." />
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <Chip key={s.key} active={active === s.key} onClick={() => setActive(s.key)}>
            {s.label} ({unread[s.key] || 0})
          </Chip>
        ))}
      </div>
      <div className="space-y-3">
        {!rows.length ? (
          <p className="text-sm text-slate-500">No items.</p>
        ) : (
          rows.map((item) => (
            <div key={item.id} className="rounded-2xl border bg-white p-4">
              <pre className="text-xs whitespace-pre-wrap overflow-x-auto">{JSON.stringify(item, null, 2)}</pre>
              {!item.is_read && (
                <button
                  type="button"
                  className="mt-3 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold"
                  onClick={async () => {
                    await adminCrudUpsert(current.table, { is_read: true }, item.id);
                    toast.success("Marked read");
                    await load();
                  }}
                >
                  Mark as read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
