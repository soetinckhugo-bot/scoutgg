/**
 * LeagueScout Legacy — Percentile / Centile Calculation System
 * Migrated from RADARHUGOV1/src/web/v2-features.js
 *
 * Rank-based percentile calculation with role filtering,
 * league-specific missing stats handling, and metric categorization.
 */

import { isInvertedMetric, getMetricsByCategory } from "./radar-metrics";

// ============================================================================
// LEAGUE MISSING STATS — stats absent in certain leagues
// ============================================================================

export const LEAGUE_MISSING_STATS: Record<string, string[]> = {
  LPL: [
    "FB%",
    "GD10",
    "XPD10",
    "CSD10",
    "CS%P15",
    "D%P15",
    "TDPG",
    "STL",
    "CSD@15",
    "XPD@15",
    "FB Victim",
    "Penta Kills",
    "Solo Kills",
  ],
  LEC: [],
  LCK: [],
  LCS: [],
  CBLOL: [],
};

/**
 * Detect league from dataset name or filename
 */
export function detectLeagueFromDataset(datasetName: string): string {
  const lower = datasetName.toLowerCase();
  if (lower.includes("lpl")) return "LPL";
  if (lower.includes("lec")) return "LEC";
  if (lower.includes("lck")) return "LCK";
  if (lower.includes("lcs")) return "LCS";
  if (lower.includes("cblol")) return "CBLOL";
  return "UNKNOWN";
}

/**
 * Check if a stat is available for a given league
 */
export function isStatAvailableForLeague(stat: string, league: string): boolean {
  if (!league || league === "UNKNOWN") return true;
  const missing = LEAGUE_MISSING_STATS[league] ?? [];
  return !missing.includes(stat);
}

// ============================================================================
// PERCENTILE CALCULATION — rank-based
// ============================================================================

export interface PlayerValue {
  value: number;
  playerId: string;
  playerName: string;
}

export interface PercentileResult {
  percentile: number;
  rank: number;
  total: number;
  tier: "S" | "A" | "B" | "C" | "D";
  color: string;
}

// Simple memoization cache for calculatePercentile
const percentileCache = new Map<string, PercentileResult | null>();
const MAX_CACHE_SIZE = 200;

function getPercentileCacheKey(
  value: number,
  metric: string,
  playerRole: string | null,
  allPlayersLength: number,
  datasetName?: string
): string {
  return `${metric}::${value}::${playerRole || "all"}::${allPlayersLength}::${datasetName || "unknown"}`;
}

/**
 * Calculate percentile for a value within a dataset — FILTERED BY ROLE
 *
 * Uses RANK-BASED calculation: higher rank = higher percentile
 * Formula: ((n - rank + 0.5) / n) * 100
 *
 * Example: 2nd out of 10 = 85th percentile (top 15%)
 */
export function calculatePercentile(
  value: number | string | null,
  metric: string,
  playerRole: string | null,
  allPlayers: Array<Record<string, unknown>>,
  datasetName?: string
): PercentileResult | null {
  // Check league availability
  const league = datasetName ? detectLeagueFromDataset(datasetName) : "UNKNOWN";
  if (!isStatAvailableForLeague(metric, league)) {
    return null;
  }

  // Filter by role if specified
  let filtered = allPlayers;
  if (playerRole && playerRole !== "all") {
    filtered = allPlayers.filter((p) => {
      const role = (p.role as string) || (p.Pos as string);
      return role?.toUpperCase() === playerRole.toUpperCase();
    });
  }

  if (filtered.length === 0) {
    return { percentile: 50, rank: 1, total: 1, tier: "C", color: "#FF9F43" };
  }

  // Extract numeric values
  const mappedValues = filtered
    .map((p, idx) => {
      const raw = p[metric];
      if (raw === null || raw === undefined || raw === "") return null;
      const clean = String(raw).replace(/[%]/g, "").replace(",", ".");
      const num = parseFloat(clean);
      if (isNaN(num)) return null;
      return {
        value: num,
        playerId: (p.id as string) || String(idx),
        playerName: (p.pseudo as string) || (p.Player as string) || "",
      };
    });
  
  const playerValues: PlayerValue[] = mappedValues.filter((item): item is PlayerValue => item !== null);

  if (playerValues.length === 0) {
    return { percentile: 50, rank: 1, total: 1, tier: "C", color: "#FF9F43" };
  }

  const numValue = typeof value === "string" ? parseFloat(value.replace(/[%]/g, "").replace(",", ".")) : Number(value);
  if (isNaN(numValue)) {
    return { percentile: 50, rank: 1, total: 1, tier: "C", color: "#FF9F43" };
  }

  // Check cache for identical calls
  const cacheKey = getPercentileCacheKey(numValue, metric, playerRole, allPlayers.length, datasetName);
  const cached = percentileCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Sort: for normal metrics descending, for inverted ascending
  const inverted = isInvertedMetric(metric);
  const sorted = [...playerValues].sort((a, b) => (inverted ? a.value - b.value : b.value - a.value));

  // Find rank (handle ties)
  let rank = 0;
  let sameRankCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].value === numValue) {
      if (sameRankCount === 0) {
        rank = i + 1;
      }
      sameRankCount++;
    }
  }

  // Value not found — estimate rank
  if (sameRankCount === 0) {
    for (let i = 0; i < sorted.length; i++) {
      if ((inverted && sorted[i].value > numValue) || (!inverted && sorted[i].value < numValue)) {
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

  // Determine tier (matching RolePercentiles display)
  const tier = clamped >= 90 ? "S" : clamped >= 75 ? "A" : clamped >= 60 ? "B" : clamped >= 50 ? "C" : "D";

  // Tier colors matching RolePercentiles
  const colors: Record<string, string> = {
    S: "#3B82F6",   // Elite — Blue
    A: "#22C55E",   // Excellent — Green
    B: "#EAB308",   // Good — Yellow
    C: "#F97316",   // Average — Orange
    D: "#EF4444",   // Weak — Red
  };

  const result: PercentileResult = {
    percentile: clamped,
    rank,
    total: n,
    tier,
    color: colors[tier],
  };

  // Cache result with LRU-like eviction
  if (percentileCache.size >= MAX_CACHE_SIZE) {
    const firstKey = percentileCache.keys().next().value;
    if (firstKey !== undefined) {
      percentileCache.delete(firstKey);
    }
  }
  percentileCache.set(cacheKey, result);

  return result;
}

/**
 * Calculate percentiles for all metrics of a player
 */
export function calculatePlayerPercentiles(
  player: Record<string, unknown>,
  allPlayers: Array<Record<string, unknown>>,
  metrics: string[],
  datasetName?: string
): Record<string, PercentileResult | null> {
  const role = (player.role as string) || (player.Pos as string) || null;
  const results: Record<string, PercentileResult | null> = {};

  for (const metric of metrics) {
    const value = player[metric];
    if (value !== undefined && value !== null && value !== "" && (typeof value === "string" || typeof value === "number")) {
      results[metric] = calculatePercentile(value as string | number, metric, role, allPlayers, datasetName);
    } else {
      results[metric] = null;
    }
  }

  return results;
}

/**
 * Get tier label from percentile
 */
export function getTierFromPercentile(percentile: number): { tier: string; label: string; color: string } {
  if (percentile >= 90) return { tier: "S", label: "Elite", color: "#3B82F6" };
  if (percentile >= 75) return { tier: "A", label: "Excellent", color: "#22C55E" };
  if (percentile >= 60) return { tier: "B", label: "Good", color: "#EAB308" };
  if (percentile >= 50) return { tier: "C", label: "Average", color: "#F97316" };
  return { tier: "D", label: "Weak", color: "#EF4444" };
}

/**
 * Get centile color hex from percentile value
 */
export function getCentileColor(percentile: number | null): string {
  if (percentile === null || percentile === undefined) return "#888888";
  return getTierFromPercentile(percentile).color;
}

/**
 * Get Tailwind classes for a percentile value
 */
export function getCentileClass(percentile: number | null): string {
  if (percentile === null || percentile === undefined) return "text-[#A0AEC0] bg-gray-400/10";
  if (percentile >= 90) return "text-blue-400 bg-blue-500/10";
  if (percentile >= 75) return "text-green-400 bg-green-500/10";
  if (percentile >= 60) return "text-yellow-400 bg-yellow-500/10";
  if (percentile >= 50) return "text-orange-400 bg-orange-500/10";
  return "text-red-400 bg-red-500/10";
}

/**
 * Categorize player percentiles into Fight / Vision / Resources / Early
 */
export function categorizePlayerPercentiles(
  percentiles: Record<string, PercentileResult | null>
): Record<string, Array<{ metric: string; result: PercentileResult }>> {
  const metrics = Object.keys(percentiles);
  const categories = getMetricsByCategory(metrics);

  const result: Record<string, Array<{ metric: string; result: PercentileResult }>> = {
    fight: [],
    vision: [],
    resources: [],
    early: [],
    other: [],
  };

  for (const [cat, metricList] of Object.entries(categories)) {
    for (const metric of metricList) {
      const p = percentiles[metric];
      if (p) {
        result[cat].push({ metric, result: p });
      }
    }
  }

  return result;
}
