import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { getAllSettings, saveSetting } from "@/services/adminCmsService";
import { canManageSettings } from "@/services/adminAuthService";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  DEFAULT_CATALOG_SETTINGS,
  normalizeCatalogSettings,
  type CatalogBusinessSettings,
} from "@/lib/admin/catalogSettings";

export default function AdminSettingsPage() {
  const { role } = useAdminAuth();
  const allowed = canManageSettings(role || "staff");
  const [company, setCompany] = useState({ name: "AKM Care", tagline: "" });
  const [contact, setContact] = useState({ phones: "", emails: "", address: "" });
  const [social, setSocial] = useState({ facebook: "", instagram: "", youtube: "", linkedin: "" });
  const [shipping, setShipping] = useState({ standard: 49, express: 99, free_above: 999 });
  const [tax, setTax] = useState({ default_gst: 5, currency: "INR" });
  const [theme, setTheme] = useState({ primary: "#E8621A" });
  const [catalog, setCatalog] = useState<CatalogBusinessSettings>({ ...DEFAULT_CATALOG_SETTINGS });
  const [catalogConfigured, setCatalogConfigured] = useState(false);

  useEffect(() => {
    void getAllSettings()
      .then((s: Record<string, unknown>) => {
        const companyVal = s.company as { name?: string; tagline?: string } | undefined;
        if (companyVal) setCompany({ name: companyVal.name || "", tagline: companyVal.tagline || "" });
        const contactVal = s.contact as { phones?: string[] | string; emails?: string[] | string; address?: string } | undefined;
        if (contactVal) {
          setContact({
            phones: Array.isArray(contactVal.phones) ? contactVal.phones.join(", ") : contactVal.phones || "",
            emails: Array.isArray(contactVal.emails) ? contactVal.emails.join(", ") : contactVal.emails || "",
            address: contactVal.address || "",
          });
        }
        const socialVal = s.social as Partial<typeof social> | undefined;
        if (socialVal) setSocial({ facebook: "", instagram: "", youtube: "", linkedin: "", ...socialVal });
        const shippingVal = s.shipping as Partial<typeof shipping> | undefined;
        if (shippingVal) setShipping({ standard: 49, express: 99, free_above: 999, ...shippingVal });
        const taxVal = s.tax as Partial<typeof tax> | undefined;
        if (taxVal) setTax({ default_gst: 5, currency: "INR", ...taxVal });
        const themeVal = s.theme as Partial<typeof theme> | undefined;
        if (themeVal) setTheme({ primary: "#E8621A", ...themeVal });
        if (s.catalog) {
          setCatalog(normalizeCatalogSettings(s.catalog));
          setCatalogConfigured(true);
        } else {
          setCatalog({ ...DEFAULT_CATALOG_SETTINGS });
          setCatalogConfigured(false);
        }
      })
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to load settings"));
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
        saveSetting("catalog", {
          low_stock_threshold: catalog.low_stock_threshold,
          deal_threshold_percent: catalog.deal_threshold_percent,
          new_arrival_days: catalog.new_arrival_days,
          whatsapp: catalog.whatsapp,
          business_hours: catalog.business_hours,
        }),
      ]);
      setCatalogConfigured(true);
      toast.success("Settings saved");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <AdminPageHeader title="Store Settings" subtitle="Company, contact, shipping, catalog thresholds, and theme. No secrets here." />
      {!allowed && <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Staff can view settings but only Admin / Super Admin can save.</p>}

      <Section title="Company information">
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="Company name" />
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={company.tagline} onChange={(e) => setCompany({ ...company, tagline: e.target.value })} placeholder="Tagline" />
      </Section>

      <Section title="Customer support contact">
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={contact.phones} onChange={(e) => setContact({ ...contact, phones: e.target.value })} placeholder="Phones (comma-separated)" />
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={contact.emails} onChange={(e) => setContact({ ...contact, emails: e.target.value })} placeholder="Emails (comma-separated)" />
        <textarea className="w-full rounded-xl border px-3 py-2.5 text-sm" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} placeholder="Address" />
        <input
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
          value={catalog.whatsapp}
          onChange={(e) => setCatalog({ ...catalog, whatsapp: e.target.value })}
          placeholder={catalogConfigured && catalog.whatsapp ? "WhatsApp number" : "WhatsApp number (needs configuration)"}
        />
        <input
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
          value={catalog.business_hours}
          onChange={(e) => setCatalog({ ...catalog, business_hours: e.target.value })}
          placeholder={catalog.business_hours ? "Business hours" : "Business hours (needs configuration)"}
        />
        <p className="text-xs text-slate-500">Leave WhatsApp / hours blank until the business provides authoritative values. Do not invent contact details.</p>
      </Section>

      <Section title="Social links">
        {(["facebook", "instagram", "youtube", "linkedin"] as const).map((k) => (
          <input key={k} className="w-full rounded-xl border px-3 py-2.5 text-sm" value={social[k]} onChange={(e) => setSocial({ ...social, [k]: e.target.value })} placeholder={k} />
        ))}
      </Section>

      <Section title="Shipping charges">
        <div className="grid sm:grid-cols-3 gap-3">
          <Num label="Standard" value={shipping.standard} onChange={(v) => setShipping({ ...shipping, standard: v })} />
          <Num label="Express" value={shipping.express} onChange={(v) => setShipping({ ...shipping, express: v })} />
          <Num label="Free above" value={shipping.free_above} onChange={(v) => setShipping({ ...shipping, free_above: v })} />
        </div>
      </Section>

      <Section title="Catalog & merchandising rules">
        {!catalogConfigured && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Showing platform defaults (same as current storefront behavior). Save once to persist in the database.
          </p>
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          <Num label="Low-stock threshold" value={catalog.low_stock_threshold} onChange={(v) => setCatalog({ ...catalog, low_stock_threshold: v })} />
          <Num label="Deal threshold %" value={catalog.deal_threshold_percent} onChange={(v) => setCatalog({ ...catalog, deal_threshold_percent: v })} />
          <Num label="New-arrival window (days)" value={catalog.new_arrival_days} onChange={(v) => setCatalog({ ...catalog, new_arrival_days: v })} />
        </div>
        <p className="text-xs text-slate-500">
          Deals still require a real discount from MRP vs AKM Care price. Bestsellers stay manual — only toggle with sales evidence. Featured stays an explicit admin toggle.
        </p>
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
