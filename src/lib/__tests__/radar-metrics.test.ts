import { describe, it, expect } from "vitest";
import {
  getRoleMetrics,
  getAllMetricKeys,
  getMetricDefinition,
  isInvertedMetric,
  findMatchingMetric,
  detectTimeframe,
  filterMetricsByTimeframe,
  getMetricBaseName,
  findMetricPair,
  getMetricsByCategory,
  ROLE_METRICS,
} from "@/lib/radar-metrics";

describe("radar-metrics", () => {
  describe("getRoleMetrics", () => {
    it("returns metrics for TOP role", () => {
      const metrics = getRoleMetrics("TOP");
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.some((m) => m.key === "CSPM")).toBe(true);
      expect(metrics.some((m) => m.key === "KP")).toBe(true);
    });

    it("returns metrics for JUNGLE role", () => {
      const metrics = getRoleMetrics("JUNGLE");
      expect(metrics.some((m) => m.key === "FB%")).toBe(true);
    });

    it("returns empty array for unknown role", () => {
      const metrics = getRoleMetrics("UNKNOWN");
      expect(metrics).toEqual([]);
    });
  });

  describe("getAllMetricKeys", () => {
    it("returns unique metric keys across all roles", () => {
      const keys = getAllMetricKeys();
      expect(keys.length).toBeGreaterThan(0);
      expect(new Set(keys).size).toBe(keys.length); // All unique
    });
  });

  describe("getMetricDefinition", () => {
    it("returns definition for known metric", () => {
      const def = getMetricDefinition("KDA");
      expect(def).toBeDefined();
      expect(def?.fullName).toBe("KDA Ratio");
    });

    it("returns undefined for unknown metric", () => {
      const def = getMetricDefinition("UNKNOWN_METRIC");
      expect(def).toBeUndefined();
    });

    it("is case-insensitive", () => {
      const def1 = getMetricDefinition("kda");
      const def2 = getMetricDefinition("KDA");
      expect(def1?.fullName).toBe(def2?.fullName);
    });
  });

  describe("isInvertedMetric", () => {
    it("returns false for metrics where higher is better", () => {
      expect(isInvertedMetric("KDA")).toBe(false);
      expect(isInvertedMetric("KP")).toBe(false);
      expect(isInvertedMetric("CSPM")).toBe(false);
    });

    it("returns true for metrics where lower is better", () => {
      expect(isInvertedMetric("D")).toBe(true);
      expect(isInvertedMetric("DTH%")).toBe(true);
      expect(isInvertedMetric("CTR%")).toBe(true);
      expect(isInvertedMetric("FB Victim")).toBe(true);
    });

    it("defaults to false for unknown metrics", () => {
      expect(isInvertedMetric("UNKNOWN")).toBe(false);
    });
  });

  describe("findMatchingMetric", () => {
    const available = ["KDA", "KP", "CSD@15", "GD@10", "DMG%", "WPM", "CS%P15"];

    it("finds exact match", () => {
      expect(findMatchingMetric("KDA", available)).toBe("KDA");
    });

    it("finds case-insensitive match", () => {
      expect(findMatchingMetric("kda", available)).toBe("KDA");
    });

    it("finds @ variation (CSD15 ↔ CSD@15)", () => {
      expect(findMatchingMetric("CSD15", available)).toBe("CSD@15");
      expect(findMatchingMetric("GD10", available)).toBe("GD@10");
    });

    it("returns null when no match found", () => {
      expect(findMatchingMetric("UNKNOWN", available)).toBeNull();
    });
  });

  describe("detectTimeframe", () => {
    it("detects @10 metrics", () => {
      expect(detectTimeframe("GD@10")).toBe(10);
      expect(detectTimeframe("CSD10")).toBe(10);
    });

    it("detects @15 metrics", () => {
      expect(detectTimeframe("GD@15")).toBe(15);
      expect(detectTimeframe("CS%P15")).toBe(15);
    });

    it("returns null for general metrics", () => {
      expect(detectTimeframe("KDA")).toBeNull();
      expect(detectTimeframe("KP")).toBeNull();
    });
  });

  describe("filterMetricsByTimeframe", () => {
    const metrics = ["KDA", "GD@10", "CSD@15", "KP", "GD@15"];

    it("returns all for 'all' timeframe", () => {
      expect(filterMetricsByTimeframe(metrics, "all")).toEqual(metrics);
    });

    it("filters for @10 timeframe", () => {
      const result = filterMetricsByTimeframe(metrics, "10");
      expect(result).toContain("KDA");
      expect(result).toContain("GD@10");
      expect(result).not.toContain("CSD@15");
    });

    it("filters for @15 timeframe", () => {
      const result = filterMetricsByTimeframe(metrics, "15");
      expect(result).toContain("KDA");
      expect(result).toContain("CSD@15");
      expect(result).not.toContain("GD@10");
    });
  });

  describe("getMetricBaseName", () => {
    it("strips timeframe suffixes", () => {
      expect(getMetricBaseName("GD@15")).toBe("GD");
      expect(getMetricBaseName("CSD10")).toBe("CSD");
      expect(getMetricBaseName("KDA")).toBe("KDA");
    });
  });

  describe("findMetricPair", () => {
    it("finds counterpart metric", () => {
      const all = ["GD@10", "GD@15", "CSD@10", "CSD@15"];
      expect(findMetricPair("GD@10", all)).toBe("GD@15");
      expect(findMetricPair("CSD@15", all)).toBe("CSD@10");
    });

    it("returns null when no counterpart exists", () => {
      expect(findMetricPair("KDA", ["GD@10", "GD@15"])).toBeNull();
    });
  });

  describe("getMetricsByCategory", () => {
    it("categorizes metrics correctly", () => {
      const metrics = ["KDA", "WPM", "CSPM", "GD@15", "KP"];
      const categories = getMetricsByCategory(metrics);

      expect(categories.fight).toContain("KDA");
      expect(categories.fight).toContain("KP");
      expect(categories.vision).toContain("WPM");
      expect(categories.resources).toContain("CSPM");
      expect(categories.early).toContain("GD@15");
    });
  });
});
