import { db } from "../src/lib/server/db";

const prisma = db;

async function main() {
  // Step 1: Remove Road Of Legends residue from RL (wrong teams)
  const roadOfLegendsTeams = ["MCon esports", "Magaza Esports"];
  const residue = await prisma.player.findMany({
    where: { league: "RL", currentTeam: { in: roadOfLegendsTeams } },
    select: { id: true, pseudo: true, currentTeam: true },
  });

  console.log(`Step 1: Removing ${residue.length} Road Of Legends residue from RL`);
  for (const p of residue) {
    console.log(`  ${p.pseudo} (${p.currentTeam})`);
  }

  if (residue.length > 0) {
    const result = await prisma.player.deleteMany({
      where: { id: { in: residue.map((p) => p.id) } },
    });
    console.log(`  ✅ Deleted ${result.count}`);
  }

  // Step 2: Find internal duplicates in RL (same pseudo, same or similar team)
  const rlPlayers = await prisma.player.findMany({
    where: { league: "RL" },
    select: { id: true, pseudo: true, currentTeam: true, createdAt: true },
    orderBy: { pseudo: "asc" },
  });

  const seen = new Map<string, { id: string; team: string | null; createdAt: Date }[]>();
  for (const p of rlPlayers) {
    const key = p.pseudo.toLowerCase();
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push({ id: p.id, team: p.currentTeam, createdAt: p.createdAt });
  }

  const duplicates = [...seen.entries()].filter(([_, list]) => list.length > 1);
  console.log(`\nStep 2: Found ${duplicates.length} internal duplicates in RL`);

  const idsToDelete: string[] = [];
  for (const [name, list] of duplicates) {
    console.log(`  ${name}: ${list.length} copies`);
    // Keep the first one (oldest), delete the rest
    const sorted = list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    console.log(`    Keeping: ${sorted[0].id} (created ${sorted[0].createdAt.toISOString()})`);
    for (let i = 1; i < sorted.length; i++) {
      console.log(`    Deleting: ${sorted[i].id} (created ${sorted[i].createdAt.toISOString()})`);
      idsToDelete.push(sorted[i].id);
    }
  }

  if (idsToDelete.length > 0) {
    const result = await prisma.player.deleteMany({
      where: { id: { in: idsToDelete } },
    });
    console.log(`  ✅ Deleted ${result.count} duplicates`);
  }

  // Step 3: Verify
  const final = {
    ROL: await prisma.player.count({ where: { league: "ROL" } }),
    RL: await prisma.player.count({ where: { league: "RL" } }),
  };

  console.log(`\n=== FINAL STATE ===`);
  console.log(`ROL (Road Of Legends): ${final.ROL}`);
  console.log(`RL  (Rift Legends):    ${final.RL}`);

  const total = await prisma.player.count();
  const missing = await prisma.player.count({
    where: { OR: [{ photoUrl: null }, { photoUrl: "" }] },
  });
  console.log(`\nTotal players:  ${total}`);
  console.log(`With photos:    ${total - missing} (${(((total - missing) / total) * 100).toFixed(1)}%)`);
  console.log(`Missing photos: ${missing} (${((missing / total) * 100).toFixed(1)}%)`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
