import { db } from "../src/lib/server/db";

const prisma = db;

async function main() {
  // Step 1: Rename RIFT -> RL (Rift Legends)
  const riftCount = await prisma.player.count({ where: { league: "RIFT" } });
  console.log(`Step 1: Renaming ${riftCount} players from RIFT -> RL (Rift Legends)`);
  
  if (riftCount > 0) {
    await prisma.player.updateMany({
      where: { league: "RIFT" },
      data: { league: "RL" },
    });
    console.log(`  ✅ ${riftCount} players renamed to RL`);
  }

  // Step 2: Delete old RL players (Road Of Legends doublons)
  // These were imported earlier with code "RL" but they're actually Road Of Legends
  // We need to find players with league="RL" that are NOT the Rift Legends ones we just renamed
  // Actually, let's check: after step 1, all RL players are Rift Legends
  // The old Road Of Legends doublons are still there under... wait.
  
  // Let me check what's in RL now
  const rlAfterRename = await prisma.player.count({ where: { league: "RL" } });
  console.log(`\nRL players after rename: ${rlAfterRename}`);

  // Check if there are still old RL Road Of Legends players
  // They would have been there BEFORE the rename
  // Actually the rename only affected RIFT->RL, not the existing RL
  // So existing RL (Road Of Legends) + renamed RIFT (Rift Legends) are now both under RL
  
  // We need to identify which RL players are Road Of Legends vs Rift Legends
  // The Rift Legends ones were originally under RIFT, so they have IDs that were created during the Rift import
  // But that's hard to track. Let's instead:
  // 1. Find all RL players and check which teams they belong to
  
  const rlPlayers = await prisma.player.findMany({
    where: { league: "RL" },
    select: { id: true, pseudo: true, currentTeam: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`\nAll RL players (${rlPlayers.length}):`);
  for (const p of rlPlayers.slice(0, 20)) {
    console.log(`  ${p.pseudo} (${p.currentTeam || "?"}) - created ${p.createdAt.toISOString()}`);
  }

  // Rift Legends teams: Agresivoo, mikusik, Tenshi, Woolite, Jactroll, etc.
  // Road Of Legends teams: Dynasty, Frites, mCon, Myth, Once Upon A Team, Senshi, The Bandits, ZennIT
  
  const roadOfLegendsTeams = [
    "Dynasty", "Frites Esports Club", "mCon esports", "Myth Esports",
    "Once Upon A Team", "Senshi eSports", "The Bandits", "ZennIT",
    "Senshi eSports (Benelux Team)"
  ];

  const riftLegendsTeams = [
    "Barcząca Esports", "Bomba Team", "devils.one", "DOCISK",
    "Forsaken", "LODIS", "Onion Team", "Orbit Anonymo Esports"
  ];

  // Find RL players that are actually Road Of Legends (wrong code)
  const roadOfLegendsInRL = rlPlayers.filter(p => 
    roadOfLegendsTeams.some(t => p.currentTeam?.includes(t))
  );

  const riftLegendsInRL = rlPlayers.filter(p => 
    riftLegendsTeams.some(t => p.currentTeam?.includes(t))
  );

  console.log(`\nRoad Of Legends players wrongly in RL: ${roadOfLegendsInRL.length}`);
  console.log(`Rift Legends players correctly in RL: ${riftLegendsInRL.length}`);

  // Step 3: Delete the wrongly-coded Road Of Legends players from RL
  if (roadOfLegendsInRL.length > 0) {
    const idsToDelete = roadOfLegendsInRL.map(p => p.id);
    console.log(`\nStep 3: Deleting ${idsToDelete.length} Road Of Legends doublons from RL...`);
    
    // Check references
    const hasFav = await prisma.favorite.count({ where: { playerId: { in: idsToDelete } } });
    const hasLists = await prisma.playerListItem.count({ where: { playerId: { in: idsToDelete } } });
    const hasRatings = await prisma.playerRating.count({ where: { playerId: { in: idsToDelete } } });
    const hasReports = await prisma.report.count({ where: { playerId: { in: idsToDelete } } });
    
    console.log(`  References: fav=${hasFav} lists=${hasLists} ratings=${hasRatings} reports=${hasReports}`);

    const result = await prisma.player.deleteMany({
      where: { id: { in: idsToDelete } },
    });
    console.log(`  ✅ Deleted ${result.count} doublons`);
  }

  // Step 4: Verify final state
  const final = {
    ROL: await prisma.player.count({ where: { league: "ROL" } }),
    RL: await prisma.player.count({ where: { league: "RL" } }),
    RIFT: await prisma.player.count({ where: { league: "RIFT" } }),
  };

  console.log(`\n=== FINAL STATE ===`);
  console.log(`ROL (Road Of Legends): ${final.ROL}`);
  console.log(`RL  (Rift Legends):    ${final.RL}`);
  console.log(`RIFT (should be 0):    ${final.RIFT}`);

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
