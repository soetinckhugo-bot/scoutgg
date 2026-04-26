import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";
import { calculateRankPercentile, type PlayerData, getTierFromLeague } from "@/lib/scoring";
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
  Games: "gamesPlayed",
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the player
    const player = await db.player.findUnique({
      where: { id },
      include: { proStats: true },
    });

    if (!player || !player.proStats) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Parse comparison mode from query params
    const { searchParams } = new URL(request.url);
    const comparisonMode = searchParams.get("comparison") || "league"; // "league" | "tier"

    // Build query based on comparison mode
    const playerWhere: any = {
      role: player.role,
      proStats: { isNot: null },
    };

    if (comparisonMode === "tier") {
      const playerTier = player.tier || getTierFromLeague(player.league);
      playerWhere.tier = playerTier;
    } else {
      playerWhere.league = player.league;
    }

    // Get comparison pool
    const sameRolePlayers = await db.player.findMany({
      where: playerWhere,
      include: { proStats: true },
    });

    // Build PlayerData array
    const allPlayerData: PlayerData[] = sameRolePlayers.map((p) => ({
      id: p.id,
      pseudo: p.pseudo,
      role: p.role,
      league: p.league,
      ...p.proStats,
    }));

    // Get metrics for this role
    const roleMetrics = ROLE_METRICS[player.role]?.metrics || ROLE_METRICS.TOP.metrics;

    // Calculate percentiles for each metric
    const radarData = [];

    for (const metric of roleMetrics) {
      const dbField = METRIC_TO_DB_FIELD[metric.key];
      if (!dbField) continue;

      const value = player.proStats[dbField as keyof typeof player.proStats];
      if (value === null || value === undefined || typeof value !== "number") {
        continue;
      }

      const percentile = calculateRankPercentile(
        value,
        metric.key,
        allPlayerData,
        dbField
      );

      if (percentile) {
        radarData.push({
          metric: metric.label || metric.key,
          percentile: percentile.percentile,
          tier: percentile.tier,
          value,
        });
      }
    }

    return NextResponse.json({
      player: {
        id: player.id,
        pseudo: player.pseudo,
        role: player.role,
        league: player.league,
        tier: player.tier || getTierFromLeague(player.league),
      },
      comparisonMode,
      sampleSize: sameRolePlayers.length,
      metrics: radarData,
    }, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=86400" }
    });
  } catch (error) {
    logger.error("Error fetching radar data", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch radar data" },
      { status: 500 }
    );
  }
}
