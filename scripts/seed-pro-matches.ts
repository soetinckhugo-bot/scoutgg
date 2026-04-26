/**
 * Seed script to add sample pro matches for testing
 * Data matches the LCK-style screenshot exactly
 * Ordered newest → oldest (Tristana first for 23/04 series)
 * Run with: npx tsx scripts/seed-pro-matches.ts
 */
import { db } from "../src/lib/server/db";

async function seed() {
  const player = await db.player.findFirst({
    where: { pseudo: "Space" },
  });

  if (!player) {
    console.log("Player 'Space' not found. Please create the player first.");
    process.exit(1);
  }

  console.log(`Found player: ${player.pseudo} (${player.id})`);

  await db.proMatch.deleteMany({
    where: { playerId: player.id },
  });

  // Match data from the LCK screenshot
  // Same-day matches: later timestamp = appears first with DESC order
  // So Tristana (game 3, latest) → Xayah (game 2) → Ezreal (game 1, earliest)
  const matches = [
    {
      matchDate: new Date("2026-04-23T22:00:00Z"), // latest = first
      champion: "Tristana",
      result: "WIN" as const,
      duration: "24:57",
      kda: "9/3/6",
      cs: null,
      cspm: 10.3,
      gold: null,
      gpm: null,
      damage: null,
      dpm: 1046,
      damagePercent: null,
      kpPercent: 45.5,
      visionScore: null,
      teamName: "OUAT",
      opponent: "MCON",
      tournament: "Road Of Legends 2026 Spring Split",
      patch: "15.8",
      items: JSON.stringify(["3153","3071","6333","3026","3006","0"]),
      summoner1: null,
      summoner2: null,
      keystoneRune: "8010",
      secondaryRune: "8200",
      side: "BLUE" as const,
    },
    {
      matchDate: new Date("2026-04-23T21:00:00Z"),
      champion: "Xayah",
      result: "WIN" as const,
      duration: "23:32",
      kda: "16/0/9",
      cs: null,
      cspm: 10.2,
      gold: null,
      gpm: null,
      damage: null,
      dpm: 1720,
      damagePercent: null,
      kpPercent: 69.4,
      visionScore: null,
      teamName: "OUAT",
      opponent: "MCON",
      tournament: "Road Of Legends 2026 Spring Split",
      patch: "15.8",
      items: JSON.stringify(["3031","3072","3046","3033","3006","0"]),
      summoner1: null,
      summoner2: null,
      keystoneRune: "8008",
      secondaryRune: "8100",
      side: "RED" as const,
    },
    {
      matchDate: new Date("2026-04-23T20:00:00Z"), // earliest = last
      champion: "Ezreal",
      result: "LOSS" as const,
      duration: "27:50",
      kda: "4/5/2",
      cs: null,
      cspm: 8.8,
      gold: null,
      gpm: null,
      damage: null,
      dpm: 565,
      damagePercent: null,
      kpPercent: 35.3,
      visionScore: null,
      teamName: "OUAT",
      opponent: "MCON",
      tournament: "Road Of Legends 2026 Spring Split",
      patch: "15.8",
      items: JSON.stringify(["3078","3042","3158","3124","0","0"]),
      summoner1: null,
      summoner2: null,
      keystoneRune: "8369",
      secondaryRune: "8200",
      side: "BLUE" as const,
    },
    {
      matchDate: new Date("2026-04-16T21:00:00Z"),
      champion: "Sivir",
      result: "LOSS" as const,
      duration: "24:01",
      kda: "5/5/4",
      cs: null,
      cspm: 7.9,
      gold: null,
      gpm: null,
      damage: null,
      dpm: 843,
      damagePercent: null,
      kpPercent: 60,
      visionScore: null,
      teamName: "OUAT",
      opponent: "The Bandits",
      tournament: "Road Of Legends 2026 Spring Split",
      patch: "15.7",
      items: JSON.stringify(["3031","3072","3046","3006","0","0"]),
      summoner1: null,
      summoner2: null,
      keystoneRune: "8008",
      secondaryRune: "8200",
      side: "RED" as const,
    },
    {
      matchDate: new Date("2026-04-16T20:00:00Z"),
      champion: "Yasuo",
      result: "LOSS" as const,
      duration: "25:28",
      kda: "1/6/5",
      cs: null,
      cspm: 7.4,
      gold: null,
      gpm: null,
      damage: null,
      dpm: 473,
      damagePercent: null,
      kpPercent: 54.5,
      visionScore: null,
      teamName: "OUAT",
      opponent: "The Bandits",
      tournament: "Road Of Legends 2026 Spring Split",
      patch: "15.7",
      items: JSON.stringify(["3031","6672","3006","0","0","0"]),
      summoner1: null,
      summoner2: null,
      keystoneRune: "8005",
      secondaryRune: "8400",
      side: "BLUE" as const,
    },
    {
      matchDate: new Date("2026-04-07T21:00:00Z"),
      champion: "Yasuo",
      result: "LOSS" as const,
      duration: "23:03",
      kda: "3/7/3",
      cs: null,
      cspm: 8.4,
      gold: null,
      gpm: null,
      damage: null,
      dpm: 357,
      damagePercent: null,
      kpPercent: 60,
      visionScore: null,
      teamName: "OUAT",
      opponent: "FEC",
      tournament: "Road Of Legends 2026 Spring Split",
      patch: "15.7",
      items: JSON.stringify(["3031","6672","3006","0","0","0"]),
      summoner1: null,
      summoner2: null,
      keystoneRune: "8010",
      secondaryRune: "8400",
      side: "RED" as const,
    },
    {
      matchDate: new Date("2026-04-07T20:00:00Z"),
      champion: "Ashe",
      result: "LOSS" as const,
      duration: "23:51",
      kda: "0/3/2",
      cs: null,
      cspm: 9.2,
      gold: null,
      gpm: null,
      damage: null,
      dpm: 504,
      damagePercent: null,
      kpPercent: 100,
      visionScore: null,
      teamName: "OUAT",
      opponent: "FEC",
      tournament: "Road Of Legends 2026 Spring Split",
      patch: "15.7",
      items: JSON.stringify(["3153","3091","3006","0","0","0"]),
      summoner1: null,
      summoner2: null,
      keystoneRune: "8008",
      secondaryRune: "8100",
      side: "BLUE" as const,
    },
    {
      matchDate: new Date("2026-04-02T21:00:00Z"),
      champion: "Ashe",
      result: "WIN" as const,
      duration: "25:45",
      kda: "9/2/15",
      cs: null,
      cspm: 7.7,
      gold: null,
      gpm: null,
      damage: null,
      dpm: 1427,
      damagePercent: null,
      kpPercent: 75,
      visionScore: null,
      teamName: "MYTH",
      opponent: "OUAT",
      tournament: "Road Of Legends 2026 Spring Split",
      patch: "15.6",
      items: JSON.stringify(["3153","3091","3006","0","0","0"]),
      summoner1: null,
      summoner2: null,
      keystoneRune: "8008",
      secondaryRune: "8100",
      side: "RED" as const,
    },
    {
      matchDate: new Date("2026-04-02T20:00:00Z"),
      champion: "Draven",
      result: "WIN" as const,
      duration: "30:49",
      kda: "10/2/9",
      cs: null,
      cspm: 9.4,
      gold: null,
      gpm: null,
      damage: null,
      dpm: 1154,
      damagePercent: null,
      kpPercent: 90.5,
      visionScore: null,
      teamName: "MYTH",
      opponent: "OUAT",
      tournament: "Road Of Legends 2026 Spring Split",
      patch: "15.6",
      items: JSON.stringify(["3031","3072","3046","3033","3006","0"]),
      summoner1: null,
      summoner2: null,
      keystoneRune: "8005",
      secondaryRune: "8200",
      side: "BLUE" as const,
    },
  ];

  for (const match of matches) {
    await db.proMatch.create({
      data: {
        ...match,
        playerId: player.id,
      },
    });
  }

  console.log(`Created ${matches.length} pro matches for ${player.pseudo}`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
