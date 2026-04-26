import { PrismaClient } from "@prisma/client";
import { computeProspectScore } from "../src/lib/prospect-scoring";

const prisma = new PrismaClient();

// ============================================================================
// RECALCULER TOUS LES SCORES DE PROSPECTS
// ============================================================================
// Lance : npx tsx prisma/recalculate-scores.ts
//
// Recalcule automatiquement tous les scores avec l'algo actuel.
// Utile quand tu modifies la formule dans src/lib/prospect-scoring.ts
// ============================================================================

async function main() {
  console.log("🔄 Recalcul des scores de tous les prospects...\n");

  const prospects = await prisma.player.findMany({
    where: { isProspect: true },
    include: {
      soloqStats: true,
      proStats: true,
    },
  });

  console.log(`${prospects.length} prospects trouvés.\n`);

  for (const p of prospects) {
    const ss = p.soloqStats;
    const ps = p.proStats;

    if (!ss) {
      console.log(`⚠️  ${p.pseudo} — pas de SoloQ stats, ignoré.`);
      continue;
    }

    // Récupère les métriques existantes ou valeurs par défaut
    const existingMetrics = await prisma.prospectMetrics.findUnique({
      where: { playerId: p.id },
    });

    const computed = computeProspectScore({
      peakLp: ss.peakLp,
      proWinrate: existingMetrics?.proWinrateScore
        ? (existingMetrics.proWinrateScore / 15) // reverse calc
        : ps?.kda ? 0.55 : null,
      currentLeague: p.league,
      bestProResult: null, // On garde les valeurs existantes si dispo
      soloqGames: ss.totalGames,
      age: p.age,
      proChampionPool: ps?.championPool ?? null,
      soloqWinrate: ss.winrate,
      eyeTestRating: existingMetrics?.eyeTestScore || null,
    });

    // Update
    await prisma.player.update({
      where: { id: p.id },
      data: {
        prospectScore: computed.total,
        prospectMetrics: {
          upsert: {
            create: { ...computed.breakdown, lastUpdated: new Date() },
            update: { ...computed.breakdown, lastUpdated: new Date() },
          },
        },
      },
    });

    console.log(`${p.pseudo}: ${computed.total}/100`);
  }

  // Affiche le nouveau classement
  const updated = await prisma.player.findMany({
    where: { isProspect: true },
    orderBy: { prospectScore: "desc" },
    select: { pseudo: true, prospectScore: true, role: true, league: true },
  });

  console.log(`\n📋 Nouveau classement Top 30 :`);
  updated.forEach((p, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    console.log(`   ${medal} ${p.pseudo} (${p.role}, ${p.league}) — ${p.prospectScore}/100`);
  });

  console.log(`\n✅ ${updated.length} prospects recalculés avec succès !`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
