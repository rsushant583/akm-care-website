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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState({ name: "AKM Care", tagline: "" });
  const [contact, setContact] = useState({ phones: "", emails: "", address: "" });
  const [social, setSocial] = useState({ facebook: "", instagram: "", youtube: "", linkedin: "" });
  const [shipping, setShipping] = useState({ standard: 49, express: 99, free_above: 999 });
  const [parcel, setParcel] = useState({ weight_kg: "", length_cm: "", breadth_cm: "", height_cm: "" });
  const [tax, setTax] = useState({ default_gst: 5, currency: "INR" });
  const [theme, setTheme] = useState({ primary: "#E8621A" });
  const [catalog, setCatalog] = useState<CatalogBusinessSettings>({ ...DEFAULT_CATALOG_SETTINGS });
  const [catalogConfigured, setCatalogConfigured] = useState(false);

  useEffect(() => {
    setLoading(true);
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
        const parcelVal = s.parcel_profile as {
          weight_kg?: number | string;
          length_cm?: number | string;
          breadth_cm?: number | string;
          height_cm?: number | string;
        } | undefined;
        if (parcelVal) {
          setParcel({
            weight_kg: parcelVal.weight_kg != null ? String(parcelVal.weight_kg) : "",
            length_cm: parcelVal.length_cm != null ? String(parcelVal.length_cm) : "",
            breadth_cm: parcelVal.breadth_cm != null ? String(parcelVal.breadth_cm) : "",
            height_cm: parcelVal.height_cm != null ? String(parcelVal.height_cm) : "",
          });
        }
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
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const saveAll = async () => {
    if (!allowed) return toast.error("Only Admin / Super Admin can change settings");
    setSaving(true);
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
        saveSetting("parcel_profile", {
          weight_kg: parcel.weight_kg === "" ? null : Number(parcel.weight_kg),
          length_cm: parcel.length_cm === "" ? null : Number(parcel.length_cm),
          breadth_cm: parcel.breadth_cm === "" ? null : Number(parcel.breadth_cm),
          height_cm: parcel.height_cm === "" ? null : Number(parcel.height_cm),
        }),
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
      toast.success("Store settings saved — public contact/WhatsApp will use these values.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading store settings…</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <AdminPageHeader
        title="Store Settings"
        subtitle="Company, customer support, shipping, and catalog rules. Changes to contact/WhatsApp appear on the public Footer and Contact page."
      />
      {!allowed && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          Staff can view settings but only Admin / Super Admin can save.
        </p>
      )}

      <Section title="Company information">
        <FieldLabel label="Company name" />
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="AKM Care" />
        <FieldLabel label="Tagline" />
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={company.tagline} onChange={(e) => setCompany({ ...company, tagline: e.target.value })} placeholder="Optional tagline" />
      </Section>

      <Section title="Customer support (public site)">
        <p className="text-xs text-slate-500">
          These values drive Footer and Contact. If a field is blank, the site keeps the existing approved fallback.
        </p>
        <FieldLabel label="Support phone(s)" hint="Comma-separated. First number is primary." />
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={contact.phones} onChange={(e) => setContact({ ...contact, phones: e.target.value })} placeholder="+91-84019 95486" />
        <FieldLabel label="Support email(s)" hint="Comma-separated. First email is primary." />
        <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={contact.emails} onChange={(e) => setContact({ ...contact, emails: e.target.value })} placeholder="contact@akmcare.in" />
        <FieldLabel label="Address" />
        <textarea className="w-full rounded-xl border px-3 py-2.5 text-sm" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} placeholder="Ahmedabad, Gujarat, India" />
        <FieldLabel label="WhatsApp number" hint="Used for wa.me link. Leave blank to use support phone / fallback." />
        <input
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
          value={catalog.whatsapp}
          onChange={(e) => setCatalog({ ...catalog, whatsapp: e.target.value })}
          placeholder={catalogConfigured && catalog.whatsapp ? "WhatsApp number" : "Needs configuration (optional)"}
        />
        <FieldLabel label="Business hours" hint="Shown on Footer/Contact only when set." />
        <input
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
          value={catalog.business_hours}
          onChange={(e) => setCatalog({ ...catalog, business_hours: e.target.value })}
          placeholder="e.g. Mon–Sat 10:00–19:00 IST"
        />
      </Section>

      <Section title="Social links">
        {(["facebook", "instagram", "youtube", "linkedin"] as const).map((k) => (
          <div key={k}>
            <FieldLabel label={k.charAt(0).toUpperCase() + k.slice(1)} />
            <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={social[k]} onChange={(e) => setSocial({ ...social, [k]: e.target.value })} placeholder={`${k} URL`} />
          </div>
        ))}
      </Section>

      <Section title="Shipping charges">
        <div className="grid sm:grid-cols-3 gap-3">
          <Num label="Standard (₹)" value={shipping.standard} onChange={(v) => setShipping({ ...shipping, standard: v })} />
          <Num label="Express (₹)" value={shipping.express} onChange={(v) => setShipping({ ...shipping, express: v })} />
          <Num label="Free above (₹)" value={shipping.free_above} onChange={(v) => setShipping({ ...shipping, free_above: v })} />
        </div>
      </Section>

      <Section title="Default parcel profile (logistics)">
        <p className="text-xs text-slate-500">
          Required before creating Shiprocket shipments. Use real package deadweight (kg) and L×B×H (cm). Do not
          enter saree length here — catalog dimensions stay separate.
        </p>
        <div className="grid sm:grid-cols-4 gap-3">
          <label className="text-sm">
            <span className="font-medium">Weight (kg)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className="mt-1 w-full rounded-xl border px-3 py-2.5"
              value={parcel.weight_kg}
              onChange={(e) => setParcel({ ...parcel, weight_kg: e.target.value })}
              placeholder="e.g. 0.5"
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Length (cm)</span>
            <input
              type="number"
              min={0}
              step="0.1"
              className="mt-1 w-full rounded-xl border px-3 py-2.5"
              value={parcel.length_cm}
              onChange={(e) => setParcel({ ...parcel, length_cm: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Breadth (cm)</span>
            <input
              type="number"
              min={0}
              step="0.1"
              className="mt-1 w-full rounded-xl border px-3 py-2.5"
              value={parcel.breadth_cm}
              onChange={(e) => setParcel({ ...parcel, breadth_cm: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Height (cm)</span>
            <input
              type="number"
              min={0}
              step="0.1"
              className="mt-1 w-full rounded-xl border px-3 py-2.5"
              value={parcel.height_cm}
              onChange={(e) => setParcel({ ...parcel, height_cm: e.target.value })}
            />
          </label>
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
          Deals require a real discount from MRP vs AKM Care price. Bestsellers stay manual — only toggle with sales evidence.
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

      <button
        type="button"
        disabled={!allowed || saving}
        onClick={() => void saveAll()}
        className="rounded-xl bg-orange-500 text-white px-6 py-3 font-semibold disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="pt-1">
      <p className="text-sm font-medium">{label}</p>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
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
