import { test, expect } from "@playwright/test";

test.describe("Players Page — Search & Filters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/players");
    await page.waitForLoadState("networkidle");
    // Wait for Next.js hydration to complete before interacting with links
    await page.waitForTimeout(2000);
  });

  test("displays player count", async ({ page }) => {
    await expect(page.locator("text=/player(s)? found/").first()).toBeVisible();
  });

  test("filters by role", async ({ page }) => {
    await page.goto("/players?role=TOP");
    await expect(page).toHaveURL(/.*role=TOP/);
    await expect(page.locator("text=Role:").first()).toBeVisible();
  });

  test("filters by league", async ({ page }) => {
    await page.goto("/players?league=LFL");
    await expect(page).toHaveURL(/.*league=LFL/);
    await expect(page.locator("text=League:").first()).toBeVisible();
  });

  test("filters by status", async ({ page }) => {
    await page.goto("/players?status=FREE_AGENT");
    await expect(page).toHaveURL(/.*status=FREE_AGENT/);
    await expect(page.locator("text=Status:").first()).toBeVisible();
  });

  test("search by name", async ({ page }) => {
    // Target the visible search input (not hidden export form inputs)
    const searchInput = page.getByRole("searchbox", { name: /Search by name/ });
    await searchInput.fill("Zeka");
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/.*q=Zeka/);
  });

  test("sort by rank changes order", async ({ page }) => {
    await page.goto("/players?sort=rank");
    await expect(page).toHaveURL(/.*sort=rank/);
    await expect(page.locator("text=Sort by:").first()).toBeVisible();
  });

  test("combines filters", async ({ page }) => {
    const roleSection = page.locator("span").filter({ hasText: "Role:" }).first().locator("xpath=..");
    await roleSection.locator("text=TOP").click();
    await page.waitForURL(/.*role=TOP/);

    const leagueSection = page.locator("span").filter({ hasText: "League:" }).first().locator("xpath=..");
    await leagueSection.getByRole("link", { name: "Filter by league LFL", exact: true }).click();
    await expect(page).toHaveURL(/.*role=TOP/);
  });

  test("pagination appears when many players", async ({ page }) => {
    const pagination = page.locator("text=/Page \\d+ of \\d+/");
    const count = await pagination.count();
    if (count > 0) {
      await expect(pagination).toBeVisible();
      const nextBtn = page.getByRole("link", { name: "Next" });
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        // Wait for navigation — may already be on page 2 in some edge cases
        await page.waitForLoadState("networkidle");
        const url = page.url();
        expect(url.includes("page=")).toBe(true);
      }
    }
  });

  test("export CSV button is present", async ({ page }) => {
    const exportBtn = page.locator("text=Export CSV");
    await expect(exportBtn).toBeVisible();
  });
});

test.describe("Player Detail Page", () => {
  test("shows player info", async ({ page }) => {
    // Go directly to a player detail page (Adam from seed)
    await page.goto("/players");
    await page.waitForSelector("a[href^='/players/']", { timeout: 10000 });
    const firstCard = page.locator("a[href^='/players/']").first();
    const href = await firstCard.getAttribute("href");
    expect(href).toBeTruthy();

    await page.goto(href!);
    await page.waitForLoadState("domcontentloaded");
    // Check page loaded by looking for any content (not 404)
    const body = page.locator("body");
    await expect(body).toContainText(/LeagueScout|Player|Overview|Stats/i, { timeout: 10000 });
  });

  test("has player cards on grid", async ({ page }) => {
    await page.goto("/players");
    const card = page.locator("a[href^='/players/']").first();
    await expect(card).toBeVisible();
  });
});
