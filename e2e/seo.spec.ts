import { test, expect } from "@playwright/test";

const PAGES = [
  { path: "/", title: /LeagueScout/ },
  { path: "/players", title: /Players|LeagueScout/ },
  { path: "/prospects", title: /Prospects|LeagueScout/ },
  { path: "/pricing", title: /Pricing|Choose Your Plan|LeagueScout/ },
  { path: "/about", title: /About|LeagueScout/ },
  { path: "/contact", title: /Contact|LeagueScout/ },
];

test.describe("SEO & Meta Tags", () => {
  for (const { path, title } of PAGES) {
    test(`${path} has correct title`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
    });
  }

  test("homepage has meta description", async ({ page }) => {
    await page.goto("/");
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute("content", /./);
  });

  test("sitemap.xml is accessible", async ({ page }) => {
    const response = await page.request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("<urlset");
  });

  test("robots.txt is accessible", async ({ page }) => {
    const response = await page.request.get("/robots.txt");
    expect(response.status()).toBe(200);
  });

  test("Open Graph tags present on homepage", async ({ page }) => {
    await page.goto("/");
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /./);
  });

  test("canonical link is present", async ({ page }) => {
    await page.goto("/players");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /./);
  });
});

test.describe("Structured Data", () => {
  test("homepage has JSON-LD", async ({ page }) => {
    await page.goto("/");
    const scripts = page.locator('script[type="application/ld+json"]');
    await expect(scripts.first()).toBeAttached();
    const count = await scripts.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Check at least one contains Organization or WebSite
    let hasStructuredData = false;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      if (content?.includes("Organization") || content?.includes("WebSite")) {
        hasStructuredData = true;
        break;
      }
    }
    expect(hasStructuredData).toBe(true);
  });
});
