import { db } from "../src/lib/server/db";
import { LEAGUE_TIERS } from "../src/lib/constants";

async function main() {
  console.log("Migrating existing players...");

  const players = await db.player.findMany({
    select: { id: true, pseudo: true, league: true, role: true, tier: true },
  });

  let updated = 0;
  for (const player of players) {
    const leagueInfo = LEAGUE_TIERS[player.league.toUpperCase()];
    const leagueTier = leagueInfo ? String(leagueInfo.tier) : null;

    const newRole = player.role === "MIDDLE" ? "MID" : player.role;

    if (leagueTier !== player.tier || newRole !== player.role) {
      await db.player.update({
        where: { id: player.id },
        data: {
          tier: leagueTier,
          role: newRole,
        },
      });
      console.log(`Updated ${player.pseudo}: tier=${leagueTier}, role=${newRole}`);
      updated++;
    }
  }

  console.log(`\nMigration complete. ${updated} players updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
