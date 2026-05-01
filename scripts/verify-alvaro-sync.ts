import { db } from "../src/lib/server/db";

async function main() {
  const p = await db.player.findUnique({
    where: { id: "cmoj5td5k01koglk0hni2i103" },
    select: {
      pseudo: true,
      realName: true,
      nationality: true,
      age: true,
      currentTeam: true,
      twitterUrl: true,
      twitchUrl: true,
      lolprosUrl: true,
      photoUrl: true,
    },
  });
  console.log(p);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
