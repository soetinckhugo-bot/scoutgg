import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// SUPPRIMER UN PROSPECT
// ============================================================================
// Lance : npx tsx prisma/remove-prospect.ts "PseudoDuJoueur"
// ============================================================================

const pseudo = process.argv[2];

async function main() {
  if (!pseudo) {
    console.error("❌ Usage : npx tsx prisma/remove-prospect.ts \"PseudoDuJoueur\"");
    process.exit(1);
  }

  const player = await prisma.player.findFirst({
    where: { pseudo },
  });

  if (!player) {
    console.error(`❌ Joueur "${pseudo}" non trouvé.`);
    process.exit(1);
  }

  if (!player.isProspect) {
    console.error(`❌ ${pseudo} n'est pas marqué comme prospect.`);
    process.exit(1);
  }

  // Option 1 : Supprimer complètement le joueur
  // await prisma.player.delete({ where: { id: player.id } });
  // console.log(`🗑️  ${pseudo} supprimé complètement.`);

  // Option 2 : Retirer le statut prospect (garde le joueur dans la DB)
  await prisma.player.update({
    where: { id: player.id },
    data: {
      isProspect: false,
      prospectScore: null,
    },
  });

  console.log(`✅ ${pseudo} retiré de la liste des prospects.`);

  // Affiche le classement restant
  const remaining = await prisma.player.findMany({
    where: { isProspect: true },
    orderBy: { prospectScore: "desc" },
    select: { pseudo: true, prospectScore: true },
  });

  console.log(`\n📋 ${remaining.length} prospects restants.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
