import { describe, it, expect } from "vitest";
import { computeProspectScore } from "../prospect-scoring";

describe("computeProspectScore", () => {
  it("returns a score out of 100", () => {
    const result = computeProspectScore({
      peakLp: 1200,
      bestProResult: "Final LFL 2026 Spring",
      currentLeague: "LFL",
      proWinrate: 0.6,
      age: 19,
      globalScore: 65,
      eyeTestRating: 4,
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.breakdown.peakLpScore).toBeGreaterThan(0);
    expect(result.breakdown.ageScore).toBeGreaterThan(0);
  });

  it("gives higher score for younger players", () => {
    const young = computeProspectScore({
      peakLp: 1000, bestProResult: null, currentLeague: "LFL",
      proWinrate: 0.5, age: 17,
      globalScore: 60, eyeTestRating: 3,
    });

    const old = computeProspectScore({
      peakLp: 1000, bestProResult: null, currentLeague: "LFL",
      proWinrate: 0.5, age: 22,
      globalScore: 60, eyeTestRating: 3,
    });

    expect(young.total).toBeGreaterThan(old.total);
  });

  it("gives higher score for higher peak LP", () => {
    const high = computeProspectScore({
      peakLp: 1500, bestProResult: null, currentLeague: "LFL",
      proWinrate: 0.5, age: 20,
      globalScore: 60, eyeTestRating: 3,
    });

    const low = computeProspectScore({
      peakLp: 500, bestProResult: null, currentLeague: "LFL",
      proWinrate: 0.5, age: 20,
      globalScore: 60, eyeTestRating: 3,
    });

    expect(high.total).toBeGreaterThan(low.total);
  });

  it("returns low score for empty input with fallbacks", () => {
    const result = computeProspectScore({
      peakLp: 0, bestProResult: null, currentLeague: "Unknown",
      proWinrate: null, age: null,
      globalScore: null, eyeTestRating: null,
    });

    // Algorithm has fallback defaults
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThanOrEqual(40); // Should be low with no real data
    expect(result.breakdown.peakLpScore).toBe(0);
    expect(result.breakdown.globalYearScore).toBe(5); // fallback default
  });
});
