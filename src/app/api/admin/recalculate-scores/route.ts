import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { calculateScores, type PlayerData } from "@/lib/scoring";
import { requireAdmin } from "@/lib/server/auth";
import { logger } from "@/lib/logger";

export async function POST() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    // Fetch all ProStats with their players
    const proStatsList = await db.proStats.findMany({
      include: { player: true },
    });

    if (proStatsList.length === 0) {
      return NextResponse.json({
        success: true,
        recalculated: 0,
        message: "No pro stats found",
      });
    }

    // Build PlayerData for all (needed for percentile calculation)
    const allPlayerData: PlayerData[] = proStatsList.map((ps) => {
      const { id: _proId, playerId, player, ...stats } = ps;
      return {
        id: player.id,
        pseudo: player.pseudo,
        role: player.role,
        league: player.league,
        ...stats,
      };
    });

    // Group by (role, league) — percentiles are calculated within same-role + same-league
    const groups = new Map<string, PlayerData[]>();
    for (const pd of allPlayerData) {
      const key = `${pd.role}|${pd.league}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(pd);
    }

    // Calculate new scores for each player
    const updates: {
      playerId: string;
      globalScore: number;
      tierScore: number;
      rawScore: number;
      tier: string;
    }[] = [];

    for (const ps of proStatsList) {
      const groupKey = `${ps.player.role}|${ps.player.league}`;
      const groupPlayers = groups.get(groupKey) || [];

      if (groupPlayers.length === 0) continue;

      const result = calculateScores(
        { role: ps.player.role, league: ps.player.league, ...ps },
        groupPlayers
      );

      updates.push({
        playerId: ps.playerId,
        globalScore: result.globalScore,
        tierScore: result.tierScore,
        rawScore: result.rawScore,
        tier: result.tier,
      });
    }

    // Batch update ProStats + Player.tier
    const BATCH_SIZE = 20;
    let updatedCount = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);

      await db.$transaction(
        batch.map((u) =>
          db.proStats.update({
            where: { playerId: u.playerId },
            data: {
              globalScore: u.globalScore,
              tierScore: u.tierScore,
              rawScore: u.rawScore,
              tier: u.tier,
            },
          })
        )
      );

      // Also update Player.tier
      await db.$transaction(
        batch.map((u) =>
          db.player.update({
            where: { id: u.playerId },
            data: { tier: u.tier.replace("TIER_", "") },
          })
        )
      );

      updatedCount += batch.length;
    }

    return NextResponse.json({
      success: true,
      recalculated: updatedCount,
      totalPlayers: proStatsList.length,
    });
  } catch (error: any) {
    logger.error("Recalculate scores error:", { error });
    return NextResponse.json(
      { error: error.message || "Failed to recalculate scores" },
      { status: 500 }
    );
  }
}
