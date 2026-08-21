import { describe, expect, it } from "vitest";
import {
  isKnownAppPath,
  isPublicProductSlug,
  parseProductSlug,
} from "../../../scripts/http-status.mjs";
import { isPublicSitemapSlug, toSitemapImageUrl } from "../../../scripts/seo-config.mjs";

describe("http status path classification", () => {
  it("treats public and SPA routes as known app paths", () => {
    expect(isKnownAppPath("/")).toBe(true);
    expect(isKnownAppPath("/shop")).toBe(true);
    expect(isKnownAppPath("/cart")).toBe(true);
    expect(isKnownAppPath("/checkout")).toBe(true);
    expect(isKnownAppPath("/admin")).toBe(true);
    expect(isKnownAppPath("/admin/login")).toBe(true);
    expect(isKnownAppPath("/shop/product/akmc-turquoise-zari")).toBe(true);
    expect(isKnownAppPath("/random-invalid-url")).toBe(false);
  });

  it("parses product slugs and rejects extra segments and junk", () => {
    expect(parseProductSlug("/shop/product/akmc-turquoise-zari")).toBe("akmc-turquoise-zari");
    expect(parseProductSlug("/shop/product/foo/bar")).toBeNull();
    expect(isPublicProductSlug("akmc-turquoise-zari")).toBe(true);
    expect(isPublicProductSlug("../etc/passwd")).toBe(false);
    expect(isPublicProductSlug("")).toBe(false);
  });
});

describe("sitemap URL helpers", () => {
  it("accepts catalog slugs and skips invalid image URLs", () => {
    expect(isPublicSitemapSlug("akmc-turquoise-zari")).toBe(true);
    expect(isPublicSitemapSlug("bad/slug")).toBe(false);
    expect(toSitemapImageUrl("/catalog/saree.png", "https://www.akmcare.in")).toBe(
      "https://www.akmcare.in/catalog/saree.png",
    );
    expect(toSitemapImageUrl("/placeholder.svg", "https://www.akmcare.in")).toBeNull();
    expect(toSitemapImageUrl("data:image/png;base64,xx", "https://www.akmcare.in")).toBeNull();
    expect(toSitemapImageUrl("not-a-url", "https://www.akmcare.in")).toBeNull();
  });
});
