import { describe, expect, it } from "vitest";
import { parseShopSearchParams } from "./shopUrlState";

describe("parseShopSearchParams", () => {
  it("treats search as a query alias so /shop?search= is noindexable", () => {
    const state = parseShopSearchParams(new URLSearchParams("search=zari"));
    expect(state.filters.query).toBe("zari");
  });

  it("prefers q over search", () => {
    const state = parseShopSearchParams(new URLSearchParams("q=silk&search=ignored"));
    expect(state.filters.query).toBe("silk");
  });
});
