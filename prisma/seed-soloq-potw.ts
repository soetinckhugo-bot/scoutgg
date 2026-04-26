import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SoloQ Player of the Week placeholder...\n");

  // Find a player to use as placeholder
  const player = await prisma.player.findFirst({
    where: { isProspect: true },
    orderBy: { prospectScore: "desc" },
  });

  if (!player) {
    console.log("No prospect player found. Skipping SoloQ POTW seed.");
    return;
  }

  const now = new Date();
  const week = getWeekNumber(now);
  const year = now.getFullYear();

  const existing = await prisma.soloqPOTW.findUnique({
    where: { week_year: { week, year } },
  });

  if (existing) {
    console.log(`Week ${week} ${year} already exists. Updating...`);
    await prisma.soloqPOTW.update({
      where: { id: existing.id },
      data: {
        playerId: player.id,
        lpGain: 350,
        winrate: 0.68,
        gamesPlayed: 42,
        reason: "PLACEHOLDER: Climbed from GM 200 LP to Challenger 1100 LP in 4 days. Dominant performance on Azir and Sylas. Replace this with real data.",
        isActive: true,
      },
    });
  } else {
    console.log(`Creating Week ${week} ${year} SoloQ POTW...`);
    await prisma.soloqPOTW.create({
      data: {
        playerId: player.id,
        week,
        year,
        lpGain: 350,
        winrate: 0.68,
        gamesPlayed: 42,
        reason: "PLACEHOLDER: Climbed from GM 200 LP to Challenger 1100 LP in 4 days. Dominant performance on Azir and Sylas. Replace this with real data.",
        isActive: true,
      },
    });
  }

  console.log(`\n✅ SoloQ POTW placeholder seeded for ${player.pseudo}.`);
  console.log(`   Week: ${week}, Year: ${year}`);
  console.log(`   LP Gain: +350, WR: 68%, Games: 42`);
  console.log(`\n📝 Go to /admin → SoloQ POTW tab to edit this entry.`);
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
