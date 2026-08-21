/** One-off production SEO fetch. Run: node scripts/prod-seo-audit.mjs */

const ORIGIN = "https://www.akmcare.in";

function pick(html, re) {
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

function extract(html) {
  const jsonld = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      jsonld.push(JSON.parse(m[1]));
    } catch {
      jsonld.push({ parseError: true });
    }
  }
  return {
    title: pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    canonical:
      pick(html, /rel=["']canonical["'][^>]*href=["']([^"']+)/i) ||
      pick(html, /href=["']([^"']+)["'][^>]*rel=["']canonical["']/i),
    robots:
      pick(html, /name=["']robots["'][^>]*content=["']([^"']+)/i) ||
      pick(html, /content=["']([^"']+)["'][^>]*name=["']robots["']/i),
    description:
      pick(html, /name=["']description["'][^>]*content=["']([^"']+)/i) ||
      pick(html, /content=["']([^"']+)["'][^>]*name=["']description["']/i),
    ogUrl: pick(html, /property=["']og:url["'][^>]*content=["']([^"']+)/i),
    ogImage: pick(html, /property=["']og:image["'][^>]*content=["']([^"']+)/i),
    jsonldTypes: jsonld.flatMap((j) => {
      const nodes = Array.isArray(j) ? j : j?.["@graph"] ? j["@graph"] : [j];
      return nodes.map((n) => n?.["@type"]).filter(Boolean);
    }),
    jsonld,
    bytes: html.length,
  };
}

async function headAndGet(url) {
  const res = await fetch(url, { redirect: "manual" });
  const ct = res.headers.get("content-type") || "";
  const loc = res.headers.get("location") || "";
  const xrobots = res.headers.get("x-robots-tag") || "";
  const body = await res.text();
  const isHtml = ct.includes("html");
  return {
    url,
    status: res.status,
    contentType: ct.split(";")[0],
    location: loc,
    xRobots: xrobots,
    ...(isHtml ? extract(body) : { bytes: body.length, sample: body.slice(0, 200) }),
    raw: isHtml ? undefined : body,
  };
}

const pages = [
  "/",
  "/shop",
  "/shop?category=sarees",
  "/shop?category=not-a-real-category",
  "/faq",
  "/shipping-returns",
  "/privacy",
  "/terms",
  "/cart",
  "/checkout",
  "/account",
  "/admin",
  "/shop/product/nonexistent-product",
  "/random-invalid-url",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/og-image.jpg",
  "/logo.jpeg",
];

const sitemapRes = await fetch(`${ORIGIN}/sitemap.xml`);
const sitemapXml = await sitemapRes.text();
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const pageResults = [];
for (const path of pages) {
  pageResults.push(await headAndGet(path.startsWith("http") ? path : `${ORIGIN}${path}`));
}

const sitemapChecks = [];
const seen = new Set();
for (const loc of sitemapUrls) {
  const dup = seen.has(loc);
  seen.add(loc);
  const r = await fetch(loc, { redirect: "manual" });
  const html = r.headers.get("content-type")?.includes("html") ? await r.text() : "";
  const meta = html ? extract(html) : {};
  const robots = String(meta.robots || r.headers.get("x-robots-tag") || "");
  sitemapChecks.push({
    loc,
    status: r.status,
    location: r.headers.get("location") || "",
    duplicate: dup,
    canonical: meta.canonical || "",
    robots,
    noindex: /noindex/i.test(robots),
    canonicalMismatch: Boolean(meta.canonical) && meta.canonical.replace(/\/$/, "") !== loc.replace(/\/$/, ""),
  });
}

const apex = await fetch("https://akmcare.in/", { redirect: "manual" });

const summary = {
  apex: { status: apex.status, location: apex.headers.get("location") },
  pages: pageResults.map(({ jsonld, raw, ...rest }) => rest),
  sitemap: {
    status: sitemapRes.status,
    total: sitemapUrls.length,
    urls: sitemapUrls,
    valid: sitemapChecks.filter((s) => s.status === 200 && !s.noindex && !s.location && !s.canonicalMismatch).length,
    invalid: sitemapChecks.filter((s) => s.status >= 400).length,
    redirecting: sitemapChecks.filter((s) => s.status >= 300 && s.status < 400).length,
    noindex: sitemapChecks.filter((s) => s.noindex).length,
    canonicalMismatch: sitemapChecks.filter((s) => s.canonicalMismatch).length,
    duplicates: sitemapChecks.filter((s) => s.duplicate).length,
    details: sitemapChecks,
  },
  robots: pageResults.find((p) => p.url.endsWith("/robots.txt")),
};

console.log(JSON.stringify(summary, null, 2));
