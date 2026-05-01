import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";
import { calculatePercentile, type PercentileResult } from "@/lib/percentiles";
import { ROLE_METRICS } from "@/lib/radar-metrics";
import { getTierFromLeague } from "@/lib/scoring";

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
      // Compare against all players in the same tier (same role)
      const playerTier = player.tier || getTierFromLeague(player.league);
      playerWhere.tier = playerTier;
    } else {
      // Default: compare against same league
      playerWhere.league = player.league;
    }

    // Get comparison pool
    const sameRolePlayers = await db.player.findMany({
      where: playerWhere,
      include: { proStats: true },
    });

    // Convert to format expected by percentile calculator
    // Map DB fields to metric keys so calculatePercentile can find them
    const allPlayersData = sameRolePlayers.map((p) => {
      const data: Record<string, unknown> = {
        id: p.id,
        pseudo: p.pseudo,
        role: p.role,
      };
      // Add all proStats with DB field names
      for (const [key, val] of Object.entries(p.proStats || {})) {
        data[key] = val;
      }
      // Also add metric key aliases for calculatePercentile
      const reverseMap: Record<string, string> = {
        winRate: "W%",
        kpPercent: "KP",
        ctrPercent: "CTR%",
        dthPercent: "DTH%",
        cspm: "CSPM",
        damagePercent: "DMG%",
        egpm: "EGPM",
        goldPercent: "GOLD%",
        fbVictim: "FB Victim",
        soloKills: "Solo Kills",
        dpm: "DPM",
        csdAt15: "CSD15",
        csdAt10: "CSD10",
        xpdAt15: "XPD15",
        xpdAt10: "XPD10",
        gdAt15: "GD15",
        gdAt10: "GD10",
        fbPercent: "FB%",
        dPercentAt15: "D%P15",
        csPercentAt15: "CS%P15",
        vspm: "VSPM",
        vsPercent: "VS%",
        wpm: "WPM",
        cwpm: "CWPM",
        wcpm: "WCPM",
        vwpm: "VWPM",
        ksPercent: "KS%",
        kda: "KDA",
        d: "D",
        a: "A",
        k: "K",
        stl: "STL",
        tdpg: "TDPG",
        avgKills: "Avg kills",
        avgDeaths: "Avg deaths",
        avgAssists: "Avg assists",
        csm: "CSM",
        avgWpm: "Avg WPM",
        avgWcpm: "Avg WCPM",
        avgVwpm: "Avg VWPM",
        pentaKills: "Penta Kills",
      };
      for (const [dbField, metricKey] of Object.entries(reverseMap)) {
        if (data[dbField] !== undefined && data[dbField] !== null) {
          data[metricKey] = data[dbField];
        }
      }
      return data;
    });

    // All CSV metrics to calculate percentiles for
    const allCsvMetrics = [
      { key: "W%", label: "W%" },
      { key: "CTR%", label: "CTR%" },
      { key: "K", label: "K" },
      { key: "D", label: "D" },
      { key: "A", label: "A" },
      { key: "KDA", label: "KDA" },
      { key: "KP", label: "KP" },
      { key: "KS%", label: "KS%" },
      { key: "DTH%", label: "DTH%" },
      { key: "FB%", label: "FB%" },
      { key: "FB Victim", label: "FB Victim" },
      { key: "GD10", label: "GD@10" },
      { key: "XPD10", label: "XPD@10" },
      { key: "CSD10", label: "CSD@10" },
      { key: "CSPM", label: "CSPM" },
      { key: "CS%P15", label: "CS%P15" },
      { key: "DPM", label: "DPM" },
      { key: "DMG%", label: "DMG%" },
      { key: "D%P15", label: "D%P15" },
      { key: "TDPG", label: "TDPG" },
      { key: "EGPM", label: "EGPM" },
      { key: "GOLD%", label: "GOLD%" },
      { key: "STL", label: "STL" },
      { key: "WPM", label: "WPM" },
      { key: "CWPM", label: "CWPM" },
      { key: "WCPM", label: "WCPM" },
      { key: "Avg kills", label: "Avg kills" },
      { key: "Avg deaths", label: "Avg deaths" },
      { key: "Avg assists", label: "Avg assists" },
      { key: "CSM", label: "CSM" },
      { key: "VS%", label: "VS%" },
      { key: "VSPM", label: "VSPM" },
      { key: "Avg WPM", label: "Avg WPM" },
      { key: "Avg WCPM", label: "Avg WCPM" },
      { key: "Avg VWPM", label: "Avg VWPM" },
      { key: "GD15", label: "GD@15" },
      { key: "CSD15", label: "CSD@15" },
      { key: "XPD15", label: "XPD@15" },
      { key: "Penta Kills", label: "Penta Kills" },
      { key: "Solo Kills", label: "Solo Kills" },
    ];

    // Calculate percentiles for each metric
    const percentiles: Record<string, PercentileResult | null> = {};

    for (const metric of allCsvMetrics) {
      const key = metric.key;
      // Map metric key to database field
      const dbField = mapMetricToDbField(key);
      const value = player.proStats[dbField as keyof typeof player.proStats];

      if (value !== null && value !== undefined && value !== "") {
        percentiles[key] = calculatePercentile(
          value as number,
          key,
          player.role,
          allPlayersData,
          player.league
        );
      } else {
        percentiles[key] = null;
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
      percentiles,
    }, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=86400" }
    });
  } catch (error) {
    logger.error("Error calculating percentiles", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to calculate percentiles" },
      { status: 500 }
    );
  }
}

/**
 * Map metric keys from radar-metrics to database fields
 */
function mapMetricToDbField(metricKey: string): string {
  const map: Record<string, string> = {
    "W%": "winRate",
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

  return map[metricKey] || metricKey;
}
