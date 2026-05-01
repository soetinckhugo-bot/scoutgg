import { db } from "../src/lib/server/db";

const prisma = db;

async function main() {
  // Count ROL players
  const rolCount = await prisma.player.count({ where: { league: "ROL" } });
  console.log(`Found ${rolCount} players with league="ROL"`);

  if (rolCount === 0) {
    console.log("Nothing to fix.");
    return;
  }

  // Show some examples before deleting
  const examples = await prisma.player.findMany({
    where: { league: "ROL" },
    take: 10,
    select: { pseudo: true, currentTeam: true, photoUrl: true },
  });
  console.log("\nExamples:");
  for (const p of examples) {
    console.log(`  ${p.pseudo} (${p.currentTeam}) - photo: ${p.photoUrl ? "yes" : "no"}`);
  }

  // Check if any ROL players are referenced by other tables
  const rolIds = await prisma.player.findMany({
    where: { league: "ROL" },
    select: { id: true },
  });
  const ids = rolIds.map((p) => p.id);

  const hasFavorites = await prisma.favorite.count({ where: { playerId: { in: ids } } });
  const hasLists = await prisma.playerListItem.count({ where: { playerId: { in: ids } } });
  const hasRatings = await prisma.playerRating.count({ where: { playerId: { in: ids } } });
  const hasReports = await prisma.report.count({ where: { playerId: { in: ids } } });
  const hasProMatches = await prisma.proMatch.count({ where: { playerId: { in: ids } } });
  const hasProStats = await prisma.proStats.count({ where: { playerId: { in: ids } } });
  const hasSoloq = await prisma.soloqStats.count({ where: { playerId: { in: ids } } });

  console.log("\nReferences found:");
  console.log(`  Favorites:     ${hasFavorites}`);
  console.log(`  List items:    ${hasLists}`);
  console.log(`  Ratings:       ${hasRatings}`);
  console.log(`  Reports:       ${hasReports}`);
  console.log(`  ProMatches:    ${hasProMatches}`);
  console.log(`  ProStats:      ${hasProStats}`);
  console.log(`  SoloqStats:    ${hasSoloq}`);

  if (hasFavorites + hasLists + hasRatings + hasReports + hasProMatches + hasProStats + hasSoloq > 0) {
    console.log("\n⚠️  Some ROL players have references. Deleting them anyway (cascade should handle it)...");
  }

  // Delete ROL players
  const result = await prisma.player.deleteMany({
    where: { league: "ROL" },
  });

  console.log(`\n✅ Deleted ${result.count} ROL players.`);

  // Verify
  const remaining = await prisma.player.count({ where: { league: "ROL" } });
  console.log(`Remaining ROL players: ${remaining}`);

  // New totals
  const total = await prisma.player.count();
  const missing = await prisma.player.count({
    where: { OR: [{ photoUrl: null }, { photoUrl: "" }] },
  });
  console.log(`\n=== AFTER CLEANUP ===`);
  console.log(`Total players:  ${total}`);
  console.log(`With photos:    ${total - missing} (${(((total - missing) / total) * 100).toFixed(1)}%)`);
  console.log(`Missing photos: ${missing} (${((missing / total) * 100).toFixed(1)}%)`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
