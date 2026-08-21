/**
 * Post-build: copy dist/index.html to indexable routes with unique title/description/canonical.
 * Lets crawlers that do not execute JavaScript still see the correct metadata.
 *
 * Official category URLs are query strings (`/shop?category=sarees`). Those cannot be
 * filesystem paths, so shells are written to dist/seo-category/{slug}/index.html and
 * served by middleware for the public query URL.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SITE_ORIGIN, BRAND_NAME, fullTitle, escapeHtml } from "./seo-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const prerenderPath = path.join(root, ".cache", "prerender-routes.json");

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceMeta(html, attrEquals, content) {
  const escaped = escapeHtml(content);
  const token = escapeRegExp(attrEquals);
  const patterns = [
    new RegExp(`(<meta[^>]+${token}[^>]*content=")[^"]*(")`, "i"),
    new RegExp(`(<meta[^>]+content=")[^"]*("[^>]*${token})`, "i"),
  ];
  for (const pattern of patterns) {
    if (pattern.test(html)) return html.replace(pattern, `$1${escaped}$2`);
  }
  return html;
}

function replaceTag(html, tag, content) {
  const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "i");
  if (re.test(html)) return html.replace(re, `<${tag}>${escapeHtml(content)}</${tag}>`);
  return html.replace("</head>", `    <${tag}>${escapeHtml(content)}</${tag}>\n  </head>`);
}

function replaceCanonical(html, url) {
  const escaped = escapeHtml(url);
  if (/rel="canonical"/i.test(html)) {
    return html.replace(
      /(<link[^>]+rel="canonical"[^>]*href=")[^"]*(")/i,
      `$1${escaped}$2`,
    );
  }
  return html.replace("</head>", `    <link rel="canonical" href="${escaped}" />\n  </head>`);
}

function injectOgUrl(html, url) {
  return replaceMeta(html, 'property="og:url"', url);
}

function stripTag(html, pattern) {
  return html.replace(pattern, "");
}

function injectJsonLd(html, jsonLd) {
  const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  const scripts = blocks
    .filter(Boolean)
    .map((block) => {
      const json = JSON.stringify(block).replace(/</g, "\\u003c");
      return `    <script type="application/ld+json">${json}</script>`;
    })
    .join("\n");
  if (!scripts) return html;
  return html.replace("</head>", `${scripts}\n  </head>`);
}

function makeNotFoundHtml(template) {
  const title = "Page Not Found | AKM Care";
  const description = "The page you requested could not be found. Return to AKM Care home or shop.";
  let html = template;
  html = replaceTag(html, "title", title);
  html = replaceMeta(html, 'name="description"', description);
  html = replaceMeta(html, 'name="robots"', "noindex, nofollow");
  html = replaceMeta(html, 'name="googlebot"', "noindex, nofollow");
  html = replaceMeta(html, 'property="og:title"', title);
  html = replaceMeta(html, 'property="og:description"', description);
  html = replaceMeta(html, 'name="twitter:title"', title);
  html = replaceMeta(html, 'name="twitter:description"', description);
  html = stripTag(html, /<link[^>]+rel=["']canonical["'][^>]*>\s*/gi);
  html = stripTag(html, /<meta[^>]+property=["']og:url["'][^>]*>\s*/gi);
  html = stripTag(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi);
  return html;
}

function fileDirForRoute(route) {
  if (route.filePath) return route.filePath;
  if (!route.path || route.path === "/") return "";
  if (route.path.includes("?")) return null;
  return route.path;
}

function main() {
  const indexPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.error("inject-route-meta: dist/index.html not found — run vite build first");
    process.exit(1);
  }

  if (!fs.existsSync(prerenderPath)) {
    console.error("inject-route-meta: .cache/prerender-routes.json not found — run generate-sitemap first");
    process.exit(1);
  }

  const parsed = JSON.parse(fs.readFileSync(prerenderPath, "utf8"));
  const routes = parsed.routes || [];
  if (!Array.isArray(routes) || routes.length === 0) {
    console.error("inject-route-meta: prerender manifest is empty");
    process.exit(1);
  }

  const template = fs.readFileSync(indexPath, "utf8");
  let written = 0;
  for (const route of routes) {
    const dir = fileDirForRoute(route);
    if (dir == null) continue;

    const title = fullTitle(route.title);
    const description = route.description || "";
    const canonical = `${SITE_ORIGIN}${route.path.startsWith("/") ? route.path : `/${route.path}`}`;
    const image = route.ogImage || `${SITE_ORIGIN}/og-image.jpg`;
    const ogType = route.ogType || "website";

    let html = template;
    html = replaceTag(html, "title", title);
    html = replaceMeta(html, 'name="description"', description);
    html = replaceCanonical(html, canonical);
    html = replaceMeta(html, 'property="og:title"', title);
    html = replaceMeta(html, 'property="og:description"', description);
    html = replaceMeta(html, 'property="og:type"', ogType);
    html = injectOgUrl(html, canonical);
    html = replaceMeta(html, 'property="og:image"', image);
    html = replaceMeta(html, 'name="twitter:title"', title);
    html = replaceMeta(html, 'name="twitter:description"', description);
    html = replaceMeta(html, 'name="twitter:image"', image);

    if (route.jsonLd) html = injectJsonLd(html, route.jsonLd);

    const outDir = path.join(distDir, dir.replace(/^\//, ""));
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
    written += 1;
  }

  if (written === 0) {
    console.error("inject-route-meta: wrote 0 HTML shells");
    process.exit(1);
  }

  fs.writeFileSync(path.join(distDir, "404.html"), makeNotFoundHtml(template), "utf8");

  console.log(
    `inject-route-meta: wrote ${written} HTML shells + 404.html for ${BRAND_NAME} (${routes.length} routes in manifest)`,
  );
}

main();
