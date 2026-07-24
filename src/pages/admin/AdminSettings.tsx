import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { getAllSettings, saveSetting } from "@/services/adminCmsService";
import { canManageSettings } from "@/services/adminAuthService";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminSettingsPage() {
  const { role } = useAdminAuth();
  const allowed = canManageSettings(role || "staff");
  const [company, setCompany] = useState({ name: "AKM Care", tagline: "" });
  const [contact, setContact] = useState({ phones: "", emails: "", address: "" });
  const [social, setSocial] = useState({ facebook: "", instagram: "", youtube: "", linkedin: "" });
  const [shipping, setShipping] = useState({ standard: 49, express: 99, free_above: 999 });
  const [tax, setTax] = useState({ default_gst: 5, currency: "INR" });
  const [theme, setTheme] = useState({ primary: "#E8621A" });

  useEffect(() => {
    void getAllSettings()
      .then((s: any) => {
        if (s.company) setCompany({ name: s.company.name || "", tagline: s.company.tagline || "" });
        if (s.contact) {
          setContact({
            phones: Array.isArray(s.contact.phones) ? s.contact.phones.join(", ") : s.contact.phones || "",
            emails: Array.isArray(s.contact.emails) ? s.contact.emails.join(", ") : s.contact.emails || "",
            address: s.contact.address || "",
          });
        }
        if (s.social) setSocial({ facebook: "", instagram: "", youtube: "", linkedin: "", ...s.social });
        if (s.shipping) setShipping({ standard: 49, express: 99, free_above: 999, ...s.shipping });
        if (s.tax) setTax({ default_gst: 5, currency: "INR", ...s.tax });
        if (s.theme) setTheme({ primary: "#E8621A", ...s.theme });
      })
      .catch((e) => toast.error(e.message));
  }, []);

  const saveAll = async () => {
    if (!allowed) return toast.error("Only Admin / Super Admin can change settings");
    try {
      await Promise.all([
        saveSetting("company", company),
        saveSetting("contact", {
          phones: contact.phones.split(",").map((x) => x.trim()).filter(Boolean),
          emails: contact.emails.split(",").map((x) => x.trim()).filter(Boolean),
          address: contact.address,
        }),
        saveSetting("social", social),
        saveSetting("shipping", shipping),
        saveSetting("tax", tax),
        saveSetting("theme", theme),
      ]);
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <AdminPageHeader title="Settings" subtitle="Company, contact, shipping, tax, currency, and theme." />
      {!allowed && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Staff can view settings but only Admin / Super Admin can save.</p>}

      <Section title="Company information">
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="Company name" />
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={company.tagline} onChange={(e) => setCompany({ ...company, tagline: e.target.value })} placeholder="Tagline" />
      </Section>

      <Section title="Contact">
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={contact.phones} onChange={(e) => setContact({ ...contact, phones: e.target.value })} placeholder="Phones (comma-separated)" />
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={contact.emails} onChange={(e) => setContact({ ...contact, emails: e.target.value })} placeholder="Emails (comma-separated)" />
        <textarea className="w-full rounded-xl border px-3 py-2.5 text-sm" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} placeholder="Address" />
      </Section>

      <Section title="Social links">
        {(["facebook", "instagram", "youtube", "linkedin"] as const).map((k) => (
          <input key={k} className="w-full rounded-xl border px-3 py-2.5 text-sm" value={(social as any)[k]} onChange={(e) => setSocial({ ...social, [k]: e.target.value })} placeholder={k} />
        ))}
      </Section>

      <Section title="Shipping charges">
        <div className="grid sm:grid-cols-3 gap-3">
          <Num label="Standard" value={shipping.standard} onChange={(v) => setShipping({ ...shipping, standard: v })} />
          <Num label="Express" value={shipping.express} onChange={(v) => setShipping({ ...shipping, express: v })} />
          <Num label="Free above" value={shipping.free_above} onChange={(v) => setShipping({ ...shipping, free_above: v })} />
        </div>
      </Section>

      <Section title="Tax & currency">
        <div className="grid sm:grid-cols-2 gap-3">
          <Num label="Default GST %" value={tax.default_gst} onChange={(v) => setTax({ ...tax, default_gst: v })} />
          <label className="text-sm">
            <span className="font-medium">Currency</span>
            <input className="mt-1 w-full rounded-xl border px-3 py-2.5" value={tax.currency} onChange={(e) => setTax({ ...tax, currency: e.target.value })} />
          </label>
        </div>
      </Section>

      <Section title="Theme">
        <label className="text-sm">
          <span className="font-medium">Primary color</span>
          <input type="color" className="mt-1 block h-10 w-24" value={theme.primary} onChange={(e) => setTheme({ ...theme, primary: e.target.value })} />
        </label>
      </Section>

      <button type="button" disabled={!allowed} onClick={() => void saveAll()} className="rounded-xl bg-orange-500 text-white px-6 py-3 font-semibold disabled:opacity-50">
        Save settings
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-5 space-y-3">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="text-sm">
      <span className="font-medium">{label}</span>
      <input type="number" className="mt-1 w-full rounded-xl border px-3 py-2.5" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
