import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const monthPeriod = new Date().toISOString().slice(0, 7);

  const clips = [
    {
      playerName: "Zeka",
      playerRole: "MID",
      title: "Double Kill under tower",
      platform: "youtube",
      videoId: "dQw4w9WgXcQ",
      monthPeriod,
      isActive: true,
    },
    {
      playerName: "Canyon",
      playerRole: "JUNGLE",
      title: "Baron Steal with Smite",
      platform: "youtube",
      videoId: "9bZkp7q19f0",
      monthPeriod,
      isActive: true,
    },
    {
      playerName: "Gumayusi",
      playerRole: "ADC",
      title: "Pentakill in teamfight",
      platform: "youtube",
      videoId: "kJQP7kiw5Fk",
      monthPeriod,
      isActive: true,
    },
    {
      playerName: "Keria",
      playerRole: "SUPPORT",
      title: "Insane ADC save",
      platform: "youtube",
      videoId: "RgKAFK5djSk",
      monthPeriod,
      isActive: true,
    },
    {
      playerName: "Zeus",
      playerRole: "TOP",
      title: "1v2 Top Lane Outplay",
      platform: "tiktok",
      videoId: "1234567890",
      monthPeriod,
      isActive: true,
    },
    {
      playerName: "Chovy",
      playerRole: "MID",
      title: "Perfect CS at 10 min",
      platform: "tiktok",
      videoId: "0987654321",
      monthPeriod,
      isActive: true,
    },
  ];

  for (const clip of clips) {
    await db.clip.upsert({
      where: { id: `clip_${clip.videoId}` },
      update: {},
      create: { ...clip, id: `clip_${clip.videoId}` },
    });
  }

  console.log(`✅ ${clips.length} clips placeholder créés`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
