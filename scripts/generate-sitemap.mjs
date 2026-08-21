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
import {
  SITE_ORIGIN,
  STATIC_PAGES,
  CATEGORY_PAGES,
  FAQ_PRERENDER,
  escapeXml,
  isPublicSitemapSlug,
  toSitemapImageUrl,
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqPageJsonLd,
} from "./seo-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "public", "sitemap.xml");
const prerenderPath = path.join(root, ".cache", "prerender-routes.json");

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

function formatLastmod(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function urlEntry({ loc, lastmod, changefreq, priority, image }) {
  const parts = [`  <url>`, `    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  if (image) {
    parts.push(`    <image:image>`);
    parts.push(`      <image:loc>${escapeXml(image)}</image:loc>`);
    parts.push(`    </image:image>`);
  }
  parts.push(`  </url>`);
  return parts.join("\n");
}

function toAbsoluteImage(src) {
  return toSitemapImageUrl(src, SITE_ORIGIN);
}

async function fetchPublicProducts(supabase) {
  const rich = await supabase
    .from("products")
    .select(
      "slug, name, short_description, seo_title, seo_description, updated_at, status, image_url, akm_care_price, selling_price, stock_quantity, sku, category, colors, specifications",
    )
    .not("slug", "is", null)
    .neq("slug", "")
    .not("status", "in", "(draft,archived)")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (!rich.error) return rich.data ?? [];

  const fallback = await supabase
    .from("products")
    .select("slug, updated_at, status")
    .not("slug", "is", null)
    .neq("slug", "")
    .not("status", "in", "(draft,archived)")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (fallback.error) {
    throw new Error(`Supabase products query failed: ${fallback.error.message}`);
  }
  return fallback.data ?? [];
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
  const prerender = [];
  const seen = new Set();

  function pushUnique(loc, entry, route) {
    if (seen.has(loc)) return;
    seen.add(loc);
    entries.push(entry);
    if (route) prerender.push(route);
  }

  for (const page of STATIC_PAGES) {
    const loc = `${SITE_ORIGIN}${page.path}`;
    const jsonLd = [breadcrumbJsonLd([{ name: "Home", url: "/" }, { name: page.title, url: page.path }])];
    if (page.path === "/shop") {
      jsonLd.push(
        collectionPageJsonLd({
          name: "All Products",
          description: page.description,
          url: "/shop",
        }),
      );
    }
    if (page.path === "/faq" || page.path === "/shipping-returns") {
      jsonLd.push(faqPageJsonLd(FAQ_PRERENDER));
    }
    pushUnique(
      loc,
      urlEntry({
        loc,
        lastmod: page.lastmod ? today : null,
        changefreq: page.changefreq,
        priority: page.priority,
      }),
      {
        path: page.path,
        title: page.title,
        description: page.description,
        ogType: "website",
        jsonLd,
      },
    );
  }

  for (const category of CATEGORY_PAGES) {
    const locPath = `/shop?category=${encodeURIComponent(category.slug)}`;
    const loc = `${SITE_ORIGIN}${locPath}`;
    const categoryItems = products
      .filter((product) => String(product.category || "").trim() === category.slug)
      .filter((product) => isPublicSitemapSlug(product.slug))
      .slice(0, 24)
      .map((product) => ({
        name: String(product.name || product.slug).trim(),
        url: `/shop/product/${encodeURIComponent(String(product.slug).trim())}`,
      }));
    pushUnique(
      loc,
      urlEntry({
        loc,
        changefreq: "weekly",
        priority: "0.9",
      }),
      {
        path: locPath,
        filePath: `/seo-category/${category.slug}`,
        title: category.title,
        description: category.description,
        ogType: "website",
        jsonLd: [
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Shop", url: "/shop" },
            { name: category.title.replace(" — Shop", ""), url: locPath },
          ]),
          collectionPageJsonLd({
            name: category.title.replace(" — Shop", ""),
            description: category.description,
            url: locPath,
            items: categoryItems,
          }),
        ],
      },
    );
  }

  for (const product of products) {
    const slug = String(product.slug || "").trim();
    if (!isPublicSitemapSlug(slug)) continue;
    const locPath = `/shop/product/${encodeURIComponent(slug)}`;
    const loc = `${SITE_ORIGIN}/shop/product/${encodeURIComponent(slug)}`;
    const image = toAbsoluteImage(product.image_url);
    const name = String(product.name || slug).trim();
    const description = String(
      product.seo_description || product.short_description || `${name} — shop online at AKM Care.`,
    )
      .trim()
      .slice(0, 160);

    const price =
      product.akm_care_price != null || product.selling_price != null
        ? String(product.akm_care_price ?? product.selling_price)
        : undefined;
    const stock = Number(product.stock_quantity);
    const offers = {
      "@type": "Offer",
      url: loc,
      priceCurrency: "INR",
    };
    if (price && Number.isFinite(Number(price))) offers.price = price;
    if (Number.isFinite(stock)) {
      offers.availability =
        stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      description,
      url: loc,
      brand: { "@type": "Brand", name: "AKM Care" },
      offers,
    };
    if (image) jsonLd.image = image;
    const sku = String(product.sku || "").trim();
    if (sku && !/^(na|n\/a|-)$/i.test(sku)) jsonLd.sku = sku;
    const colorNames = Array.isArray(product.colors)
      ? product.colors
          .map((c) => (c && c.name ? String(c.name).trim() : ""))
          .filter((name) => name && !/^(na|n\/a|-|\d+)$/i.test(name))
      : [];
    if (colorNames.length === 1) jsonLd.color = colorNames[0];
    else if (colorNames.length > 1) jsonLd.color = colorNames;
    const specs = product.specifications && typeof product.specifications === "object" ? product.specifications : null;
    if (specs) {
      const materialEntry = Object.entries(specs).find(
        ([key, value]) => /^(material|fabric)$/i.test(String(key).trim()) && String(value || "").trim(),
      );
      if (materialEntry) jsonLd.material = String(materialEntry[1]).trim();
      const additionalProperty = [];
      for (const [name, value] of Object.entries(specs)) {
        if (!String(value ?? "").trim()) continue;
        additionalProperty.push({ "@type": "PropertyValue", name, value: String(value).trim() });
      }
      if (additionalProperty.length) jsonLd.additionalProperty = additionalProperty;
    }

    pushUnique(
      loc,
      urlEntry({
        loc,
        lastmod: formatLastmod(product.updated_at),
        changefreq: "weekly",
        priority: "0.7",
        image,
      }),
      {
        path: locPath,
        filePath: `/shop/product/${slug}`,
        title: String(product.seo_title || name).trim(),
        description,
        ogImage: image || undefined,
        ogType: "product",
        jsonLd: [
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Shop", url: "/shop" },
            { name, url: locPath },
          ]),
          jsonLd,
        ],
      },
    );
  }

  const hasImages = entries.some((block) => block.includes("<image:image>"));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${
    hasImages ? `\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"` : ""
  }
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${entries.join("\n")}
</urlset>
`;

  fs.mkdirSync(path.dirname(prerenderPath), { recursive: true });
  fs.writeFileSync(outPath, xml, "utf8");
  fs.writeFileSync(prerenderPath, JSON.stringify({ generatedAt: today, routes: prerender }, null, 2), "utf8");
  console.log(
    `generate-sitemap: wrote ${entries.length} URLs (${products.length} products) → public/sitemap.xml`,
  );
}

main().catch((err) => {
  console.error("generate-sitemap failed:", err.message || err);
  process.exit(1);
});
