/**
 * Fail the production build if crawl-critical artifacts are missing or wrong.
 * Run after vite build + inject-route-meta.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CATEGORY_PAGES, SITE_ORIGIN, STATIC_PAGES } from "./seo-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");

const errors = [];

function fail(message) {
  errors.push(message);
}

function read(rel) {
  const full = path.join(distDir, rel);
  if (!fs.existsSync(full)) {
    fail(`missing ${rel}`);
    return null;
  }
  return fs.readFileSync(full, "utf8");
}

function mustContain(rel, html, snippets) {
  if (!html) return;
  for (const snippet of snippets) {
    if (!html.includes(snippet)) fail(`${rel} missing ${snippet}`);
  }
}

function mustNotContain(rel, html, snippets) {
  if (!html) return;
  for (const snippet of snippets) {
    if (html.includes(snippet)) fail(`${rel} must not contain ${snippet}`);
  }
}

function fileDirForPath(pagePath) {
  if (!pagePath || pagePath === "/") return "index.html";
  return path.join(pagePath.replace(/^\//, ""), "index.html");
}

function main() {
  if (!fs.existsSync(distDir)) {
    console.error("verify-seo-dist: dist/ not found");
    process.exit(1);
  }

  for (const file of ["index.html", "404.html", "robots.txt", "sitemap.xml", "llms.txt", "og-image.jpg"]) {
    if (!fs.existsSync(path.join(distDir, file))) fail(`missing dist/${file}`);
  }

  const robots = read("robots.txt");
  if (robots) {
    if (robots.trimStart().toLowerCase().startsWith("<!doctype") || robots.includes("<html")) {
      fail("robots.txt is HTML, not text");
    }
    if (!robots.includes("Sitemap: https://www.akmcare.in/sitemap.xml")) {
      fail("robots.txt missing Sitemap line");
    }
    for (const blocked of ["/admin", "/account", "/auth", "/cart", "/checkout", "/wishlist"]) {
      if (!robots.includes(`Disallow: ${blocked}`)) fail(`robots.txt missing Disallow: ${blocked}`);
    }
  }

  const llms = read("llms.txt");
  if (llms) {
    if (llms.trimStart().toLowerCase().startsWith("<!doctype") || llms.includes("<html")) {
      fail("llms.txt is HTML, not text");
    }
    if (!llms.includes("https://www.akmcare.in")) fail("llms.txt missing site URL");
    if (/one of india.?s best/i.test(llms)) fail("llms.txt contains unsupported marketing claim");
  }

  const og = path.join(distDir, "og-image.jpg");
  if (fs.existsSync(og)) {
    const buf = fs.readFileSync(og);
    if (buf.length < 1000 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) {
      fail("og-image.jpg is not a JPEG");
    }
  }

  const sitemap = read("sitemap.xml");
  if (sitemap) {
    if (!sitemap.includes("<urlset") || sitemap.includes("<html")) fail("sitemap.xml is not XML");
    for (const loc of [
      `${SITE_ORIGIN}/`,
      `${SITE_ORIGIN}/shop`,
      `${SITE_ORIGIN}/faq`,
      `${SITE_ORIGIN}/shipping-returns`,
      `${SITE_ORIGIN}/privacy`,
      `${SITE_ORIGIN}/terms`,
      ...CATEGORY_PAGES.map((c) => `${SITE_ORIGIN}/shop?category=${c.slug}`),
    ]) {
      if (!sitemap.includes(`<loc>${loc}</loc>`)) fail(`sitemap missing ${loc}`);
    }
    for (const blocked of ["/cart", "/checkout", "/account", "/admin", "/auth", "/wishlist"]) {
      if (sitemap.includes(`${SITE_ORIGIN}${blocked}`)) fail(`sitemap must not include ${blocked}`);
    }
  }

  const notFound = read("404.html");
  if (notFound) {
    mustContain("404.html", notFound, ['name="robots"', "noindex"]);
    mustNotContain("404.html", notFound, ['rel="canonical"', "https://www.akmcare.in/\""]);
    if (/rel=["']canonical["']/i.test(notFound)) fail("404.html has a canonical tag");
  }

  const requiredStatic = ["/", "/shop", "/faq", "/shipping-returns", "/privacy", "/terms"];
  for (const pagePath of requiredStatic) {
    const rel = fileDirForPath(pagePath);
    const html = read(rel);
    const meta = STATIC_PAGES.find((p) => p.path === pagePath);
    if (!html || !meta) continue;
    mustContain(rel, html, ["<title>", 'name="description"', 'rel="canonical"', `${SITE_ORIGIN}${pagePath}`]);
    if (pagePath === "/faq" || pagePath === "/shipping-returns") {
      if (!html.includes("FAQPage") && !html.includes('"@type":"FAQPage"')) {
        fail(`${rel} missing FAQPage JSON-LD`);
      }
    }
    if (pagePath === "/shop") {
      if (!html.includes("CollectionPage")) fail("shop/index.html missing CollectionPage JSON-LD");
    }
  }

  for (const category of CATEGORY_PAGES) {
    const rel = path.join("seo-category", category.slug, "index.html");
    const html = read(rel);
    if (!html) continue;
    mustContain(rel, html, [
      "<title>",
      'name="description"',
      `rel="canonical"`,
      `/shop?category=${category.slug}`,
      "CollectionPage",
      "BreadcrumbList",
    ]);
  }

  const pdpDir = path.join(distDir, "shop", "product");
  if (fs.existsSync(pdpDir)) {
    const slugs = fs.readdirSync(pdpDir).filter((name) => fs.existsSync(path.join(pdpDir, name, "index.html")));
    if (sitemap && sitemap.includes("/shop/product/") && slugs.length === 0) {
      fail("sitemap lists products but dist/shop/product has no HTML shells");
    }
    const sample = slugs.includes("akmc-turquoise-zari") ? "akmc-turquoise-zari" : slugs[0];
    if (sample) {
      const rel = path.join("shop", "product", sample, "index.html");
      const html = read(rel);
      mustContain(rel, html, [
        "<title>",
        'name="description"',
        'rel="canonical"',
        `/shop/product/${sample}`,
        "application/ld+json",
        '"Product"',
      ]);
    }
  } else if (sitemap && sitemap.includes("/shop/product/")) {
    fail("sitemap lists products but dist/shop/product is missing");
  }

  if (errors.length) {
    console.error(`verify-seo-dist: ${errors.length} error(s)`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log("verify-seo-dist: crawl artifacts OK");
}

main();
