import { db } from "@/lib/server/db";
import { calculateScores, type PlayerData } from "@/lib/scoring";
import { logger } from "@/lib/logger";

export interface RecalculateResult {
  recalculated: number;
  totalPlayers: number;
}

/**
 * Recalculate scores for all ProStats (or up to `limit` records).
 * Percentiles are computed within each (role, league) group using the full DB pool.
 */
export async function recalculateAllScores(limit?: number): Promise<RecalculateResult> {
  const proStatsList = await db.proStats.findMany({
    take: limit,
    include: { player: true },
  });

  if (proStatsList.length === 0) {
    return { recalculated: 0, totalPlayers: 0 };
  }

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

  const groups = new Map<string, PlayerData[]>();
  for (const pd of allPlayerData) {
    const key = `${pd.role}|${pd.league}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(pd);
  }

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

  logger.info("Recalculated scores", { recalculated: updatedCount, totalPlayers: proStatsList.length });

  return { recalculated: updatedCount, totalPlayers: proStatsList.length };
}
