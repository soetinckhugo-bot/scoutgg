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
};

const INVERTED_METRICS = new Set([
  "DTH%", "CTR%", "FB Victim", "GOLD%", "D",
]);

function isInvertedMetric(key: string): boolean {
  return INVERTED_METRICS.has(key);
}

function normalizeValue(value: number, metricKey: string, allValues: number[]): number {
  if (allValues.length === 0) return 50;

  const inverted = isInvertedMetric(metricKey);
  const sorted = [...allValues].sort((a, b) => (inverted ? a - b : b - a));

  // Find rank
  let rank = sorted.length;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] === value) {
      rank = i + 1;
      break;
    }
  }

  // Calculate percentile
  const n = sorted.length;
  return Math.max(0, Math.min(100, ((n - rank + 0.5) / n) * 100));
}

function calculateSimilarity(
  sourceStats: Record<string, number | null>,
  targetStats: Record<string, number | null>,
  role: string
): number {
  const roleMetrics = ROLE_METRICS[role]?.metrics || ROLE_METRICS.TOP.metrics;

  let totalWeight = 0;
  let weightedDiff = 0;

  for (const metric of roleMetrics) {
    const dbField = METRIC_TO_DB_FIELD[metric.key];
    if (!dbField) continue;

    const sourceVal = sourceStats[dbField];
    const targetVal = targetStats[dbField];

    if (sourceVal === null || sourceVal === undefined || targetVal === null || targetVal === undefined) {
      continue;
    }

    // Calculate percentile difference
    // For similarity, we compare the percentiles, not raw values
    const diff = Math.abs(sourceVal - targetVal);
    const similarity = Math.max(0, 100 - diff);

    totalWeight += metric.coeff;
    weightedDiff += similarity * metric.coeff;
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedDiff / totalWeight);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");
    const league = searchParams.get("league");
    const targetPlayerId = searchParams.get("targetPlayerId");

    if (!playerId) {
      return NextResponse.json({ error: "playerId required" }, { status: 400 });
    }

    // Get source player
    const sourcePlayer = await db.player.findUnique({
      where: { id: playerId },
      include: { proStats: true },
    });

    if (!sourcePlayer || !sourcePlayer.proStats) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // If comparing against specific player
    if (targetPlayerId) {
      const targetPlayer = await db.player.findUnique({
        where: { id: targetPlayerId },
        include: { proStats: true },
      });

      if (!targetPlayer || !targetPlayer.proStats) {
        return NextResponse.json({ error: "Target player not found" }, { status: 404 });
      }

      // Get all players of same role for percentile calculation
      const allPlayers = await db.player.findMany({
        where: {
          role: sourcePlayer.role,
          proStats: { isNot: null },
        },
        include: { proStats: true },
      });

      // Build percentile maps
      const metricPercentiles: Record<string, Map<string, number>> = {};

      for (const metric of ROLE_METRICS[sourcePlayer.role]?.metrics || []) {
        const dbField = METRIC_TO_DB_FIELD[metric.key];
        if (!dbField) continue;

        const values = allPlayers
          .map((p) => p.proStats?.[dbField as keyof typeof p.proStats] as number | null)
          .filter((v): v is number => v !== null && v !== undefined);

        const percentileMap = new Map<string, number>();
        for (const p of allPlayers) {
          const val = p.proStats?.[dbField as keyof typeof p.proStats] as number | null;
          if (val !== null && val !== undefined) {
            percentileMap.set(p.id, normalizeValue(val, metric.key, values));
          }
        }
        metricPercentiles[dbField] = percentileMap;
      }

      const similarity = calculateSimilarity(
        Object.fromEntries(
          Object.entries(metricPercentiles).map(([field, map]) => [
            field,
            map.get(sourcePlayer.id) ?? null,
          ])
        ),
        Object.fromEntries(
          Object.entries(metricPercentiles).map(([field, map]) => [
            field,
            map.get(targetPlayer.id) ?? null,
          ])
        ),
        sourcePlayer.role
      );

      return NextResponse.json({
        source: sourcePlayer,
        target: targetPlayer,
        similarity,
      });
    }

    // If comparing against league
    const where: any = {
      role: sourcePlayer.role,
      proStats: { isNot: null },
      id: { not: playerId },
    };

    if (league && league !== "ALL") {
      where.league = league;
    }

    const targetPlayers = await db.player.findMany({
      where,
      include: { proStats: true },
      take: 20,
    });

    if (targetPlayers.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Get all players of same role for percentile calculation
    const allPlayers = await db.player.findMany({
      where: {
        role: sourcePlayer.role,
        proStats: { isNot: null },
      },
      include: { proStats: true },
      take: 500,
    });

    // Build percentile maps for each metric
    const metricPercentiles: Record<string, Map<string, number>> = {};

    for (const metric of ROLE_METRICS[sourcePlayer.role]?.metrics || []) {
      const dbField = METRIC_TO_DB_FIELD[metric.key];
      if (!dbField) continue;

      const values = allPlayers
        .map((p) => p.proStats?.[dbField as keyof typeof p.proStats] as number | null)
        .filter((v): v is number => v !== null && v !== undefined);

      const percentileMap = new Map<string, number>();
      for (const p of allPlayers) {
        const val = p.proStats?.[dbField as keyof typeof p.proStats] as number | null;
        if (val !== null && val !== undefined) {
          percentileMap.set(p.id, normalizeValue(val, metric.key, values));
        }
      }
      metricPercentiles[dbField] = percentileMap;
    }

    // Calculate similarity for each target player
    const results = targetPlayers.map((target) => {
      const sourcePercentiles = Object.fromEntries(
        Object.entries(metricPercentiles).map(([field, map]) => [
          field,
          map.get(sourcePlayer.id) ?? null,
        ])
      );

      const targetPercentiles = Object.fromEntries(
        Object.entries(metricPercentiles).map(([field, map]) => [
          field,
          map.get(target.id) ?? null,
        ])
      );

      const similarity = calculateSimilarity(
        sourcePercentiles,
        targetPercentiles,
        sourcePlayer.role
      );

      return {
        player: {
          id: target.id,
          pseudo: target.pseudo,
          role: target.role,
          league: target.league,
          currentTeam: target.currentTeam,
          photoUrl: target.photoUrl,
        },
        similarity,
      };
    });

    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({ results: results.slice(0, 10) });
  } catch (error) {
    logger.error("Error calculating similarity", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to calculate similarity" },
      { status: 500 }
    );
  }
}
