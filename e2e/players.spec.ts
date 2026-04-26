import { test, expect } from "@playwright/test";

test.describe("Players Page — Search & Filters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/players");
  });

  test("displays player count", async ({ page }) => {
    await expect(page.locator("text=/\\d+ player(s)? found/")).toBeVisible();
  });

  test("filters by role", async ({ page }) => {
    // Find role filter section and click TOP
    const roleSection = page.locator("span").filter({ hasText: "Role:" }).first().locator("xpath=..");
    await roleSection.locator("text=TOP").click();
    await expect(page).toHaveURL(/.*role=TOP/);
  });

  test("filters by league", async ({ page }) => {
    const leagueSection = page.locator("span").filter({ hasText: "League:" }).first().locator("xpath=..");
    await leagueSection.getByRole("link", { name: "LFL", exact: true }).click();
    await expect(page).toHaveURL(/.*league=LFL/);
  });

  test("filters by status", async ({ page }) => {
    const statusSection = page.locator("span").filter({ hasText: "Status:" }).first().locator("xpath=..");
    await statusSection.locator("text=Free Agent").click();
    await expect(page).toHaveURL(/.*status=FREE_AGENT/);
  });

  test("search by name", async ({ page }) => {
    // Target the visible search input (not hidden export form inputs)
    const searchInput = page.getByRole("searchbox", { name: /Search by name/ });
    await searchInput.fill("Zeka");
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/.*q=Zeka/);
  });

  test("sort by rank changes order", async ({ page }) => {
    const sortSection = page.locator("span").filter({ hasText: "Sort by:" }).first().locator("xpath=..");
    await sortSection.locator("text=Rank (LP)").click();
    await expect(page).toHaveURL(/.*sort=rank/);
  });

  test("combines filters", async ({ page }) => {
    const roleSection = page.locator("span").filter({ hasText: "Role:" }).first().locator("xpath=..");
    await roleSection.locator("text=TOP").click();
    await page.waitForURL(/.*role=TOP/);

    const leagueSection = page.locator("span").filter({ hasText: "League:" }).first().locator("xpath=..");
    await leagueSection.getByRole("link", { name: "LFL", exact: true }).click();
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
    await page.goto("/players");
    const firstCard = page.locator("a[href^='/players/']").first();
    await firstCard.click();

    // Wait for navigation to complete
    await page.waitForURL(/\/players\/[a-zA-Z0-9_-]+/);
    // Page should have visible content
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("has compare checkbox on card", async ({ page }) => {
    await page.goto("/players");
    const checkbox = page.locator("text=Compare").first();
    await expect(checkbox).toBeVisible();
  });
});
