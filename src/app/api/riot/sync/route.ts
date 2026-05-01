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
  // Check Riot API key is configured
  if (!process.env.RIOT_API_KEY) {
    return NextResponse.json(
      { error: "Riot API key is not configured. Please set RIOT_API_KEY in environment variables." },
      { status: 503 }
    );
  }

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

    logger.info("[Riot Sync] Player found:", { id: player.id, riotId: player.riotId, riotPuuid: player.riotPuuid, opggUrl: player.opggUrl });

    // Try to get PUUID from player record
    let puuid = player.riotPuuid;
    let summonerId: string | null = null;
    let lookupMethod = "stored";

    // If no PUUID, try riotId field (format: gameName#tagLine)
    if (!puuid && player.riotId) {
      const hashIndex = player.riotId.lastIndexOf("#");
      if (hashIndex > 0) {
        const gameName = player.riotId.slice(0, hashIndex).trim();
        const tagLine = player.riotId.slice(hashIndex + 1).trim();
        logger.info("[Riot Sync] Looking up by Riot ID:", { gameName, tagLine });
        const account = await getAccountByRiotId(gameName, tagLine);
        if (account) {
          puuid = account.puuid;
          lookupMethod = "riotId";
        } else {
          logger.info("[Riot Sync] Account not found for Riot ID:", { gameName, tagLine });
        }
      }
    }

    // Fallback: try to derive from opggUrl
    if (!puuid && player.opggUrl) {
      // Support multiple op.gg URL formats:
      // https://op.gg/summoners/euw/GameName-TagLine
      // https://op.gg/fr/lol/summoners/euw/GameName-TagLine
      // https://www.op.gg/summoners/euw/GameName-TagLine
      const match = player.opggUrl.match(/summoners\/([\w-]+)\/([^/?#]+)/);
      if (match) {
        const region = match[1];
        const riotIdFromUrl = decodeURIComponent(match[2]);
        const lastDash = riotIdFromUrl.lastIndexOf("-");
        if (lastDash > 0) {
          const gameName = riotIdFromUrl.slice(0, lastDash);
          const tagLine = riotIdFromUrl.slice(lastDash + 1);
          logger.info("[Riot Sync] Looking up by op.gg URL:", { region, gameName, tagLine, raw: riotIdFromUrl });
          const account = await getAccountByRiotId(gameName, tagLine);
          if (account) {
            puuid = account.puuid;
            lookupMethod = "opgg";
          } else {
            logger.info("[Riot Sync] Account not found for op.gg derived Riot ID:", { gameName, tagLine });
          }
        }
      } else {
        logger.info("[Riot Sync] Could not parse op.gg URL", { opggUrl: player.opggUrl });
      }
    }

    if (!puuid) {
      const reasons: string[] = [];
      if (!player.riotId && !player.opggUrl && !player.riotPuuid) {
        reasons.push("No Riot ID, op.gg URL, or stored PUUID found for this player.");
      } else {
        if (player.riotId) reasons.push(`Riot ID '${player.riotId}' not found on Riot servers.`);
        if (player.opggUrl) reasons.push(`Could not resolve account from op.gg URL.`);
        if (player.riotPuuid) reasons.push(`Stored PUUID is invalid or expired.`);
      }
      return NextResponse.json(
        {
          error: "No Riot PUUID found for player.",
          details: reasons.join(" ") + " Please check the Riot ID format (gameName#tagLine) or verify the op.gg URL.",
        },
        { status: 400 }
      );
    }

    logger.info("[Riot Sync] PUUID resolved via", { lookupMethod, puuid });

    // Update player with PUUID if we just found it
    if (!player.riotPuuid && puuid) {
      await db.player.update({
        where: { id: playerId },
        data: { riotPuuid: puuid },
      });
    }

    // Get summoner info
    const summoner = await getSummonerByPuuid(puuid);
    logger.info("[Riot Sync] Summoner", summoner ? { id: summoner.id, level: summoner.summonerLevel } : {});
    if (!summoner) {
      return NextResponse.json(
        { error: "Summoner not found" },
        { status: 404 }
      );
    }
    summonerId = summoner.id;

    // Get ranked stats (try by-puuid first, fallback to by-summoner)
    let entries = await getLeagueEntriesByPuuid(puuid);
    logger.info("[Riot Sync] League entries by PUUID", { entries });
    if (!entries || entries.length === 0) {
      entries = await getLeagueEntries(summonerId);
      logger.info("[Riot Sync] League entries by summonerId", { entries });
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

