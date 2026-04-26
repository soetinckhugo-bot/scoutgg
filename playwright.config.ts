import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "ci-test-secret-min-32-characters-long",
      NEXTAUTH_URL: "http://localhost:3000",
      DATABASE_URL: "file:./dev.db",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "sk_test_ci",
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_ci",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "whsec_ci",
      RESEND_API_KEY: process.env.RESEND_API_KEY || "re_ci",
    },
  },
});
