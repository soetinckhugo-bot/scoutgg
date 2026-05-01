import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default admin user (skip if exists)
  const existingAdmin = await db.user.findUnique({
    where: { email: "admin@leaguescout.gg" },
  });

  if (!existingAdmin) {
    const adminPassword = await bcrypt.hash("admin123", 10);
    await db.user.create({
      data: {
        email: "admin@leaguescout.gg",
        name: "Admin",
        passwordHash: adminPassword,
        role: "admin",
        isPremium: true,
        subscriptionStatus: "active",
      },
    });
    console.log("Created admin user: admin@leaguescout.gg / admin123");
  } else {
    console.log("Admin user already exists, skipping.");
  }

  // Upsert Adam (don't delete other players)
  const adam = await db.player.upsert({
    where: { id: "player_1" },
    update: {},
    create: {
      id: "player_1",
      pseudo: "Adam",
      realName: "Adam Maanane",
      role: "TOP",
      nationality: "FR",
      age: 23,
      currentTeam: null,
      league: "LEC",
      status: "FREE_AGENT",
      opggUrl: "https://op.gg/summoners/euw/Adam",
      golggUrl: "https://gol.gg/players/player-stats/3489/season-ALL/split-ALL/tournament-ALL/",
      lolprosUrl: "https://lolpros.gg/player/adam",
      leaguepediaUrl: "https://lol.fandom.com/wiki/Adam",
      twitterUrl: "https://twitter.com/AdamLoL",
      photoUrl: null,
      bio: "Aggressive top laner known for his Garen and Olaf picks. Former LFL champion with Karmine Corp.",
      isFeatured: true,
      featuredAt: new Date(),
    },
  });

  // Delete and recreate Adam's linked data to keep it fresh
  await db.soloqStats.deleteMany({ where: { playerId: adam.id } });
  await db.proStats.deleteMany({ where: { playerId: adam.id } });
  await db.report.deleteMany({ where: { playerId: adam.id } });
  await db.vod.deleteMany({ where: { playerId: adam.id } });

  // Create SoloQ stats
  await db.soloqStats.create({
    data: {
      playerId: adam.id,
      currentRank: "Challenger 1243 LP",
      peakLp: 1456,
      winrate: 0.58,
      totalGames: 342,
      championPool: JSON.stringify([
        { champion: "Garen", games: 89, winrate: 0.62 },
        { champion: "Olaf", games: 67, winrate: 0.58 },
        { champion: "Darius", games: 45, winrate: 0.55 },
        { champion: "Sett", games: 38, winrate: 0.61 },
        { champion: "Aatrox", games: 32, winrate: 0.53 },
      ]),
    },
  });

  // Create Pro stats — full stats for Adam
  await db.proStats.create({
    data: {
      playerId: adam.id,
      gamesPlayed: 18,
      season: "2026",
      split: "Spring",
      // Combat
      k: 3.8,
      d: 2.1,
      a: 5.2,
      kda: 3.2,
      kpPercent: 0.62,
      ksPercent: 0.24,
      dthPercent: 0.18,
      fbPercent: 0.14,
      fbVictim: 0.08,
      soloKills: 1.2,
      pentaKills: 0,
      // Counter Pick
      ctrPercent: 0.71,
      // Early Game
      gdAt10: 320,
      xpdAt10: 180,
      csdAt10: 8,
      gdAt15: 890,
      xpdAt15: 310,
      csdAt15: 12.5,
      // Farming
      cspm: 8.2,
      csm: 8.1,
      csPercentAt15: 0.28,
      // Damage
      dpm: 487,
      damagePercent: 0.26,
      dPercentAt15: 0.22,
      tdpg: 18500,
      // Economy
      egpm: 425,
      gpm: 420,
      goldPercent: 0.24,
      // Vision
      wpm: 0.35,
      cwpm: 0.12,
      wcpm: 1.8,
      vwpm: 0.08,
      vsPercent: 0.14,
      vspm: 2.1,
      // Objectives
      stl: 0.3,
      // Averages
      avgKills: 3.8,
      avgDeaths: 2.1,
      avgAssists: 5.2,
      avgWpm: 0.35,
      avgWcpm: 1.8,
      avgVwpm: 0.08,
      // Scores
      winRate: 0.58,
      rawScore: 78.5,
      globalScore: 82.5,
      tierScore: 78.3,
      tier: "S",
    },
  });

  // Create Reports
  await db.report.create({
    data: {
      playerId: adam.id,
      title: "Adam — The Garen Specialist Analysis",
      content:
        "Adam has carved out a unique identity in the European top lane scene. His aggressive playstyle and willingness to play off-meta picks make him a wildcard that teams struggle to prepare against.\n\nHis Garen is genuinely world-class, with a 62% winrate in solo queue and consistent performances on the champion in professional play. However, his champion pool beyond Garen and Olaf shows some vulnerability.\n\nIn the current meta, Adam's value proposition is clear: he brings an X-factor that few top laners can match. His ability to draw bans on unconventional picks frees up draft resources for his team.\n\nThe main concern is his adaptability when his signature champions are banned. His K'Sante and Aatrox performances have been serviceable but not exceptional. For a team looking for a consistent weak-side player, Adam might not be the ideal fit. But for a team that wants to play through top lane and create draft chaos, he's one of the best options in Europe.",
      strengths: "Unique champion pool,Strong laning phase,Draft pressure,Team fight impact",
      weaknesses: "Limited meta champion proficiency,Can be exploitable when behind,Occasional over-aggression",
      verdict: "Must Watch",
      author: "@LeagueScout",
      isPremium: false,
    },
  });

  // Create VODs
  await db.vod.createMany({
    data: [
      {
        playerId: adam.id,
        title: "Adam Garen vs K'Sante — LEC Spring 2026",
        url: "https://www.youtube.com/watch?v=example1",
        platform: "YOUTUBE",
        description: "Dominant performance on Garen against one of the meta's strongest champions.",
        champion: "Garen",
        matchType: "OFFICIAL",
      },
      {
        playerId: adam.id,
        title: "Adam Olaf Highlights — Solo Queue",
        url: "https://www.twitch.tv/videos/example2",
        platform: "TWITCH",
        description: "Aggressive Olaf gameplay showcasing his signature style.",
        champion: "Olaf",
        matchType: "SOLOQ",
      },
    ],
  });

  console.log("Seed completed successfully! Adam is ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
