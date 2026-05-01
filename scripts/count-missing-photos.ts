import { db } from "../src/lib/server/db";

const prisma = db;

async function main() {
  const totalPlayers = await prisma.player.count();
  
  const missingPhotos = await prisma.player.count({
    where: {
      OR: [
        { photoUrl: null },
        { photoUrl: "" },
      ],
    },
  });

  const withPhotos = totalPlayers - missingPhotos;

  console.log(`\n=== PHOTO STATS ===`);
  console.log(`Total players: ${totalPlayers}`);
  console.log(`With photos:   ${withPhotos} (${((withPhotos / totalPlayers) * 100).toFixed(1)}%)`);
  console.log(`Missing photos: ${missingPhotos} (${((missingPhotos / totalPlayers) * 100).toFixed(1)}%)`);

  // By league
  console.log(`\n=== MISSING PHOTOS BY LEAGUE ===`);
  const byLeague = await prisma.player.groupBy({
    by: ["league"],
    where: {
      OR: [
        { photoUrl: null },
        { photoUrl: "" },
      ],
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  for (const row of byLeague) {
    const totalInLeague = await prisma.player.count({ where: { league: row.league } });
    const pct = ((row._count.id / totalInLeague) * 100).toFixed(1);
    console.log(`${String(row.league || "NO_LEAGUE").padEnd(10)}: ${String(row._count.id).padStart(4)} / ${String(totalInLeague).padStart(4)} (${pct}%)`);
  }

  // Show some examples
  console.log(`\n=== EXAMPLES OF PLAYERS WITHOUT PHOTOS ===`);
  const examples = await prisma.player.findMany({
    where: {
      OR: [
        { photoUrl: null },
        { photoUrl: "" },
      ],
    },
    take: 30,
    select: { pseudo: true, league: true, currentTeam: true },
  });
  for (const p of examples) {
    console.log(`  ${p.pseudo} (${p.league || "?"}, ${p.currentTeam || "?"})`);
  }

  await prisma.$disconnect();
}

main();
