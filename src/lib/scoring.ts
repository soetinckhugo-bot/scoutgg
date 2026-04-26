/**
 * LeagueScout Scoring System — Rank-Based Percentile (RADARHUGOV1 style)
 * 
 * How it works:
 * 1. For each metric, compare the player to ALL players of the SAME ROLE in the SAME LEAGUE
 * 2. Calculate rank-based percentile: ((n - rank + 0.5) / n) * 100
 * 3. Weighted average of percentiles using role-specific coefficients
 * 4. Apply league coefficient for global score
 */

import { ROLE_METRICS } from "./radar-metrics";

// ============================================================================
// TIER DEFINITIONS — 4-Tier League System
// ============================================================================
// Tier 1: LCK, LPL                              → coefficient 1.0
// Tier 2: LEC, LCS, CBLOL, LCP                  → coefficient 0.8
// Tier 3: LFL, LES, TCL, PRM, NACL, LDL, LCK CL → coefficient 0.6
// Tier 4: ROL, NLC, LPLOL, EBL, HLL, LIT, RL, AL, HM, LFL2, PRM2, Amateur → coefficient 0.5

export const LEAGUE_TIERS = {
  TIER_1: ["LCK", "LPL"],
  TIER_2: ["LEC", "LCS", "CBLOL", "LCP"],
  TIER_3: ["LFL", "LES", "TCL", "PRM", "NACL", "LDL", "LCK CL"],
  TIER_4: ["ROL", "NLC", "LPLOL", "EBL", "HLL", "LIT", "RL", "AL", "HM", "LFL2", "PRM2", "AMATEUR"],
} as const;

export type TierLevel = "TIER_1" | "TIER_2" | "TIER_3" | "TIER_4";

export function getTierFromLeague(league: string): TierLevel {
  const upper = league.toUpperCase();
  if (LEAGUE_TIERS.TIER_1.includes(upper as any)) return "TIER_1";
  if (LEAGUE_TIERS.TIER_2.includes(upper as any)) return "TIER_2";
  if (LEAGUE_TIERS.TIER_3.includes(upper as any)) return "TIER_3";
  return "TIER_4";
}

// ============================================================================
// LEAGUE COEFFICIENTS (for global score)
// ============================================================================

export const LEAGUE_GLOBAL_COEFFICIENTS: Record<TierLevel, number> = {
  TIER_1: 1.0,
  TIER_2: 0.8,
  TIER_3: 0.6,
  TIER_4: 0.5,
};

// ============================================================================
// METRIC TO DB FIELD MAPPING
// ============================================================================

const METRIC_TO_DB_FIELD: Record<string, string> = {
  "W%": "gamesPlayed",
  KP: "kpPercent",
  "CTR%": "ctrPercent",
  "DTH%": "dthPercent",
  CSPM: "cspm",
  "DMG%": "damagePercent",
  EGPM: "egpm",
  "GOLD%": "goldPercent",
  "FB Victim": "fbVictim",
  "Solo Kills": "soloKills",
  DPM: "dpm",
  CSD15: "csdAt15",
  CSD10: "csdAt10",
  XPD15: "xpdAt15",
  XPD10: "xpdAt10",
  GD15: "gdAt15",
  GD10: "gdAt10",
  "FB%": "fbPercent",
  "D%P15": "dPercentAt15",
  "CS%P15": "csPercentAt15",
  VSPM: "vspm",
  "VS%": "vsPercent",
  WPM: "wpm",
  CWPM: "cwpm",
  WCPM: "wcpm",
  VWPM: "vwpm",
  "KS%": "ksPercent",
  KDA: "kda",
  D: "d",
  A: "a",
  K: "k",
  STL: "stl",
  Games: "gamesPlayed",
  TDPG: "tdpg",
  "Avg kills": "avgKills",
  "Avg deaths": "avgDeaths",
  "Avg assists": "avgAssists",
  "Avg WPM": "avgWpm",
  "Avg WCPM": "avgWcpm",
  "Avg VWPM": "avgVwpm",
};

// Inverted metrics (lower is better)
const INVERTED_METRICS = new Set([
  "DTH%", "CTR%", "FB Victim", "GOLD%", "D", "Gold%"
]);

function isInvertedMetric(key: string): boolean {
  return INVERTED_METRICS.has(key);
}

// ============================================================================
// PLAYER DATA INTERFACE (from database)
// ============================================================================

export interface PlayerData {
  id: string;
  pseudo: string;
  role: string;
  league: string;
  [key: string]: unknown;
}

// ============================================================================
// RANK-BASED PERCENTILE CALCULATION
// ============================================================================

export interface PercentileResult {
  percentile: number;
  rank: number;
  total: number;
  tier: "S" | "A" | "B" | "C" | "D";
  color: string;
}

/**
 * Calculate rank-based percentile for a single metric
 * Formula: ((n - rank + 0.5) / n) * 100
 * 
 * Example: 2nd out of 10 = 85th percentile (top 15%)
 */
export function calculateRankPercentile(
  value: number,
  metricKey: string,
  allPlayers: PlayerData[],
  dbField: string
): PercentileResult | null {
  // Extract all values for this metric
  const playerValues = allPlayers
    .map((p) => {
      const raw = p[dbField];
      if (raw === null || raw === undefined || raw === "") return null;
      const num = typeof raw === "number" ? raw : parseFloat(String(raw));
      if (isNaN(num)) return null;
      return { value: num, playerId: p.id, playerName: p.pseudo };
    })
    .filter((item): item is { value: number; playerId: string; playerName: string } => item !== null);

  if (playerValues.length === 0) {
    return null;
  }

  // Sort: normal metrics descending, inverted ascending
  const inverted = isInvertedMetric(metricKey);
  const sorted = [...playerValues].sort((a, b) =>
    inverted ? a.value - b.value : b.value - a.value
  );

  // Find rank (handle ties)
  let rank = 0;
  let sameRankCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].value === value) {
      if (sameRankCount === 0) {
        rank = i + 1;
      }
      sameRankCount++;
    }
  }

  // Value not found — estimate rank
  if (sameRankCount === 0) {
    for (let i = 0; i < sorted.length; i++) {
      if ((inverted && sorted[i].value > value) || (!inverted && sorted[i].value < value)) {
        rank = i + 1;
        break;
      }
    }
    if (rank === 0) rank = sorted.length;
    sameRankCount = 1;
  }

  // Calculate percentile
  const n = sorted.length;
  const percentile = Math.round(((n - rank + 0.5) / n) * 100);
  const clamped = Math.max(0, Math.min(100, percentile));

  // Determine tier
  const tier = clamped >= 85 ? "S" : clamped >= 70 ? "A" : clamped >= 60 ? "B" : clamped >= 50 ? "C" : "D";

  const colors: Record<string, string> = {
    S: "#F59E0B",
    A: "#EAB308",
    B: "#F97316",
    C: "#EF4444",
    D: "#6B7280",
  };

  return {
    percentile: clamped,
    rank,
    total: n,
    tier,
    color: colors[tier],
  };
}

// ============================================================================
// SCORE CALCULATION
// ============================================================================

export interface PlayerStats {
  role: string;
  league: string;
  [key: string]: unknown;
}

export interface MetricScore {
  metric: string;
  value: number | null;
  percentile: PercentileResult | null;
  coeff: number;
}

export interface ScoringResult {
  rawScore: number;
  globalScore: number;
  tierScore: number;
  tier: TierLevel;
  metricScores: MetricScore[];
}

// Simple in-memory cache for calculateScores results
const scoresCache = new Map<string, ScoringResult>();
const MAX_CACHE_SIZE = 100;

function getCacheKey(playerStats: PlayerStats, allPlayers: PlayerData[]): string {
  const playerId = (playerStats as any).id || JSON.stringify(playerStats);
  const playersHash = allPlayers.length;
  return `${playerId}::${playerStats.role}::${playerStats.league}::${playersHash}`;
}

/**
 * Calculate scores using rank-based percentiles
 * 
 * @param playerStats - The player to score
 * @param allPlayers - All players in the same league (will be filtered by role internally)
 */
export function calculateScores(
  playerStats: PlayerStats,
  allPlayers: PlayerData[]
): ScoringResult {
  const cacheKey = getCacheKey(playerStats, allPlayers);
  const cached = scoresCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const role = playerStats.role?.toUpperCase() || "TOP";
  const roleMetrics = ROLE_METRICS[role]?.metrics || ROLE_METRICS.TOP.metrics;

  // Filter players by same role
  const sameRolePlayers = allPlayers.filter(
    (p) => p.role?.toUpperCase() === role
  );

  let totalWeight = 0;
  let weightedSum = 0;
  const metricScores: MetricScore[] = [];

  for (const metric of roleMetrics) {
    const dbField = METRIC_TO_DB_FIELD[metric.key];
    if (!dbField) continue;

    const value = playerStats[dbField];
    if (value === null || value === undefined || typeof value !== "number") {
      metricScores.push({
        metric: metric.key,
        value: null,
        percentile: null,
        coeff: metric.coeff,
      });
      continue;
    }

    // Calculate percentile
    const percentile = calculateRankPercentile(
      value,
      metric.key,
      sameRolePlayers,
      dbField
    );

    metricScores.push({
      metric: metric.key,
      value,
      percentile,
      coeff: metric.coeff,
    });

    if (percentile) {
      totalWeight += metric.coeff;
      weightedSum += percentile.percentile * metric.coeff;
    }
  }

  // Calculate raw score (weighted average of percentiles)
  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 50;
  const clampedRaw = Math.max(0, Math.min(100, rawScore));

  // Apply league coefficient for global score
  const tier = getTierFromLeague(playerStats.league);
  const globalScore = Math.round(clampedRaw * LEAGUE_GLOBAL_COEFFICIENTS[tier]);

  const result: ScoringResult = {
    rawScore: Math.round(clampedRaw),
    globalScore,
    tierScore: Math.round(clampedRaw),
    tier,
    metricScores,
  };

  // Cache result with LRU-like eviction
  if (scoresCache.size >= MAX_CACHE_SIZE) {
    const firstKey = scoresCache.keys().next().value;
    if (firstKey !== undefined) {
      scoresCache.delete(firstKey);
    }
  }
  scoresCache.set(cacheKey, result);

  return result;
}

/**
 * Calculate scores without allPlayers (fallback to 50)
 */
export function calculateScoresSimple(stats: { role: string; league: string }): {
  rawScore: number;
  globalScore: number;
  tierScore: number;
  tier: TierLevel;
} {
  const tier = getTierFromLeague(stats.league);
  return {
    rawScore: 50,
    globalScore: Math.round(50 * LEAGUE_GLOBAL_COEFFICIENTS[tier]),
    tierScore: 50,
    tier,
  };
}
