import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should display the LeagueScout title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("LeagueScout");
  });

  test("should have navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
    // Use nav-specific selectors to avoid matching footer/mobile links
    const nav = page.locator("nav").first();
    await expect(nav.getByRole("link", { name: /Players/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Prospects/i })).toBeVisible();
  });

  test("should navigate to players page", async ({ page }) => {
    await page.goto("/");
    await page.locator("nav").first().getByRole("link", { name: "Players" }).click();
    await expect(page).toHaveURL(/.*players/);
    await expect(page.locator("h1")).toContainText("Players");
  });
});

test.describe("Players Page", () => {
  test("should display player grid", async ({ page }) => {
    await page.goto("/players");
    await expect(page.locator("h1")).toContainText("Players");
  });

  test("should filter by role", async ({ page }) => {
    await page.goto("/players?role=MID");
    await expect(page).toHaveURL(/.*role=MID/);
    // Verify filter is active (badge selected or filtered results shown)
    await expect(page.locator("text=Role:").first()).toBeVisible();
  });
});

test.describe("Prospects Page", () => {
  test("should display Top 30 Prospects", async ({ page }) => {
    await page.goto("/prospects");
    await expect(page.getByRole("heading", { name: "Top 30 Prospects" })).toBeVisible();
  });
});
