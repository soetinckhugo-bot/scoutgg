const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  const total = await db.player.count();
  const byLeague = await db.player.groupBy({
    by: ["league"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  console.log("Total players:", total);
  console.log("By league:");
  byLeague.forEach((l) => console.log(`  ${l.league}: ${l._count.id}`));
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
