import { test, expect } from "@playwright/test";

interface WebVitals {
  lcp: number;
  cls: number;
  tbt: number;
}

async function measureWebVitals(page: any): Promise<WebVitals> {
  await page.waitForLoadState("networkidle");

  const metrics = await page.evaluate(() => {
    return new Promise<WebVitals>((resolve) => {
      let lcp = 0;
      let cls = 0;
      let tbt = 0;

      // LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        lcp = entries[entries.length - 1].startTime;
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

      // CLS
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });

      // TBT (simplified: measure blocking time from long tasks)
      const tbtObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = entry.duration;
          if (duration > 50) {
            tbt += duration - 50;
          }
        }
      });
      tbtObserver.observe({ entryTypes: ["longtask"] });

      // Collect after 3 seconds
      setTimeout(() => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
        tbtObserver.disconnect();
        resolve({ lcp, cls, tbt });
      }, 3000);
    });
  });

  return metrics;
}

function gradeLCP(lcp: number): string {
  if (lcp <= 2500) return "GOOD";
  if (lcp <= 4000) return "NEEDS_IMPROVEMENT";
  return "POOR";
}

function gradeCLS(cls: number): string {
  if (cls <= 0.1) return "GOOD";
  if (cls <= 0.25) return "NEEDS_IMPROVEMENT";
  return "POOR";
}

function gradeTBT(tbt: number): string {
  if (tbt <= 200) return "GOOD";
  if (tbt <= 600) return "NEEDS_IMPROVEMENT";
  return "POOR";
}

test.describe("Performance Audit", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14 viewport

  const pages = [
    { path: "/", name: "Homepage" },
    { path: "/players", name: "Players" },
    { path: "/players", name: "Players with filter", query: "?role=MID" },
    { path: "/prospects", name: "Prospects" },
    { path: "/pricing", name: "Pricing" },
  ];

  for (const { path, name, query } of pages) {
    test(`${name} - mobile performance`, async ({ page }) => {
      const url = query ? `${path}${query}` : path;
      await page.goto(url);
      const metrics = await measureWebVitals(page);

      console.log(`\n[${name}] Mobile Performance:`);
      console.log(`  LCP: ${metrics.lcp.toFixed(0)}ms (${gradeLCP(metrics.lcp)})`);
      console.log(`  CLS: ${metrics.cls.toFixed(3)} (${gradeCLS(metrics.cls)})`);
      console.log(`  TBT: ${metrics.tbt.toFixed(0)}ms (${gradeTBT(metrics.tbt)})`);

      // Assert minimum thresholds
      expect(metrics.lcp).toBeLessThan(5000); // < 5s
      expect(metrics.cls).toBeLessThan(0.25); // < 0.25
    });
  }
});
