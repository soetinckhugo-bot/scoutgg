import { describe, it, expect } from "vitest";
import { filterPlayers, sortPlayers, paginatePlayers } from "../player-filters";
import type { FilterablePlayer } from "../player-filters";

function makePlayer(overrides: Partial<FilterablePlayer> = {}): FilterablePlayer {
  return {
    id: "p1",
    pseudo: "PlayerOne",
    realName: "John Doe",
    role: "TOP",
    league: "LFL",
    status: "FREE_AGENT",
    currentTeam: null,
    age: 20,
    soloqStats: {
      currentRank: "Challenger 1200",
      peakLp: 1200,
      winrate: 0.55,
      totalGames: 400,
    },
    ...overrides,
  };
}

const players: FilterablePlayer[] = [
  makePlayer({ id: "p1", pseudo: "Zeka", role: "MID", league: "LFL", status: "FREE_AGENT", age: 19, soloqStats: { currentRank: "Challenger 1400", peakLp: 1400, winrate: 0.58, totalGames: 500 } }),
  makePlayer({ id: "p2", pseudo: "Adam", role: "TOP", league: "LEC", status: "UNDER_CONTRACT", age: 22, soloqStats: { currentRank: "Challenger 900", peakLp: 900, winrate: 0.52, totalGames: 300 } }),
  makePlayer({ id: "p3", pseudo: "Yike", role: "JUNGLE", league: "LFL", status: "FREE_AGENT", age: 18, soloqStats: { currentRank: "Challenger 1100", peakLp: 1100, winrate: 0.60, totalGames: 600 } }),
  makePlayer({ id: "p4", pseudo: "Bo", realName: "Wang Bo", role: "ADC", league: "LVP", status: "ACADEMY", age: null, soloqStats: null }),
];

// ─── FILTERING ───────────────────────────────────────────────────────────────

describe("filterPlayers", () => {
  it("returns all players when no filters", () => {
    expect(filterPlayers(players, {})).toHaveLength(4);
  });

  it("filters by search query on pseudo", () => {
    const result = filterPlayers(players, { q: "zek" });
    expect(result).toHaveLength(1);
    expect(result[0].pseudo).toBe("Zeka");
  });

  it("filters by search query on realName", () => {
    const result = filterPlayers(players, { q: "wang" });
    expect(result).toHaveLength(1);
    expect(result[0].pseudo).toBe("Bo");
  });

  it("is case-insensitive", () => {
    const result = filterPlayers(players, { q: "ZEKA" });
    expect(result).toHaveLength(1);
  });

  it("filters by role", () => {
    const result = filterPlayers(players, { role: "TOP" });
    expect(result).toHaveLength(1);
    expect(result[0].pseudo).toBe("Adam");
  });

  it("filters by league", () => {
    const result = filterPlayers(players, { league: "LFL" });
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.pseudo).sort()).toEqual(["Yike", "Zeka"]);
  });

  it("filters by status", () => {
    const result = filterPlayers(players, { status: "FREE_AGENT" });
    expect(result).toHaveLength(2);
  });

  it("combines multiple filters", () => {
    const result = filterPlayers(players, { league: "LFL", status: "FREE_AGENT" });
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no match", () => {
    const result = filterPlayers(players, { q: "nonexistent" });
    expect(result).toHaveLength(0);
  });
});

// ─── SORTING ─────────────────────────────────────────────────────────────────

describe("sortPlayers", () => {
  it("sorts by name ascending", () => {
    const result = sortPlayers(players, "name");
    expect(result.map((p) => p.pseudo)).toEqual(["Adam", "Bo", "Yike", "Zeka"]);
  });

  it("sorts by peak LP descending", () => {
    const result = sortPlayers(players, "rank");
    expect(result.map((p) => p.pseudo)).toEqual(["Zeka", "Yike", "Adam", "Bo"]);
  });

  it("sorts by winrate descending", () => {
    const result = sortPlayers(players, "winrate");
    expect(result.map((p) => p.pseudo)).toEqual(["Yike", "Zeka", "Adam", "Bo"]);
  });

  it("sorts by age ascending (nulls last)", () => {
    const result = sortPlayers(players, "age");
    expect(result.map((p) => p.pseudo)).toEqual(["Yike", "Zeka", "Adam", "Bo"]);
  });

  it("handles players with missing soloqStats gracefully", () => {
    const withMissing = [
      makePlayer({ id: "m1", pseudo: "A", soloqStats: null }),
      makePlayer({ id: "m2", pseudo: "B", soloqStats: { currentRank: "Challenger 100", peakLp: 100, winrate: 0.5, totalGames: 10 } }),
    ];
    const result = sortPlayers(withMissing, "rank");
    expect(result[0].pseudo).toBe("B");
    expect(result[1].pseudo).toBe("A");
  });
});

// ─── PAGINATION ──────────────────────────────────────────────────────────────

describe("paginatePlayers", () => {
  const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("returns first page by default", () => {
    const result = paginatePlayers(list, 1, 3);
    expect(result.items).toEqual([1, 2, 3]);
    expect(result.totalPages).toBe(4);
  });

  it("returns correct page", () => {
    const result = paginatePlayers(list, 2, 3);
    expect(result.items).toEqual([4, 5, 6]);
  });

  it("clamps page to valid range", () => {
    const result = paginatePlayers(list, 99, 3);
    expect(result.items).toEqual([10]);
    expect(result.totalPages).toBe(4);
  });

  it("handles empty array", () => {
    const result = paginatePlayers([], 1, 3);
    expect(result.items).toEqual([]);
    expect(result.totalPages).toBe(1);
  });

  it("handles page 0 by clamping to 1", () => {
    const result = paginatePlayers(list, 0, 3);
    expect(result.items).toEqual([1, 2, 3]);
  });
});
