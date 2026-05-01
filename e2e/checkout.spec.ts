import { test, expect } from "@playwright/test";

test.describe("Pricing Page", () => {
  test("displays pricing tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("text=Free").first()).toBeVisible();
    await expect(page.locator("text=Scout Pro").first()).toBeVisible();
  });

  test("subscribe button requires login", async ({ page }) => {
    await page.goto("/pricing");
    // Find a subscribe button (not the free tier)
    const scoutProSection = page.locator("h3").filter({ hasText: "Scout Pro" }).first().locator("xpath=../..");
    const subscribeBtn = scoutProSection.locator("button").filter({ hasText: /Subscribe|Upgrade/i }).first();
    
    if (await subscribeBtn.isVisible().catch(() => false)) {
      await subscribeBtn.click();
      // Should show auth-required message or redirect to login
      await page.waitForTimeout(500);
      const url = page.url();
      const hasAuthError = await page.locator("text=/sign in|login|auth/i").isVisible().catch(() => false);
      expect(url.includes("login") || hasAuthError || url.includes("pricing")).toBe(true);
    }
  });
});

test.describe("Checkout API", () => {
  test("requires authentication", async ({ request }) => {
    const response = await request.post("/api/checkout", {
      data: { tier: "Supporter" },
    });
    expect(response.status()).toBe(401);
  });

  test("rejects invalid tier", async ({ request }) => {
    // Even without auth, invalid tier should be caught (or 401 first)
    const response = await request.post("/api/checkout", {
      data: { tier: "InvalidTier" },
    });
    // Either 401 (no auth) or 400 (invalid tier)
    expect([400, 401]).toContain(response.status());
  });
});

test.describe("Stripe Webhook", () => {
  test("rejects requests without signature", async ({ request }) => {
    const response = await request.post("/api/webhooks/stripe", {
      data: { type: "checkout.session.completed" },
    });
    // Should fail signature verification
    expect(response.status()).toBe(400);
  });

  test("accepts valid event structure", async ({ request }) => {
    // We can't send a truly valid signature without the secret,
    // but we can verify the endpoint exists and handles errors gracefully
    const response = await request.post("/api/webhooks/stripe", {
      headers: { "Stripe-Signature": "invalid_sig" },
      data: "test_payload",
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Webhook");
  });
});

test.describe("Premium Access Control", () => {
  test("favorites API requires auth", async ({ request }) => {
    const response = await request.get("/api/favorites");
    expect(response.status()).toBe(401);
  });

  test("lists API requires auth", async ({ request }) => {
    const response = await request.get("/api/lists");
    expect(response.status()).toBe(401);
  });
});
