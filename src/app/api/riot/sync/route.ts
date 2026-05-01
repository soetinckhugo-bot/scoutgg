import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";
import { requireAdmin } from "@/lib/server/auth";
import {
  getAccountByRiotId,
  getSummonerByPuuid,
  getLeagueEntries,
  getLeagueEntriesByPuuid,
  getMatchIds,
  getMatches,
  computeSoloqStats,
} from "@/lib/server/riot-api";
import { RiotSyncSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";

/**
 * POST /api/riot/sync
 * Sync SoloQ stats for a player from Riot API
 * Body: { playerId: string }
 *
 * Requires the player to have riotPuuid OR we derive it from opggUrl
 * Admin only to prevent abuse of Riot API quota
 */
export async function POST(request: NextRequest) {
  // Admin-only to protect Riot API quota
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  // Rate limit: 5 requests per minute per IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(`riot-sync:${ip}`, 5, 60 * 1000);

  if (!limit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  try {
    const json = await request.json();
    const parsed = RiotSyncSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { playerId } = parsed.data;

    const player = await db.player.findUnique({
      where: { id: playerId },
      include: { soloqStats: true },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    console.log("[Riot Sync] Player found:", { id: player.id, riotId: player.riotId, riotPuuid: player.riotPuuid, opggUrl: player.opggUrl });

    // Try to get PUUID from player record
    let puuid = player.riotPuuid;
    let summonerId: string | null = null;

    // If no PUUID, try riotId field (format: gameName#tagLine)
    if (!puuid && player.riotId) {
      const [gameName, tagLine] = player.riotId.split("#");
      if (gameName && tagLine) {
        const account = await getAccountByRiotId(gameName.trim(), tagLine.trim());
        if (account) {
          puuid = account.puuid;
        }
      }
    }

    // Fallback: try to derive from opggUrl
    if (!puuid && player.opggUrl) {
      const match = player.opggUrl.match(/summoners\/\w+\/([^/]+)/);
      if (match) {
        const riotIdFromUrl = decodeURIComponent(match[1]);
        const [gameName, tagLine] = riotIdFromUrl.split("-");
        if (gameName && tagLine) {
          const account = await getAccountByRiotId(gameName, tagLine);
          if (account) {
            puuid = account.puuid;
          }
        }
      }
    }

    if (!puuid) {
      return NextResponse.json(
        {
          error:
            "No Riot PUUID found for player. Please set riotId (gameName#tagLine) or opggUrl.",
        },
        { status: 400 }
      );
    }

    // Update player with PUUID if we just found it
    if (!player.riotPuuid && puuid) {
      await db.player.update({
        where: { id: playerId },
        data: { riotPuuid: puuid },
      });
    }

    // Get summoner info
    const summoner = await getSummonerByPuuid(puuid);
    console.log("[Riot Sync] Summoner:", summoner ? { id: summoner.id, level: summoner.summonerLevel } : null);
    if (!summoner) {
      return NextResponse.json(
        { error: "Summoner not found" },
        { status: 404 }
      );
    }
    summonerId = summoner.id;

    // Get ranked stats (try by-puuid first, fallback to by-summoner)
    let entries = await getLeagueEntriesByPuuid(puuid);
    console.log("[Riot Sync] League entries by PUUID:", entries);
    if (!entries || entries.length === 0) {
      entries = await getLeagueEntries(summonerId);
      console.log("[Riot Sync] League entries by summonerId:", entries);
    }
    const ranked = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");

    // Get recent matches
    const matchIds = await getMatchIds(puuid, 20);
    const matches = await getMatches(matchIds);
    const recentStats =
      matches.length > 0 ? computeSoloqStats(matches, puuid) : null;

    // Format rank string
    const currentRank = ranked
      ? `${ranked.tier} ${ranked.rank} (${ranked.leaguePoints} LP)`
      : "Unranked";

    const peakLp = ranked ? ranked.leaguePoints : 0;
    
    // Use season winrate from League API (wins/losses) instead of last 20 games
    const seasonGames = ranked ? ranked.wins + ranked.losses : 0;
    const seasonWinrate = ranked && seasonGames > 0 ? ranked.wins / seasonGames : 0;
    
    const winrate = seasonWinrate;
    const totalGames = seasonGames;
    const championPool = recentStats?.championPool || "";

    // Upsert SoloqStats
    const soloqStats = await db.soloqStats.upsert({
      where: { playerId },
      create: {
        playerId,
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

    return NextResponse.json({
      success: true,
      data: {
        soloqStats,
        summonerLevel: summoner.summonerLevel,
        profileIconId: summoner.profileIconId,
        ranked,
        recentMatches: matches.length,
      },
    });
  } catch (error: any) {
    logger.error("Riot sync error:", { error });
    return NextResponse.json(
      { error: error.message || "Failed to sync stats" },
      { status: 500 }
    );
  }
}

