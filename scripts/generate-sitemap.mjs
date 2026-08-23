/**
 * Build-time sitemap generator — queries Supabase for public products.
 *
 * Usage:
 *   node scripts/generate-sitemap.mjs
 *   node --env-file=.env scripts/generate-sitemap.mjs
 *
 * Env (server/build only — never VITE_ service keys):
 *   SUPABASE_URL or VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (preferred) or VITE_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "public", "sitemap.xml");

const SITE_ORIGIN = "https://www.akmcare.in";

function loadDotEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadDotEnv();

const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0", lastmod: true },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/services", changefreq: "monthly", priority: "0.9" },
  { path: "/training", changefreq: "monthly", priority: "0.9" },
  { path: "/shop", changefreq: "weekly", priority: "0.95" },
  { path: "/sell-your-product", changefreq: "monthly", priority: "0.7" },
  { path: "/personal-booking", changefreq: "monthly", priority: "0.5" },
  { path: "/media", changefreq: "weekly", priority: "0.7" },
  { path: "/motivation", changefreq: "daily", priority: "0.6" },
  { path: "/csr", changefreq: "monthly", priority: "0.6" },
  { path: "/careers", changefreq: "weekly", priority: "0.7" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.8" },
  { path: "/disclaimer", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.4" },
  { path: "/terms", changefreq: "yearly", priority: "0.4" },
  { path: "/shipping-returns", changefreq: "monthly", priority: "0.7" },
];

/** Matches OFFICIAL_BROWSABLE_CATEGORIES in src/data/catalog/categories.ts */
const CATEGORY_SLUGS = [
  "sarees",
  "ladies-gown",
  "stitched-lehenga",
  "unstitched-lehenga",
  "semi-stitched-gown",
  "semi-stitched-lehenga",
  "semi-stitched-blouse",
  "3-piece-suits",
  "mens-jeans",
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatLastmod(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const parts = [`  <url>`, `    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  parts.push(`  </url>`);
  return parts.join("\n");
}

async function fetchPublicProducts(supabase) {
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at, status")
    .not("slug", "is", null)
    .neq("slug", "")
    .neq("status", "draft")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`Supabase products query failed: ${error.message}`);
  return data ?? [];
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      "generate-sitemap: missing SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY",
    );
    process.exit(1);
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith("VITE_")) {
    console.error("generate-sitemap: service role key must not use VITE_ prefix");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const products = await fetchPublicProducts(supabase);

  const today = formatLastmod(new Date());
  const entries = [];

  for (const page of STATIC_PAGES) {
    entries.push(
      urlEntry({
        loc: `${SITE_ORIGIN}${page.path}`,
        lastmod: page.lastmod ? today : null,
        changefreq: page.changefreq,
        priority: page.priority,
      }),
    );
  }

  for (const category of CATEGORY_SLUGS) {
    entries.push(
      urlEntry({
        loc: `${SITE_ORIGIN}/shop?category=${encodeURIComponent(category)}`,
        changefreq: "weekly",
        priority: "0.9",
      }),
    );
  }

  for (const product of products) {
    entries.push(
      urlEntry({
        loc: `${SITE_ORIGIN}/shop/product/${encodeURIComponent(product.slug)}`,
        lastmod: formatLastmod(product.updated_at),
        changefreq: "weekly",
        priority: "0.7",
      }),
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${entries.join("\n")}
</urlset>
`;

  fs.writeFileSync(outPath, xml, "utf8");
  console.log(
    `generate-sitemap: wrote ${entries.length} URLs (${products.length} products) → public/sitemap.xml`,
  );
}

main().catch((err) => {
  console.error("generate-sitemap failed:", err.message || err);
  process.exit(1);
});
