import { PrismaClient } from "@prisma/client";
import { computeProspectScore } from "../src/lib/prospect-scoring";

const prisma = new PrismaClient();

// ============================================================================
// AJOUTER UN PROSPECT MANUELLEMENT
// ============================================================================
// Remplis les infos ci-dessous et lance : npx tsx prisma/add-prospect.ts
//
// Le score sera calculé automatiquement avec l'algo LeagueScout.
// ============================================================================

const NEW_PROSPECT = {
  // --- INFOS DE BASE ---
  pseudo: "TestPlayer",              // ← Remplace ici
  realName: "Test Nom",              // ← Remplace ici
  role: "MID",                       // TOP / JUNGLE / MID / ADC / SUPPORT
  nationality: "FR",                 // Code pays (FR, KR, DE, etc.)
  age: 19,                           // ← Remplace ici
  currentTeam: "Test Team",          // ← Remplace ici
  league: "LFL",                     // LFL / LFL_D2 / LVP / Prime League / Ultraliga / NLC / etc.
  status: "ACADEMY",                 // ACADEMY / UNDER_CONTRACT / FREE_AGENT

  // --- SOLOQ STATS ---
  soloqStats: {
    currentRank: "Challenger 1200 LP", // Ex: "Challenger 1200 LP", "Grandmaster 800 LP"
    peakLp: 1250,                      // ← LP peak historique (nombre)
    winrate: 0.58,                     // ← Winrate SoloQ (0.58 = 58%)
    totalGames: 420,                   // ← Nombre total de games SoloQ
    championPool: `["Azir","Sylas","Akali","Yone","Taliyah"]`, // JSON array
  },

  // --- PRO STATS (compétitif) ---
  proStats: {
    kda: 4.2,
    csdAt15: 12.5,
    gdAt15: 850,
    dpm: 720,
    kpPercent: 0.72,
    visionScore: 85,
    championPool: `["Azir","Sylas","Akali"]`, // JSON array
    gamesPlayed: 28,
    season: "2026 Spring",
  },

  // --- SCORING MANUEL ---
  bestProResult: "Semi-final LFL 2026 Spring", // "Winner...", "Final...", "Semi-final...", "Quarter-final..."
  proWinrate: 0.62,                            // Winrate en compétitif (0.62 = 62%)
  eyeTestRating: 4.0,                          // Ton appréciation perso /5
};

async function main() {
  const { soloqStats, proStats, bestProResult, proWinrate, eyeTestRating, ...playerData } = NEW_PROSPECT;

  // Vérifie que le pseudo a été changé
  if (playerData.pseudo === "NOM_DU_JOUEUR") {
    console.error("❌ ERREUR : Tu n'as pas rempli le pseudo !");
    console.error("   Modifie le fichier prisma/add-prospect.ts et relance.");
    process.exit(1);
  }

  // Calcul du score automatique
  const computed = computeProspectScore({
    peakLp: soloqStats.peakLp,
    proWinrate,
    currentLeague: playerData.league,
    bestProResult,
    age: playerData.age,
    globalScore: null,
    eyeTestRating,
  });

  console.log(`\n📝 Ajout de : ${playerData.pseudo}`);
  console.log(`📊 Score calculé : ${computed.total}/100\n`);
  console.log("Détail :");
  console.log(`  • Peak LP ELO      : ${computed.breakdown.peakLpScore}/25`);
  console.log(`  • Best Pro Result  : ${computed.breakdown.bestProResultScore}/25`);
  console.log(`  • Pro Winrate      : ${computed.breakdown.proWinrateScore}/15`);
  console.log(`  • Age              : ${computed.breakdown.ageScore}/10`);
  console.log(`  • Current League   : ${computed.breakdown.currentLeagueScore}/5`);
  console.log(`  • Eye Test         : ${computed.breakdown.eyeTestScore}/5`);

  // Vérifie si le joueur existe déjà
  const existing = await prisma.player.findFirst({
    where: { pseudo: playerData.pseudo },
  });

  if (existing) {
    console.log(`\n⚠️  ${playerData.pseudo} existe déjà. Mise à jour...`);
    await prisma.player.update({
      where: { id: existing.id },
      data: {
        ...playerData,
        isProspect: true,
        prospectScore: computed.total,
        soloqStats: {
          upsert: {
            create: { ...soloqStats, lastUpdated: new Date() },
            update: { ...soloqStats, lastUpdated: new Date() },
          },
        },
        proStats: {
          create: { ...proStats, season: proStats.season || "2026", split: null },
        },
        prospectMetrics: {
          upsert: {
            create: { ...computed.breakdown, lastUpdated: new Date() },
            update: { ...computed.breakdown, lastUpdated: new Date() },
          },
        },
      },
    });
  } else {
    console.log(`\n✅ Création de ${playerData.pseudo}...`);
    await prisma.player.create({
      data: {
        ...playerData,
        isProspect: true,
        prospectScore: computed.total,
        soloqStats: {
          create: { ...soloqStats, lastUpdated: new Date() },
        },
        proStats: {
          create: proStats,
        },
        prospectMetrics: {
          create: { ...computed.breakdown, lastUpdated: new Date() },
        },
      },
    });
  }

  console.log(`\n🎉 ${playerData.pseudo} ajouté avec succès !`);
  console.log(`   Score final : ${computed.total}/100`);

  // Affiche le classement actuel
  const allProspects = await prisma.player.findMany({
    where: { isProspect: true },
    orderBy: { prospectScore: "desc" },
    select: { pseudo: true, prospectScore: true, role: true },
  });

  console.log(`\n📋 Classement Top 30 actuel (${allProspects.length} prospects) :`);
  allProspects.slice(0, 10).forEach((p, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    console.log(`   ${medal} ${p.pseudo} (${p.role}) — ${p.prospectScore}/100`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
