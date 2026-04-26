import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await db.$executeRaw`DELETE FROM Favorite`;
  await db.$executeRaw`DELETE FROM Report`;
  await db.$executeRaw`DELETE FROM Vod`;
  await db.$executeRaw`DELETE FROM SoloqStats`;
  await db.$executeRaw`DELETE FROM ProStats`;
  await db.$executeRaw`DELETE FROM Player`;
  await db.$executeRaw`DELETE FROM User`;

  // Create default admin user
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

  // Create Adam as the only player for now
  await db.player.createMany({
    data: [
      {
        id: "player_1",
        pseudo: "Adam",
        realName: "Adam Maanane",
        role: "TOP",
        nationality: "France",
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
    ],
  });

  // Create SoloQ stats
  await db.soloqStats.createMany({
    data: [
      {
        playerId: "player_1",
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
    ],
  });

  // Create Pro stats
  await db.proStats.createMany({
    data: [
      {
        playerId: "player_1",
        kda: 3.2,
        csdAt15: 12.5,
        gdAt15: 890,
        dpm: 487,
        kpPercent: 0.62,
        visionScore: 28.5,
        gamesPlayed: 18,
        season: "2026 Spring",
      },
    ],
  });

  // Create Reports
  await db.report.createMany({
    data: [
      {
        playerId: "player_1",
        title: "Adam — The Garen Specialist Analysis",
        content:
          "Adam has carved out a unique identity in the European top lane scene. His aggressive playstyle and willingness to play off-meta picks make him a wildcard that teams struggle to prepare against.\n\nHis Garen is genuinely world-class, with a 62% winrate in solo queue and consistent performances on the champion in professional play. However, his champion pool beyond Garen and Olaf shows some vulnerability.\n\nIn the current meta, Adam's value proposition is clear: he brings an X-factor that few top laners can match. His ability to draw bans on unconventional picks frees up draft resources for his team.\n\nThe main concern is his adaptability when his signature champions are banned. His K'Sante and Aatrox performances have been serviceable but not exceptional. For a team looking for a consistent weak-side player, Adam might not be the ideal fit. But for a team that wants to play through top lane and create draft chaos, he's one of the best options in Europe.",
        strengths: "Unique champion pool,Strong laning phase,Draft pressure,Team fight impact",
        weaknesses: "Limited meta champion proficiency,Can be exploitable when behind,Occasional over-aggression",
        verdict: "Must Watch",
        author: "@LeagueScout",
        isPremium: false,
      },
    ],
  });

  // Create VODs
  await db.vod.createMany({
    data: [
      {
        playerId: "player_1",
        title: "Adam Garen vs K'Sante — LEC Spring 2026",
        url: "https://www.youtube.com/watch?v=example1",
        platform: "YOUTUBE",
        description: "Dominant performance on Garen against one of the meta's strongest champions.",
        champion: "Garen",
        matchType: "OFFICIAL",
      },
      {
        playerId: "player_1",
        title: "Adam Olaf Highlights — Solo Queue",
        url: "https://www.twitch.tv/videos/example2",
        platform: "TWITCH",
        description: "Aggressive Olaf gameplay showcasing his signature style.",
        champion: "Olaf",
        matchType: "SOLOQ",
      },
    ],
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
