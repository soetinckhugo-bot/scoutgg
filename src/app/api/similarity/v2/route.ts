/**
 * Cross-League Comparator V2 — RADARHUGOV1 Similarity Algorithm
 *
 * 5 normalization types:
 *   - log: KDA (logarithmic compression)
 *   - percentile: DPM, CSPM, GD@15 (rank-based)
 *   - symmetric: GD@15, CSD@15, XPD@15 (centered at 0)
 *   - percentage: KP%, DMG%, KS%, FB% (0-100 scale)
 *   - linear: Games, Penta Kills (raw value)
 *
 * Exponential curve:
 *   identicalThreshold = 3% (diff below this = 100% similar)
 *   differentThreshold = 50% (diff above this = 0% similar)
 *   curveExponent = 2.0 (quadratic falloff)
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";
import { ROLE_METRICS } from "@/lib/radar-metrics";

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
  TDPG: "tdpg",
  "Avg kills": "avgKills",
  "Avg deaths": "avgDeaths",
  "Avg assists": "avgAssists",
  CSM: "csm",
  "Avg WPM": "avgWpm",
  "Avg WCPM": "avgWcpm",
  "Avg VWPM": "avgVwpm",
  "Penta Kills": "pentaKills",
};

// ============================================================================
// NORMALIZATION TYPES
// ============================================================================

type NormalizationType = "log" | "percentile" | "symmetric" | "percentage" | "linear";

const METRIC_NORMALIZATION: Record<string, NormalizationType> = {
  // Logarithmic (compresses high values)
  KDA: "log",

  // Percentile (rank-based, 0-100)
  DPM: "percentile",
  CSPM: "percentile",
  EGPM: "percentile",
  GD15: "percentile",
  GD10: "percentile",
  XPD15: "percentile",
  XPD10: "percentile",
  CSD15: "percentile",
  CSD10: "percentile",
  VSPM: "percentile",
  WPM: "percentile",
  CWPM: "percentile",
  WCPM: "percentile",
  VWPM: "percentile",
  TDPG: "percentile",
  "Avg kills": "percentile",
  "Avg deaths": "percentile",
  "Avg assists": "percentile",
  "Avg WPM": "percentile",
  "Avg WCPM": "percentile",
  "Avg VWPM": "percentile",
  CSM: "percentile",
  STL: "percentile",

  // Symmetric (centered at 0, can be negative)
  "CS%P15": "symmetric",
  "D%P15": "symmetric",

  // Percentage (0-100 scale)
  KP: "percentage",
  "DMG%": "percentage",
  "KS%": "percentage",
  "FB%": "percentage",
  "DTH%": "percentage",
  "CTR%": "percentage",
  "VS%": "percentage",
  "GOLD%": "percentage",
  "W%": "percentage",

  // Linear (raw values)
  Games: "linear",
  "Penta Kills": "linear",
  "Solo Kills": "linear",
  "FB Victim": "linear",
  K: "linear",
  D: "linear",
  A: "linear",
};

// Metrics where lower is better
const INVERTED_METRICS = new Set([
  "DTH%", "CTR%", "FB Victim", "D", "Avg deaths",
]);

function isInvertedMetric(key: string): boolean {
  return INVERTED_METRICS.has(key);
}

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

function normalizeLog(value: number, allValues: number[]): number {
  const minVal = Math.min(...allValues, 0.1);
  const maxVal = Math.max(...allValues, minVal + 0.1);
  const logMin = Math.log10(Math.max(minVal, 0.1));
  const logMax = Math.log10(maxVal);
  const logVal = Math.log10(Math.max(value, 0.1));
  if (logMax === logMin) return 50;
  return ((logVal - logMin) / (logMax - logMin)) * 100;
}

function normalizePercentile(value: number, metricKey: string, allValues: number[]): number {
  const inverted = isInvertedMetric(metricKey);
  const sorted = [...allValues].sort((a, b) => (inverted ? a - b : b - a));

  let rank = sorted.length;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] === value) {
      rank = i + 1;
      break;
    }
  }

  const n = sorted.length;
  return Math.max(0, Math.min(100, ((n - rank + 0.5) / n) * 100));
}

function normalizeSymmetric(value: number, allValues: number[]): number {
  const maxAbs = Math.max(
    Math.abs(Math.min(...allValues)),
    Math.abs(Math.max(...allValues)),
    0.001
  );
  const normalized = ((value / maxAbs) + 1) / 2 * 100;
  return Math.max(0, Math.min(100, normalized));
}

function normalizePercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function normalizeLinear(value: number, allValues: number[]): number {
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues, minVal + 0.001);
  return ((value - minVal) / (maxVal - minVal)) * 100;
}

function normalizeValue(
  value: number,
  metricKey: string,
  allValues: number[]
): number {
  const normType = METRIC_NORMALIZATION[metricKey] || "percentile";

  switch (normType) {
    case "log":
      return normalizeLog(value, allValues);
    case "percentile":
      return normalizePercentile(value, metricKey, allValues);
    case "symmetric":
      return normalizeSymmetric(value, allValues);
    case "percentage":
      return normalizePercentage(value);
    case "linear":
      return normalizeLinear(value, allValues);
    default:
      return normalizePercentile(value, metricKey, allValues);
  }
}

// ============================================================================
// SIMILARITY CALCULATION — RADARHUGOV1
// ============================================================================

interface SimilarityConfig {
  identicalThreshold: number;
  differentThreshold: number;
  curveExponent: number;
}

const DEFAULT_CONFIG: SimilarityConfig = {
  identicalThreshold: 3,
  differentThreshold: 50,
  curveExponent: 2.0,
};

function calculateMetricSimilarity(
  normA: number,
  normB: number,
  config: SimilarityConfig = DEFAULT_CONFIG
): number {
  const diff = Math.abs(normA - normB);

  if (diff <= config.identicalThreshold) {
    return 100;
  }

  if (diff >= config.differentThreshold) {
    return 0;
  }

  const range = config.differentThreshold - config.identicalThreshold;
  const normalizedDiff = (diff - config.identicalThreshold) / range;
  const similarity = 100 * Math.pow(1 - normalizedDiff, config.curveExponent);

  return Math.max(0, Math.min(100, similarity));
}

function adjustMetricSimilarity(
  metricKey: string,
  rawA: number,
  rawB: number,
  baseSimilarity: number
): number {
  let adjusted = baseSimilarity;

  if (metricKey === "DMG%") {
    const avgDmg = (rawA + rawB) / 2;
    const diff = Math.abs(rawA - rawB);
    if (avgDmg > 25 && diff > 5) {
      adjusted *= 0.9;
    }
  }

  if (metricKey === "KS%") {
    const diff = Math.abs(rawA - rawB);
    if (diff > 0.2 && diff < 0.5) {
      adjusted *= 0.85;
    }
  }

  if (metricKey === "FB%") {
    const diff = Math.abs(rawA - rawB);
    if (diff > 0.15 && diff < 0.4) {
      adjusted *= 0.9;
    }
  }

  return adjusted;
}

function calculateSimilarityV2(
  sourceStats: Record<string, { raw: number; normalized: number }>,
  targetStats: Record<string, { raw: number; normalized: number }>,
  role: string,
  config: SimilarityConfig = DEFAULT_CONFIG
): {
  overall: number;
  breakdown: Record<string, { similarity: number; weight: number; rawA: number; rawB: number }>;
} {
  const roleMetrics = ROLE_METRICS[role]?.metrics || ROLE_METRICS.TOP.metrics;

  let totalWeight = 0;
  let weightedSimilarity = 0;
  const breakdown: Record<string, { similarity: number; weight: number; rawA: number; rawB: number }> = {};

  for (const metric of roleMetrics) {
    const dbField = METRIC_TO_DB_FIELD[metric.key];
    if (!dbField) continue;

    const sourceData = sourceStats[dbField];
    const targetData = targetStats[dbField];

    if (!sourceData || !targetData) continue;

    let similarity = calculateMetricSimilarity(
      sourceData.normalized,
      targetData.normalized,
      config
    );

    similarity = adjustMetricSimilarity(
      metric.key,
      sourceData.raw,
      targetData.raw,
      similarity
    );

    const weight = metric.coeff;
    totalWeight += weight;
    weightedSimilarity += similarity * weight;

    breakdown[metric.key] = {
      similarity: Math.round(similarity),
      weight,
      rawA: Math.round(sourceData.raw * 100) / 100,
      rawB: Math.round(targetData.raw * 100) / 100,
    };
  }

  const overall = totalWeight > 0 ? Math.round(weightedSimilarity / totalWeight) : 0;

  return { overall, breakdown };
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");
    const targetPlayerId = searchParams.get("targetPlayerId");
    const comparisonScope = searchParams.get("scope") || "league"; // "league" | "tier" | "all"

    if (!playerId) {
      return NextResponse.json({ error: "playerId required" }, { status: 400 });
    }

    const sourcePlayer = await db.player.findUnique({
      where: { id: playerId },
      include: { proStats: true },
    });

    if (!sourcePlayer || !sourcePlayer.proStats) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const poolWhere: any = {
      role: sourcePlayer.role,
      proStats: { isNot: null },
      id: { not: playerId },
    };

    if (comparisonScope === "league") {
      poolWhere.league = sourcePlayer.league;
    } else if (comparisonScope === "tier") {
      poolWhere.tier = sourcePlayer.tier || "ERL_MINOR";
    }

    const targetPlayers = await db.player.findMany({
      where: poolWhere,
      include: { proStats: true },
      take: 50,
    });

    if (targetPlayers.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const allPoolPlayers = [sourcePlayer, ...targetPlayers];

    const allNormalizedStats: Record<string, Record<string, { raw: number; normalized: number }>> = {};

    for (const metric of ROLE_METRICS[sourcePlayer.role]?.metrics || []) {
      const dbField = METRIC_TO_DB_FIELD[metric.key];
      if (!dbField) continue;

      const allValues: number[] = [];
      for (const p of allPoolPlayers) {
        const val = p.proStats?.[dbField as keyof typeof p.proStats] as number | null;
        if (val !== null && val !== undefined && typeof val === "number") {
          allValues.push(val);
        }
      }

      if (allValues.length === 0) continue;

      for (const p of allPoolPlayers) {
        const val = p.proStats?.[dbField as keyof typeof p.proStats] as number | null;
        if (val !== null && val !== undefined && typeof val === "number") {
          if (!allNormalizedStats[p.id]) {
            allNormalizedStats[p.id] = {};
          }
          allNormalizedStats[p.id][dbField] = {
            raw: val,
            normalized: normalizeValue(val, metric.key, allValues),
          };
        }
      }
    }

    const results = targetPlayers.map((target) => {
      const sourceStats = allNormalizedStats[sourcePlayer.id] || {};
      const targetStats = allNormalizedStats[target.id] || {};

      const { overall, breakdown } = calculateSimilarityV2(
        sourceStats,
        targetStats,
        sourcePlayer.role
      );

      return {
        player: {
          id: target.id,
          pseudo: target.pseudo,
          role: target.role,
          league: target.league,
          tier: target.tier,
          currentTeam: target.currentTeam,
          photoUrl: target.photoUrl,
        },
        similarity: overall,
        breakdown,
      };
    });

    results.sort((a, b) => b.similarity - a.similarity);

    if (targetPlayerId) {
      const specificResult = results.find((r) => r.player.id === targetPlayerId);
      if (specificResult) {
        return NextResponse.json({
          source: {
            id: sourcePlayer.id,
            pseudo: sourcePlayer.pseudo,
            role: sourcePlayer.role,
            league: sourcePlayer.league,
            tier: sourcePlayer.tier,
          },
          target: specificResult.player,
          similarity: specificResult.similarity,
          breakdown: specificResult.breakdown,
        });
      }
    }

    return NextResponse.json({
      source: {
        id: sourcePlayer.id,
        pseudo: sourcePlayer.pseudo,
        role: sourcePlayer.role,
        league: sourcePlayer.league,
        tier: sourcePlayer.tier,
      },
      comparisonScope,
      sampleSize: targetPlayers.length,
      results: results.slice(0, 10),
    });
  } catch (error) {
    logger.error("Error calculating similarity v2", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to calculate similarity" },
      { status: 500 }
    );
  }
}
