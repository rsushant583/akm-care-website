import { existsSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const distDir = path.resolve(process.cwd(), "dist");
const hasDist = existsSync(path.join(distDir, "index.html"));
const hasCategoryShell = existsSync(path.join(distDir, "seo-category", "sarees", "index.html"));

describe.skipIf(!hasDist)("generated dist SEO artifacts", () => {
  function read(rel: string) {
    return readFileSync(path.join(distDir, rel), "utf8");
  }

  it("publishes crawl files as files, not HTML shells", () => {
    for (const file of ["robots.txt", "sitemap.xml", "llms.txt", "404.html", "og-image.jpg"]) {
      expect(existsSync(path.join(distDir, file)), file).toBe(true);
    }
    const robots = read("robots.txt");
    const llms = read("llms.txt");
    const sitemap = read("sitemap.xml");
    expect(robots.startsWith("<!")).toBe(false);
    expect(llms.startsWith("<!")).toBe(false);
    expect(sitemap).toContain("<urlset");
    expect(robots).toContain("Sitemap: https://www.akmcare.in/sitemap.xml");
    expect(llms).toContain("https://www.akmcare.in");
    const og = readFileSync(path.join(distDir, "og-image.jpg"));
    expect(og[0]).toBe(0xff);
    expect(og[1]).toBe(0xd8);
  });

  it.skipIf(!hasCategoryShell)("prerenders unique metadata for key public routes", () => {
    const shop = read("shop/index.html");
    const faq = read("faq/index.html");
    const shipping = read("shipping-returns/index.html");
    const sarees = read("seo-category/sarees/index.html");
    expect(shop).toContain('rel="canonical"');
    expect(shop).toContain("CollectionPage");
    expect(faq).toContain("/faq");
    expect(faq).toContain("FAQPage");
    expect(shipping).toContain("/shipping-returns");
    expect(sarees).toContain("/shop?category=sarees");
    expect(sarees).toContain("CollectionPage");
    expect(sarees).toContain("BreadcrumbList");
    const notFound = read("404.html");
    expect(notFound).toMatch(/noindex/);
    expect(notFound).not.toMatch(/rel=["']canonical["']/i);
  });
});
