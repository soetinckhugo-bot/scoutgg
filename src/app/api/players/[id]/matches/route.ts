import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import {
  getSummonerByPuuid,
  getMatchIds,
  getMatch,
  type RiotMatch,
} from "@/lib/server/riot-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const player = await db.player.findUnique({
      where: { id },
      select: { pseudo: true, riotPuuid: true },
    });

    if (!player || !player.riotPuuid) {
      return NextResponse.json(
        { error: "Player has no Riot PUUID configured" },
        { status: 404 }
      );
    }

    const summoner = await getSummonerByPuuid(player.riotPuuid);
    if (!summoner) {
      return NextResponse.json(
        { error: "Summoner not found" },
        { status: 404 }
      );
    }

    const matchIds = await getMatchIds(player.riotPuuid, 20);
    const matches: RiotMatch[] = [];
    for (const matchId of matchIds) {
      const match = await getMatch(matchId);
      if (match) matches.push(match);
    }

    // Extract player-specific data from each match
    const playerMatches = matches.map((match) => {
      const participant = match.info.participants.find(
        (p) => p.puuid === player.riotPuuid
      );
      if (!participant) return null;

      const durationMinutes = Math.floor(match.info.gameDuration / 60);
      const kda =
        participant.deaths > 0
          ? (participant.kills + participant.assists) / participant.deaths
          : participant.kills + participant.assists;

      return {
        matchId: match.metadata.matchId,
        gameCreation: match.info.gameCreation,
        gameDuration: durationMinutes,
        championName: participant.championName,
        teamPosition: participant.teamPosition,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        kda: Math.round(kda * 100) / 100,
        win: participant.win,
        cs: participant.totalMinionsKilled + (participant.neutralMinionsKilled || 0),
        cspm:
          durationMinutes > 0
            ? Math.round(
                ((participant.totalMinionsKilled +
                  (participant.neutralMinionsKilled || 0)) /
                  durationMinutes) *
                  10
              ) / 10
            : 0,
        goldEarned: participant.goldEarned,
        gpm:
          durationMinutes > 0
            ? Math.round((participant.goldEarned / durationMinutes) * 10) / 10
            : 0,
        damageDealt: participant.totalDamageDealtToChampions,
        visionScore: participant.visionScore,
        wardsPlaced: participant.wardsPlaced,
        wardsKilled: participant.wardsKilled,
      };
    });

    return NextResponse.json({
      matches: playerMatches.filter(Boolean),
      total: playerMatches.length,
    });
  } catch (error: any) {
    console.error("Match history error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch match history" },
      { status: 500 }
    );
  }
}
