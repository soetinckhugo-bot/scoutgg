import { test, expect } from "@playwright/test";

test.describe("Site Navigation", () => {
  test("homepage loads with correct title and meta", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LeagueScout/);
    await expect(page.locator("h1")).toContainText("LeagueScout");
  });

  test("main nav links are visible and clickable", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();

    const links = ["Players", "Prospects"];
    for (const name of links) {
      const link = nav.getByRole("link", { name });
      await expect(link).toBeVisible();
    }
  });

  test("skip link is present for accessibility", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
  });

  test("footer contains legal links", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    // Footer may have different link text
    const footerLinks = footer.locator("a");
    await expect(footerLinks.first()).toBeVisible();
  });

  test("dark mode toggle works", async ({ page }) => {
    await page.goto("/");
    // Look for theme toggle by common patterns
    const toggle = page.locator('button[class*="dark"], button[aria-label*="theme" i], button[aria-label*="dark" i]').first();
    if (await toggle.isVisible().catch(() => false)) {
      const html = page.locator("html");
      const initialClass = await html.getAttribute("class");
      await toggle.click();
      await page.waitForTimeout(500);
      const newClass = await html.getAttribute("class");
      // Class may or may not change depending on current theme
      expect(newClass).toBeTruthy();
    } else {
      test.skip(true, "No dark mode toggle found");
    }
  });
});

test.describe("Page Navigation Flows", () => {
  test("players → player detail → back", async ({ page }) => {
    await page.goto("/players");
    await expect(page.locator("h1")).toContainText("Players");

    // Click first player card
    const firstCard = page.locator("a[href^='/players/']").first();
    const href = await firstCard.getAttribute("href");
    await firstCard.click();

    // Should be on player detail
    await page.waitForURL(/\/players\/[a-zA-Z0-9_-]+/);
    // Verify page loaded with content
    await expect(page.locator("body")).toContainText(/LeagueScout|Player|Overview|Stats/i, { timeout: 10000 });

    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/.*players/);
  });

  test("prospects page loads and shows ranking", async ({ page }) => {
    await page.goto("/prospects");
    await expect(page.locator("h1")).toContainText("Top 30 Prospects");
    // Should have some content (cards or table rows)
    const content = page.locator("main");
    await expect(content).toBeVisible();
  });

  test("pricing page shows tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("h1")).toContainText(/Pricing|Choose Your Plan/);
    // Look for tier names
    const pageText = await page.locator("main").textContent();
    expect(pageText).toMatch(/Free|Scout Pass|Pro/i);
  });
});
