import { db } from "../src/lib/server/db";

const prisma = db;

async function main() {
  const rol = await prisma.player.findMany({ where: { league: "ROL" }, select: { pseudo: true } });
  const rl = await prisma.player.findMany({ where: { league: "RL" }, select: { pseudo: true } });

  const rolNames = new Set(rol.map((p) => p.pseudo.toLowerCase()));
  const rlNames = new Set(rl.map((p) => p.pseudo.toLowerCase()));

  const dupes = [...rolNames].filter((n) => rlNames.has(n));
  console.log("Doublons ROL/RL:", dupes.length);
  if (dupes.length > 0) {
    for (const name of dupes) {
      const p1 = await prisma.player.findFirst({
        where: { league: "ROL", pseudo: name },
        select: { pseudo: true, currentTeam: true, photoUrl: true },
      });
      const p2 = await prisma.player.findFirst({
        where: { league: "RL", pseudo: name },
        select: { pseudo: true, currentTeam: true, photoUrl: true },
      });
      console.log("  " + name + ":");
      console.log("    ROL: " + (p1?.currentTeam || "?") + " | photo: " + (p1?.photoUrl ? "yes" : "no"));
      console.log("    RL:  " + (p2?.currentTeam || "?") + " | photo: " + (p2?.photoUrl ? "yes" : "no"));
    }
  }

  // Check RL teams
  const rlPlayers = await prisma.player.findMany({
    where: { league: "RL" },
    select: { pseudo: true, currentTeam: true },
    orderBy: { currentTeam: "asc" },
  });

  console.log("\nRL players by team:");
  const teams: Record<string, string[]> = {};
  for (const p of rlPlayers) {
    const t = p.currentTeam || "NO_TEAM";
    if (!teams[t]) teams[t] = [];
    teams[t].push(p.pseudo);
  }
  for (const [team, players] of Object.entries(teams)) {
    console.log(`  ${team}: ${players.join(", ")}`);
  }

  await prisma.$disconnect();
}

main();
