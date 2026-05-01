import { db } from "../src/lib/server/db";

async function main() {
  const allPlayers = await db.player.findMany({
    select: { id: true, pseudo: true },
  });
  console.log("Total players:", allPlayers.length);
  console.log("Players:", allPlayers.map((p) => p.pseudo).join(", "));

  const toDelete = allPlayers.filter((p) => p.pseudo !== "SPACE");
  console.log("\nPlayers to delete:", toDelete.length);
  console.log("To delete:", toDelete.map((p) => p.pseudo).join(", "));

  if (toDelete.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  // Delete in batches to avoid SQLite issues
  const batchSize = 10;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize);
    await db.player.deleteMany({
      where: {
        id: { in: batch.map((p) => p.id) },
      },
    });
    console.log(`Deleted batch ${i / batchSize + 1}:`, batch.map((p) => p.pseudo).join(", "));
  }

  const remaining = await db.player.count();
  console.log("\nRemaining players:", remaining);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
