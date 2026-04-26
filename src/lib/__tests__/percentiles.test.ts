import { describe, it, expect } from "vitest";
import {
  detectLeagueFromDataset,
  isStatAvailableForLeague,
  calculatePercentile,
  getTierFromPercentile,
  getCentileColor,
  getCentileClass,
  categorizePlayerPercentiles,
  LEAGUE_MISSING_STATS,
} from "@/lib/percentiles";

describe("percentiles", () => {
  describe("detectLeagueFromDataset", () => {
    it("detects LPL from filename", () => {
      expect(detectLeagueFromDataset("LPL_2024_Spring.csv")).toBe("LPL");
      expect(detectLeagueFromDataset("lpl_stats")).toBe("LPL");
    });

    it("detects LEC from filename", () => {
      expect(detectLeagueFromDataset("LEC_2024_Summer.csv")).toBe("LEC");
    });

    it("returns UNKNOWN for unrecognized names", () => {
      expect(detectLeagueFromDataset("random_file.csv")).toBe("UNKNOWN");
    });
  });

  describe("isStatAvailableForLeague", () => {
    it("allows all stats for unknown leagues", () => {
      expect(isStatAvailableForLeague("FB%", "UNKNOWN")).toBe(true);
    });

    it("blocks LPL missing stats", () => {
      expect(isStatAvailableForLeague("FB%", "LPL")).toBe(false);
      expect(isStatAvailableForLeague("GD10", "LPL")).toBe(false);
    });

    it("allows available LPL stats", () => {
      expect(isStatAvailableForLeague("KDA", "LPL")).toBe(true);
      expect(isStatAvailableForLeague("KP", "LPL")).toBe(true);
    });

    it("allows all stats for LEC", () => {
      expect(isStatAvailableForLeague("FB%", "LEC")).toBe(true);
    });
  });

  describe("calculatePercentile", () => {
    const allPlayers = [
      { id: "1", pseudo: "A", role: "TOP", KDA: 5.0 },
      { id: "2", pseudo: "B", role: "TOP", KDA: 4.0 },
      { id: "3", pseudo: "C", role: "TOP", KDA: 3.0 },
      { id: "4", pseudo: "D", role: "TOP", KDA: 2.0 },
      { id: "5", pseudo: "E", role: "TOP", KDA: 1.0 },
    ];

    it("calculates percentile for top performer", () => {
      const result = calculatePercentile(5.0, "KDA", "TOP", allPlayers);
      expect(result).not.toBeNull();
      expect(result!.percentile).toBeGreaterThanOrEqual(90);
      expect(result!.rank).toBe(1);
    });

    it("calculates percentile for bottom performer", () => {
      const result = calculatePercentile(1.0, "KDA", "TOP", allPlayers);
      expect(result).not.toBeNull();
      expect(result!.percentile).toBeLessThanOrEqual(15);
      expect(result!.rank).toBe(5);
    });

    it("calculates percentile for middle performer", () => {
      const result = calculatePercentile(3.0, "KDA", "TOP", allPlayers);
      expect(result).not.toBeNull();
      expect(result!.percentile).toBeGreaterThanOrEqual(40);
      expect(result!.percentile).toBeLessThanOrEqual(70);
    });

    it("filters by role", () => {
      const mixedPlayers = [
        ...allPlayers,
        { id: "6", pseudo: "F", role: "JUNGLE", KDA: 10.0 },
      ];
      const result = calculatePercentile(5.0, "KDA", "TOP", mixedPlayers);
      // Should still be top among TOP players
      expect(result!.rank).toBe(1);
    });

    it("returns null for LPL missing stats", () => {
      const result = calculatePercentile(5.0, "FB%", "TOP", allPlayers, "LPL_2024.csv");
      expect(result).toBeNull();
    });

    it("handles inverted metrics correctly", () => {
      const deathPlayers = [
        { id: "1", pseudo: "A", role: "TOP", "DTH%": 10 },
        { id: "2", pseudo: "B", role: "TOP", "DTH%": 20 },
        { id: "3", pseudo: "C", role: "TOP", "DTH%": 30 },
      ];
      // Lower deaths = better = higher percentile
      const result = calculatePercentile(10, "DTH%", "TOP", deathPlayers);
      expect(result).not.toBeNull();
      expect(result!.percentile).toBeGreaterThanOrEqual(50);
    });

    it("handles string values with %", () => {
      const pctPlayers = [
        { id: "1", pseudo: "A", role: "TOP", KP: "75%" },
        { id: "2", pseudo: "B", role: "TOP", KP: "50%" },
        { id: "3", pseudo: "C", role: "TOP", KP: "25%" },
      ];
      const result = calculatePercentile("75%", "KP", "TOP", pctPlayers);
      expect(result).not.toBeNull();
      expect(result!.percentile).toBeGreaterThanOrEqual(50);
    });
  });

  describe("getTierFromPercentile", () => {
    it("returns S tier for elite percentiles", () => {
      expect(getTierFromPercentile(90).tier).toBe("S");
      expect(getTierFromPercentile(85).tier).toBe("S");
    });

    it("returns A tier for excellent percentiles", () => {
      expect(getTierFromPercentile(75).tier).toBe("A");
      expect(getTierFromPercentile(70).tier).toBe("A");
    });

    it("returns B tier for good percentiles", () => {
      expect(getTierFromPercentile(65).tier).toBe("B");
      expect(getTierFromPercentile(60).tier).toBe("B");
    });

    it("returns C tier for average percentiles", () => {
      expect(getTierFromPercentile(55).tier).toBe("C");
      expect(getTierFromPercentile(50).tier).toBe("C");
    });

    it("returns D tier for weak percentiles", () => {
      expect(getTierFromPercentile(40).tier).toBe("D");
      expect(getTierFromPercentile(0).tier).toBe("D");
    });
  });

  describe("getCentileColor", () => {
    it("returns correct colors", () => {
      expect(getCentileColor(90)).toBe("#00D9C0"); // S
      expect(getCentileColor(75)).toBe("#00E676"); // A
      expect(getCentileColor(65)).toBe("#FFD93D"); // B
      expect(getCentileColor(55)).toBe("#FF9F43"); // C
      expect(getCentileColor(40)).toBe("#FF6B6B"); // D
      expect(getCentileColor(null)).toBe("#888888");
    });
  });

  describe("getCentileClass", () => {
    it("returns Tailwind classes", () => {
      expect(getCentileClass(90)).toContain("text-[#00D9C0]");
      expect(getCentileClass(40)).toContain("text-[#FF6B6B]");
      expect(getCentileClass(null)).toContain("text-gray-400");
    });
  });

  describe("categorizePlayerPercentiles", () => {
    it("groups percentiles by category", () => {
      const percentiles = {
        KDA: { percentile: 80, rank: 2, total: 10, tier: "A" as const, color: "#00E676" },
        WPM: { percentile: 60, rank: 5, total: 10, tier: "B" as const, color: "#FFD93D" },
        CSPM: { percentile: 70, rank: 4, total: 10, tier: "A" as const, color: "#00E676" },
        "GD@15": { percentile: 55, rank: 5, total: 10, tier: "C" as const, color: "#FF9F43" },
      };

      const categorized = categorizePlayerPercentiles(percentiles);

      expect(categorized.fight.length).toBeGreaterThan(0);
      expect(categorized.vision.length).toBeGreaterThan(0);
      expect(categorized.resources.length).toBeGreaterThan(0);
      expect(categorized.early.length).toBeGreaterThan(0);
    });
  });
});
