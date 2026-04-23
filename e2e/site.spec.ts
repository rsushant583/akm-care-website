import { expect, test, type Page } from "@playwright/test";

const routes = [
  "/",
  "/about",
  "/training",
  "/services",
  "/shop",
  "/personal-booking",
  "/media",
  "/motivation",
  "/csr",
  "/careers",
  "/contact",
  "/faq",
  "/disclaimer",
] as const;

async function expectRouteStageVisible(page: Page) {
  const root = page.locator("[data-route-transition-root]");
  await expect(root).toBeVisible();
  await expect
    .poll(
      async () => root.evaluate((el) => parseFloat(getComputedStyle(el).opacity)),
      { timeout: 12_000 },
    )
    .toBeGreaterThan(0.9);
}

async function expectHeadingVisible(page: Page, name: RegExp) {
  const h = page.getByRole("heading", { name });
  await expect(h).toHaveCount(1, { timeout: 20_000 });
  const target = h.first();
  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeVisible({ timeout: 20_000 });
  await expect
    .poll(
      async () => {
        const o = await target.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
        return o;
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0.25);
}

for (const path of routes) {
  test(`loads ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();
  });
}

test("home: services, store, and YouTube sections reveal after scroll", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expectRouteStageVisible(page);
  await expectHeadingVisible(page, /Everything Your Business Needs/i);
  await expectHeadingVisible(page, /From the Heart of India's Villages/i);
  await expectHeadingVisible(page, /Stories & Sessions/i);
  await expectHeadingVisible(page, /Guided by Timeless Wisdom/i);
});

test("mobile: bottom navigation and home sections", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const nav = page.getByRole("navigation", { name: /primary mobile/i });
  await expect(nav).toBeVisible();

  await nav.getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.getByRole("heading").first()).toBeVisible();

  await nav.getByRole("link", { name: "Shop" }).click();
  await expect(page).toHaveURL(/\/shop$/);

  await nav.getByRole("link", { name: "Media" }).click();
  await expect(page).toHaveURL(/\/media$/);

  await nav.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/\/contact$/);

  await nav.getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/$/);
  // Ensure the home bundle is fully active before asserting on below-the-fold sections (mobile + route transitions).
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("main")).toBeVisible();
  await expectRouteStageVisible(page);

  const hero = page.locator("section").filter({ has: page.getByRole("heading").first() }).first();
  await expect(hero).toBeVisible();

  await expectHeadingVisible(page, /Everything Your Business Needs/i);
  await expectHeadingVisible(page, /From the Heart of India's Villages/i);
  await expectHeadingVisible(page, /Stories & Sessions/i);
});
