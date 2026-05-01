import { db } from "../src/lib/server/db";
import { unlinkSync } from "fs";
import { join } from "path";

const COACH_PSEUDOS = [
  "Aoshi", "Samyy", "Guchi", "furyz", "Luuukz",
  "Kaiba", "NewCosmo", "SrVenancio", "Raise", "Sephis",
  "Sarkis", "tockers", "BeellzY", "SeeEl", "Smiley",
  "Enatron", "Invokid", "Brandão",
];

async function main() {
  for (const pseudo of COACH_PSEUDOS) {
    const player = await db.player.findFirst({
      where: { pseudo, league: "CBLOL" },
      select: { id: true, pseudo: true, photoUrl: true },
    });
    if (!player) {
      console.log(`Not found: ${pseudo}`);
      continue;
    }

    // Delete photo if local
    if (player.photoUrl && player.photoUrl.includes("_leaguepedia")) {
      try {
        const filename = player.photoUrl.replace("/uploads/", "");
        const filepath = join(process.cwd(), "public", "uploads", filename);
        unlinkSync(filepath);
        console.log(`Deleted photo: ${filename}`);
      } catch {
        // ignore
      }
    }

    await db.player.delete({ where: { id: player.id } });
    console.log(`Deleted coach: ${player.pseudo} (${player.id})`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
