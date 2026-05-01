import { PrismaClient } from "@prisma/client";
import { calculateScores, type PlayerData } from "../src/lib/scoring";

const db = new PrismaClient();

async function main() {
  console.log("Fetching all pro stats...");

  const proStatsList = await db.proStats.findMany({
    include: { player: true },
  });

  if (proStatsList.length === 0) {
    console.log("No pro stats found.");
    return;
  }

  console.log(`Found ${proStatsList.length} players with pro stats.`);

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

  // Group by (role, league)
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

  console.log(`Recalculating ${updates.length} players...`);

  // Batch update
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
    console.log(`  → ${updatedCount}/${updates.length} done`);
  }

  console.log(`\n✅ Done! ${updatedCount} players recalculated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
