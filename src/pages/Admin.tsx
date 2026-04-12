import { useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { getSupabaseAdminClient } from "@/lib/supabaseClient";
import { useServices } from "@/hooks/useServices";
import { useProducts } from "@/hooks/useProducts";
import { useMotivation } from "@/hooks/useMotivation";
import { useFAQ } from "@/hooks/useFAQ";
import { useInbox } from "@/hooks/useInbox";
import { useOrders } from "@/hooks/useOrders";

const tabs = ["Motivation", "Products", "Services", "FAQ", "Inbox", "Orders"] as const;

export default function Admin() {
  const [pin, setPin] = useState("");
  const [allowed, setAllowed] = useState(false);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Motivation");
  const admin = getSupabaseAdminClient();

  const { data: services } = useServices();
  const { data: products } = useProducts();
  const { data: quotes } = useMotivation();
  const { data: faqs } = useFAQ();
  const inbox = useInbox();
  const orders = useOrders();

  const unreadCounts = useMemo(
    () => ({
      contacts: inbox.data.contacts.filter((x) => !x.is_read).length,
      feedback: inbox.data.feedback.filter((x) => !x.is_read).length,
      interests: inbox.data.interests.filter((x) => !x.is_read).length,
      applications: inbox.data.applications.filter((x) => !x.is_read).length,
    }),
    [inbox.data],
  );

  if (!allowed) {
    return (
      <section className="section-padding">
        <div className="container-premium max-w-md">
          <div className="bg-card rounded-2xl p-8 card-shadow">
            <h1 className="font-heading text-3xl mb-3">Admin Access</h1>
            <p className="text-muted-foreground mb-4">Enter your admin PIN to continue.</p>
            <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" className="w-full px-4 py-3 rounded-xl border border-border bg-background mb-4" placeholder="Enter PIN" />
            <button
              onClick={() => {
                if (pin === (import.meta.env.VITE_ADMIN_PIN || "AKM2025")) setAllowed(true);
                else toast.error("Incorrect PIN");
              }}
              className="w-full rounded-full bg-primary text-primary-foreground py-3 font-semibold"
            >
              Unlock Admin
            </button>
          </div>
        </div>
      </section>
    );
  }

  const upsert = async (table: string, payload: any, id?: string) => {
    if (!admin) return toast.error("Admin client unavailable.");
    const query = id ? admin.from(table).update(payload).eq("id", id) : admin.from(table).insert(payload);
    const { error } = await query;
    if (error) toast.error(error.message);
    else toast.success("Saved successfully");
  };

  const remove = async (table: string, id: string) => {
    if (!admin) return toast.error("Admin client unavailable.");
    const { error } = await admin.from(table).delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Deleted");
  };

  return (
    <section className="section-padding bg-white">
      <div className="container-premium">
        <h1 className="font-heading text-3xl mb-6">AKM Admin Panel</h1>
        <div className="flex gap-2 overflow-x-auto mb-8">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 rounded-full font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "bg-accent"}`}>{t}</button>
          ))}
        </div>

        {tab === "Motivation" && <MotivationTab quotes={quotes} onSave={(payload) => upsert("motivation_quotes", payload)} onDelete={(id) => remove("motivation_quotes", id)} />}
        {tab === "Products" && <ProductsTab products={products} onSave={upsert} onDelete={remove} />}
        {tab === "Services" && <ServicesTab services={services} onSave={upsert} onDelete={remove} />}
        {tab === "FAQ" && <FAQTab faqs={faqs} onSave={upsert} onDelete={remove} />}
        {tab === "Inbox" && <InboxTab inbox={inbox.data} unreadCounts={unreadCounts} onMarkRead={async (table: string, id: string) => upsert(table, { is_read: true }, id)} />}
        {tab === "Orders" && <OrdersTab orders={orders.data} loading={orders.loading} />}
      </div>
    </section>
  );
}

function MotivationTab({ quotes, onSave, onDelete }: any) {
  const [quote, setQuote] = useState("");
  const [source, setSource] = useState("");
  return (
    <div className="space-y-4">
      <textarea className="w-full min-h-32 px-4 py-3 rounded-xl border" placeholder="Type today's motivation quote here..." value={quote} onChange={(e) => setQuote(e.target.value)} />
      <input className="w-full px-4 py-3 rounded-xl border" placeholder="Source / Author" value={source} onChange={(e) => setSource(e.target.value)} />
      <button className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold" onClick={() => onSave({ quote, source: source || "AKM Care", is_active: true })}>Post Quote ✓</button>
      {quotes.slice(0, 10).map((q: any) => (
        <div key={q.id} className="bg-card rounded-xl border p-4 flex justify-between gap-4">
          <div><p className="font-medium">{q.quote}</p><p className="text-sm text-muted-foreground">- {q.source}</p></div>
          <button className="text-destructive" onClick={() => onDelete(q.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function ProductsTab({ products, onSave, onDelete }: any) {
  const [form, setForm] = useState({ name: "", price: 0, quantity: "", stock_quantity: 10, description: "", image_url: "", status: "available" });
  return (
    <div className="space-y-4">
      <input className="w-full px-4 py-3 rounded-xl border" placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="w-full px-4 py-3 rounded-xl border" placeholder="Price" type="number" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
      <input className="w-full px-4 py-3 rounded-xl border" placeholder="Weight/Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
      <input className="w-full px-4 py-3 rounded-xl border" placeholder="Stock Quantity (0-50)" type="number" min={0} max={50} value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Math.min(50, Math.max(0, Number(e.target.value))) })} />
      <textarea className="w-full px-4 py-3 rounded-xl border" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <input className="w-full px-4 py-3 rounded-xl border" placeholder="Product Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
      <button className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold" onClick={() => onSave("products", { ...form, status: form.stock_quantity > 0 ? "available" : "sold_out" })}>Add Product ✓</button>
      <div className="grid md:grid-cols-2 gap-4">{products.map((p: any) => <EditableCard key={p.id} title={p.name} subtitle={`Rs ${p.price} - ${(p.stock_quantity ?? 0) > 0 ? `In Stock (${p.stock_quantity})` : "Out of Stock"}`} onDelete={() => onDelete("products", p.id)} onUpdate={(payload: any) => onSave("products", { ...payload, stock_quantity: Math.min(50, Math.max(0, Number(payload.stock_quantity ?? 0))), status: Number(payload.stock_quantity ?? 0) > 0 ? "available" : "sold_out" }, p.id)} fields={["name","price","quantity","stock_quantity","description","image_url"]} data={p} />)}</div>
    </div>
  );
}

function ServicesTab({ services, onSave, onDelete }: any) {
  const [form, setForm] = useState({ title: "", description: "", category: "training", icon: "Briefcase" });
  return (
    <div className="space-y-4">
      <input className="w-full px-4 py-3 rounded-xl border" placeholder="Service Name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea className="w-full px-4 py-3 rounded-xl border" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <select className="w-full px-4 py-3 rounded-xl border" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="training">Training</option><option value="hr">HR</option><option value="logistics">Logistics</option><option value="compliance">Compliance</option><option value="other">Other</option></select>
      <select className="w-full px-4 py-3 rounded-xl border" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>{["Briefcase","GraduationCap","Users","ShieldCheck","Truck","ChefHat","Plane","Wrench","Settings","Heart","Code"].map((x) => <option key={x}>{x}</option>)}</select>
      <button className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold" onClick={() => onSave("services", form)}>Add Service ✓</button>
      <div className="space-y-3">{services.map((s: any) => <EditableCard key={s.id} title={s.title} subtitle={s.category} onDelete={() => onDelete("services", s.id)} onUpdate={(payload: any) => onSave("services", payload, s.id)} fields={["title","description","category","icon","display_order"]} data={s} />)}</div>
    </div>
  );
}

function FAQTab({ faqs, onSave, onDelete }: any) {
  const [form, setForm] = useState({ question: "", answer: "", category: "general" });
  return (
    <div className="space-y-4">
      <input className="w-full px-4 py-3 rounded-xl border" placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
      <textarea className="w-full px-4 py-3 rounded-xl border" placeholder="Answer" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
      <select className="w-full px-4 py-3 rounded-xl border" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="general">General</option><option value="training">Training</option><option value="services">Services</option><option value="products">Products</option><option value="logistics">Logistics</option></select>
      <button className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold" onClick={() => onSave("faq", form)}>Add FAQ ✓</button>
      <div className="space-y-3">{faqs.map((f: any) => <EditableCard key={f.id} title={f.question} subtitle={f.category} onDelete={() => onDelete("faq", f.id)} onUpdate={(payload: any) => onSave("faq", payload, f.id)} fields={["question","answer","category","display_order"]} data={f} />)}</div>
    </div>
  );
}

function InboxTab({ inbox, unreadCounts, onMarkRead }: any) {
  const [active, setActive] = useState("contacts");
  const sections = [
    { key: "contacts", table: "contact_submissions", label: `Contacts (${unreadCounts.contacts})`, data: inbox.contacts },
    { key: "feedback", table: "feedback_submissions", label: `Feedback (${unreadCounts.feedback})`, data: inbox.feedback },
    { key: "interests", table: "product_interests", label: `Product Interests (${unreadCounts.interests})`, data: inbox.interests },
    { key: "applications", table: "career_applications", label: `Applications (${unreadCounts.applications})`, data: inbox.applications },
  ];
  const current = sections.find((x) => x.key === active) || sections[0];
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto mb-4">{sections.map((s) => <button key={s.key} onClick={() => setActive(s.key)} className="px-4 py-2 rounded-full bg-accent">{s.label}</button>)}</div>
      <div className="space-y-3">{current.data.map((item: any) => <div key={item.id} className="bg-card rounded-xl border p-4"><pre className="text-sm whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre><button onClick={() => onMarkRead(current.table, item.id)} className="mt-3 px-4 py-2 rounded-full bg-primary text-primary-foreground">Mark as Read</button></div>)}</div>
    </div>
  );
}

function OrdersTab({ orders, loading }: any) {
  if (loading) return <div className="text-muted-foreground">Loading orders...</div>;
  if (!orders.length) return <div className="text-muted-foreground">No orders yet.</div>;

  return (
    <div className="space-y-3">
      {orders.map((order: any) => (
        <div key={order.id} className="bg-card rounded-xl border p-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="font-semibold">{order.product_name}</h3>
              <p className="text-sm text-muted-foreground">{order.customer_name} • {order.customer_email}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${order.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
              {order.payment_status}
            </span>
          </div>
          <div className="text-sm text-muted-foreground grid sm:grid-cols-2 gap-1">
            <p>Amount: ₹{order.amount}</p>
            <p>Qty: {order.quantity}</p>
            <p>Order ID: {order.razorpay_order_id}</p>
            <p>Payment ID: {order.razorpay_payment_id || "-"}</p>
            <p>Phone: {order.customer_phone || "-"}</p>
            <p>Date: {new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EditableCard({ title, subtitle, onDelete, onUpdate, fields, data }: any) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(data);
  return (
    <div className="bg-card rounded-xl border p-4">
      {!editing ? (
        <>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          <div className="flex gap-3 mt-3"><button onClick={() => setEditing(true)} className="text-primary">Edit</button><button onClick={onDelete} className="text-destructive">Delete</button></div>
        </>
      ) : (
        <>
          {fields.map((f: string) => (
            <input key={f} className="w-full mb-2 px-3 py-2 rounded-lg border" value={form[f] ?? ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
          ))}
          <div className="flex gap-3"><button onClick={() => { onUpdate(form); setEditing(false); }} className="text-primary">Save</button><button onClick={() => setEditing(false)}>Cancel</button></div>
        </>
      )}
    </div>
  );
}
