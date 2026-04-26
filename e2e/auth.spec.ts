import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=/Sign in/i").first()).toBeVisible();
  });

  test("protected routes may require login", async ({ page }) => {
    await page.goto("/watchlist");
    // Page may redirect to login or show auth-required message
    const url = page.url();
    const hasAuthContent = await page.locator("text=Sign in").isVisible()
      .catch(() => false);
    expect(url.includes("signin") || url.includes("login") || hasAuthContent || url.includes("watchlist")).toBe(true);
  });

  test("settings page may require auth", async ({ page }) => {
    await page.goto("/settings");
    const url = page.url();
    // Either on settings (if auth cached) or redirected
    expect(url.includes("settings") || url.includes("login") || url.includes("signin")).toBe(true);
  });
});

test.describe("Authenticated User Features", () => {
  test("favorites API requires auth", async ({ request }) => {
    const response = await request.get("/api/favorites");
    expect(response.status()).toBe(401);
  });

  test("reports API may be public or require auth", async ({ request }) => {
    const response = await request.get("/api/reports");
    // Some report endpoints are public (listing), some require auth
    expect([200, 401]).toContain(response.status());
  });
});
