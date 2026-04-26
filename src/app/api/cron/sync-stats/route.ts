import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import {
  getSummonerByPuuid,
  getLeagueEntries,
  getMatchIds,
  getMatches,
  computeSoloqStats,
} from "@/lib/server/riot-api";

interface SyncResult {
  playerId: string;
  pseudo: string;
  success: boolean;
  error?: string;
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
}

async function syncPlayer(player: {
  id: string;
  pseudo: string;
  riotPuuid: string | null;
}): Promise<SyncResult> {
  if (!player.riotPuuid) {
    return {
      playerId: player.id,
      pseudo: player.pseudo,
      success: false,
      error: "No riotPuuid",
    };
  }

  try {
    const summoner = await getSummonerByPuuid(player.riotPuuid);
    if (!summoner) {
      return {
        playerId: player.id,
        pseudo: player.pseudo,
        success: false,
        error: "Summoner not found",
      };
    }

    const entries = await getLeagueEntries(summoner.id);
    const ranked = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");

    const matchIds = await getMatchIds(player.riotPuuid, 20);
    const matches = await getMatches(matchIds);
    const recentStats =
      matches.length > 0 ? computeSoloqStats(matches, player.riotPuuid) : null;

    const currentRank = ranked
      ? `${ranked.tier} ${ranked.rank} (${ranked.leaguePoints} LP)`
      : "Unranked";

    const peakLp = ranked ? ranked.leaguePoints : 0;
    const winrate = recentStats?.winrate || 0;
    const totalGames = recentStats?.totalGames || 0;
    const championPool = recentStats?.championPool || "";

    await db.soloqStats.upsert({
      where: { playerId: player.id },
      create: {
        playerId: player.id,
        currentRank,
        peakLp,
        winrate,
        totalGames,
        championPool,
      },
      update: {
        currentRank,
        peakLp,
        winrate,
        totalGames,
        championPool,
      },
    });

    // Store weekly snapshot for historical tracking
    const now = new Date();
    const week = getISOWeek(now);
    const year = now.getFullYear();

    await db.statHistory.upsert({
      where: {
        playerId_week_year: {
          playerId: player.id,
          week,
          year,
        },
      },
      create: {
        playerId: player.id,
        week,
        year,
        peakLp,
        winrate,
        totalGames,
      },
      update: {
        peakLp,
        winrate,
        totalGames,
      },
    });

    return {
      playerId: player.id,
      pseudo: player.pseudo,
      success: true,
    };
  } catch (err: any) {
    console.error(`[Cron] Failed to sync ${player.pseudo}:`, err.message);
    return {
      playerId: player.id,
      pseudo: player.pseudo,
      success: false,
      error: err.message,
    };
  }
}

/**
 * POST /api/cron/sync-stats
 * Bulk sync SoloQ stats for all players with a riotPuuid.
 * Secured by CRON_SECRET header.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all players with a riotPuuid
    const players = await db.player.findMany({
      where: {
        riotPuuid: { not: null },
      },
      select: {
        id: true,
        pseudo: true,
        riotPuuid: true,
      },
    });

    console.log(`[Cron] Starting sync for ${players.length} players`);
    const startedAt = new Date().toISOString();

    // Sync all players
    const results: SyncResult[] = [];
    for (const player of players) {
      const result = await syncPlayer(player);
      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;
    const completedAt = new Date().toISOString();

    console.log(
      `[Cron] Sync complete: ${successCount} success, ${failCount} failed`
    );

    return NextResponse.json({
      success: true,
      summary: {
        total: players.length,
        success: successCount,
        failed: failCount,
        startedAt,
        completedAt,
      },
      results,
    });
  } catch (error: any) {
    console.error("[Cron] Sync error:", error);
    return NextResponse.json(
      { error: error.message || "Cron sync failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/sync-stats
 * Manual trigger for admins. Returns last sync info.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return count of players that can be synced
  const syncableCount = await db.player.count({
    where: { riotPuuid: { not: null } },
  });

  const totalPlayers = await db.player.count();

  return NextResponse.json({
    syncablePlayers: syncableCount,
    totalPlayers,
    missingRiotPuuid: totalPlayers - syncableCount,
    message: "Use POST with Bearer CRON_SECRET to trigger sync",
  });
}

