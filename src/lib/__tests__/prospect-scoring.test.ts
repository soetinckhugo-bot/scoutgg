import { describe, it, expect } from "vitest";
import { computeProspectScore } from "../prospect-scoring";

describe("computeProspectScore", () => {
  it("returns a score out of 100", () => {
    const result = computeProspectScore({
      peakLp: 1200,
      proWinrate: 0.6,
      currentLeague: "LFL",
      bestProResult: "Final LFL 2026 Spring",
      soloqGames: 400,
      age: 19,
      proChampionPool: `["Azir","Sylas","Akali"]`,
      soloqWinrate: 0.58,
      eyeTestRating: 4,
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.breakdown.peakLpScore).toBeGreaterThan(0);
    expect(result.breakdown.ageScore).toBeGreaterThan(0);
  });

  it("gives higher score for younger players", () => {
    const young = computeProspectScore({
      peakLp: 1000, proWinrate: 0.5, currentLeague: "LFL",
      bestProResult: null, soloqGames: 300, age: 17,
      proChampionPool: `["A","B","C"]`, soloqWinrate: 0.55, eyeTestRating: 3,
    });

    const old = computeProspectScore({
      peakLp: 1000, proWinrate: 0.5, currentLeague: "LFL",
      bestProResult: null, soloqGames: 300, age: 22,
      proChampionPool: `["A","B","C"]`, soloqWinrate: 0.55, eyeTestRating: 3,
    });

    expect(young.total).toBeGreaterThan(old.total);
  });

  it("gives higher score for higher peak LP", () => {
    const high = computeProspectScore({
      peakLp: 1500, proWinrate: 0.5, currentLeague: "LFL",
      bestProResult: null, soloqGames: 300, age: 20,
      proChampionPool: `["A","B","C"]`, soloqWinrate: 0.55, eyeTestRating: 3,
    });

    const low = computeProspectScore({
      peakLp: 500, proWinrate: 0.5, currentLeague: "LFL",
      bestProResult: null, soloqGames: 300, age: 20,
      proChampionPool: `["A","B","C"]`, soloqWinrate: 0.55, eyeTestRating: 3,
    });

    expect(high.total).toBeGreaterThan(low.total);
  });

  it("returns low score for empty input with fallbacks", () => {
    const result = computeProspectScore({
      peakLp: 0, proWinrate: null, currentLeague: "Unknown",
      bestProResult: null, soloqGames: 0, age: null,
      proChampionPool: null, soloqWinrate: 0, eyeTestRating: null,
    });

    // Algorithm has fallback defaults (e.g., unknown winrate = 5pts, unknown age = 5pts)
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThanOrEqual(30); // Should be low with no real data
    expect(result.breakdown.peakLpScore).toBe(0);
    expect(result.breakdown.soloqGamesScore).toBe(0);
  });
});
