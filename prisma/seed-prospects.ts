import { PrismaClient } from "@prisma/client";
import { computeProspectScore } from "../src/lib/prospect-scoring";

const prisma = new PrismaClient();

interface ProspectData {
  pseudo: string;
  realName: string;
  role: string;
  nationality: string;
  age: number;
  currentTeam: string;
  league: string;
  status: string;
  riotPuuid: string | null;
  isProspect: boolean;
  prospectTrend: string;
  prospectPhotoUrl: string | null;
  eyeTestRating: number | null;
  bestProResult: string | null;
  proWinrate: number | null;
  soloqStats: {
    currentRank: string;
    peakLp: number;
    winrate: number;
    totalGames: number;
    championPool: string;
  };
  proStats: {
    kda: number | null;
    csdAt15: number | null;
    gdAt15: number | null;
    dpm: number | null;
    kpPercent: number | null;
    visionScore: number | null;
    championPool: string | null;
    gamesPlayed: number | null;
    season: string;
  };
}

const prospects: ProspectData[] = [
  {
    pseudo: "Peng",
    realName: "Yoon Min-seo",
    role: "MID",
    nationality: "KR",
    age: 19,
    currentTeam: "GiantX Academy",
    league: "LFL",
    status: "ACADEMY",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "stable",
    prospectPhotoUrl: null,
    eyeTestRating: 4.5,
    bestProResult: "Semi-final LFL 2026 Spring",
    proWinrate: 0.62,
    soloqStats: {
      currentRank: "Challenger 1356 LP",
      peakLp: 1420,
      winrate: 0.63,
      totalGames: 385,
      championPool: `["Azir","Sylas","Akali","Yone","Taliyah"]`,
    },
    proStats: {
      kda: 4.2, csdAt15: 12.5, gdAt15: 850, dpm: 720, kpPercent: 0.72,
      visionScore: 85, championPool: `["Azir","Sylas","Akali"]`,
      gamesPlayed: 28, season: "2026 Spring",
    },
  },
  {
    pseudo: "Sheo",
    realName: "Théo Borile",
    role: "JUNGLE",
    nationality: "FR",
    age: 20,
    currentTeam: "Karmine Corp Blue",
    league: "LFL",
    status: "ACADEMY",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "up",
    prospectPhotoUrl: null,
    eyeTestRating: 4.5,
    bestProResult: "Final LFL 2026 Spring",
    proWinrate: 0.65,
    soloqStats: {
      currentRank: "Challenger 1187 LP",
      peakLp: 1250,
      winrate: 0.61,
      totalGames: 410,
      championPool: `["Vi","Wukong","Sejuani","Maokai","Viego"]`,
    },
    proStats: {
      kda: 3.8, csdAt15: 8.2, gdAt15: 620, dpm: 480, kpPercent: 0.78,
      visionScore: 92, championPool: `["Vi","Wukong","Sejuani"]`,
      gamesPlayed: 32, season: "2026 Spring",
    },
  },
  {
    pseudo: "Czekolad",
    realName: "Paweł Szczepanik",
    role: "MID",
    nationality: "PL",
    age: 20,
    currentTeam: "Team Vitality Academy",
    league: "LFL",
    status: "ACADEMY",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "up",
    prospectPhotoUrl: null,
    eyeTestRating: 4.0,
    bestProResult: "Quarter-final LFL 2026 Spring",
    proWinrate: 0.58,
    soloqStats: {
      currentRank: "Challenger 1198 LP",
      peakLp: 1280,
      winrate: 0.60,
      totalGames: 420,
      championPool: `["Corki","Viktor","Orianna","Azir","Ahri"]`,
    },
    proStats: {
      kda: 3.5, csdAt15: 9.8, gdAt15: 720, dpm: 680, kpPercent: 0.68,
      visionScore: 78, championPool: `["Corki","Viktor","Orianna"]`,
      gamesPlayed: 30, season: "2026 Spring",
    },
  },
  {
    pseudo: "Szygenda",
    realName: "Mathias Jensen",
    role: "TOP",
    nationality: "DK",
    age: 20,
    currentTeam: "Team BDS Academy",
    league: "LFL",
    status: "ACADEMY",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "stable",
    prospectPhotoUrl: null,
    eyeTestRating: 4.0,
    bestProResult: "Quarter-final LFL 2026 Spring",
    proWinrate: 0.56,
    soloqStats: {
      currentRank: "Challenger 1042 LP",
      peakLp: 1120,
      winrate: 0.58,
      totalGames: 342,
      championPool: `["K'Sante","Jax","Renekton","Camille","Gwen"]`,
    },
    proStats: {
      kda: 3.2, csdAt15: 11.2, gdAt15: 680, dpm: 520, kpPercent: 0.65,
      visionScore: 72, championPool: `["K'Sante","Jax","Renekton"]`,
      gamesPlayed: 26, season: "2026 Spring",
    },
  },
  {
    pseudo: "Hantera",
    realName: "Jules Bourgeois",
    role: "SUPPORT",
    nationality: "FR",
    age: 20,
    currentTeam: "Team GO",
    league: "LFL",
    status: "ACADEMY",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "down",
    prospectPhotoUrl: null,
    eyeTestRating: 3.5,
    bestProResult: "Semi-final LFL 2026 Spring",
    proWinrate: 0.60,
    soloqStats: {
      currentRank: "Challenger 967 LP",
      peakLp: 1010,
      winrate: 0.57,
      totalGames: 356,
      championPool: `["Rakan","Nautilus","Braum","Thresh","Leona"]`,
    },
    proStats: {
      kda: 3.6, csdAt15: null, gdAt15: 120, dpm: 320, kpPercent: 0.82,
      visionScore: 105, championPool: `["Rakan","Nautilus","Braum"]`,
      gamesPlayed: 29, season: "2026 Spring",
    },
  },
  {
    pseudo: "Cboi",
    realName: "Piotr Sobieski",
    role: "JUNGLE",
    nationality: "PL",
    age: 20,
    currentTeam: "Gentle Mates",
    league: "LFL",
    status: "UNDER_CONTRACT",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "stable",
    prospectPhotoUrl: null,
    eyeTestRating: 3.5,
    bestProResult: "Quarter-final LFL 2026 Spring",
    proWinrate: 0.55,
    soloqStats: {
      currentRank: "Challenger 1054 LP",
      peakLp: 1100,
      winrate: 0.59,
      totalGames: 390,
      championPool: `["Lee Sin","Graves","Kindred","Xin Zhao","Jarvan IV"]`,
    },
    proStats: {
      kda: 3.4, csdAt15: 6.5, gdAt15: 540, dpm: 510, kpPercent: 0.75,
      visionScore: 88, championPool: `["Lee Sin","Graves","Kindred"]`,
      gamesPlayed: 31, season: "2026 Spring",
    },
  },
  {
    pseudo: "Skeanz",
    realName: "Duncan Marquet",
    role: "JUNGLE",
    nationality: "FR",
    age: 20,
    currentTeam: "Karmine Corp Blue",
    league: "LFL",
    status: "ACADEMY",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "stable",
    prospectPhotoUrl: null,
    eyeTestRating: 3.5,
    bestProResult: "Quarter-final LFL 2026 Spring",
    proWinrate: 0.54,
    soloqStats: {
      currentRank: "Challenger 987 LP",
      peakLp: 1050,
      winrate: 0.57,
      totalGames: 365,
      championPool: `["Graves","Viego","Wukong","Vi","Sejuani"]`,
    },
    proStats: {
      kda: 3.3, csdAt15: 7.1, gdAt15: 580, dpm: 495, kpPercent: 0.73,
      visionScore: 85, championPool: `["Graves","Viego","Wukong"]`,
      gamesPlayed: 27, season: "2026 Spring",
    },
  },
  {
    pseudo: "Keduii",
    realName: "Tim Willers",
    role: "ADC",
    nationality: "DE",
    age: 20,
    currentTeam: "E WIE EINFACH E-SPORTS",
    league: "Prime League",
    status: "UNDER_CONTRACT",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "up",
    prospectPhotoUrl: null,
    eyeTestRating: 3.5,
    bestProResult: "Semi-final Prime League 2026 Spring",
    proWinrate: 0.57,
    soloqStats: {
      currentRank: "Grandmaster 892 LP",
      peakLp: 950,
      winrate: 0.56,
      totalGames: 310,
      championPool: `["Aphelios","Jinx","Kai'Sa","Senna","Lucian"]`,
    },
    proStats: {
      kda: 3.9, csdAt15: 14.2, gdAt15: 920, dpm: 750, kpPercent: 0.70,
      visionScore: 68, championPool: `["Aphelios","Jinx","Kai'Sa"]`,
      gamesPlayed: 25, season: "2026 Spring",
    },
  },
  {
    pseudo: "Jopa",
    realName: "Josip Čančar",
    role: "ADC",
    nationality: "HR",
    age: 20,
    currentTeam: "G2 Hel",
    league: "LFL_D2",
    status: "UNDER_CONTRACT",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "new",
    prospectPhotoUrl: null,
    eyeTestRating: 3.0,
    bestProResult: "Winner LFL_D2 2026 Spring",
    proWinrate: 0.68,
    soloqStats: {
      currentRank: "Grandmaster 876 LP",
      peakLp: 920,
      winrate: 0.55,
      totalGames: 298,
      championPool: `["Kai'Sa","Ezreal","Jinx","Zeri","Varus"]`,
    },
    proStats: {
      kda: 3.7, csdAt15: 11.8, gdAt15: 780, dpm: 680, kpPercent: 0.68,
      visionScore: 65, championPool: `["Kai'Sa","Ezreal","Jinx"]`,
      gamesPlayed: 22, season: "2026 Spring",
    },
  },
  {
    pseudo: "Omon",
    realName: "Omon Abdurazakov",
    role: "MID",
    nationality: "UZ",
    age: 20,
    currentTeam: "Natus Vincere",
    league: "Ultraliga",
    status: "UNDER_CONTRACT",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "new",
    prospectPhotoUrl: null,
    eyeTestRating: 3.0,
    bestProResult: "Final Ultraliga 2026 Spring",
    proWinrate: 0.61,
    soloqStats: {
      currentRank: "Grandmaster 834 LP",
      peakLp: 890,
      winrate: 0.55,
      totalGames: 290,
      championPool: `["Yone","Sylas","Akali","Azir","Cassiopeia"]`,
    },
    proStats: {
      kda: 3.6, csdAt15: 10.5, gdAt15: 720, dpm: 650, kpPercent: 0.66,
      visionScore: 70, championPool: `["Yone","Sylas","Akali"]`,
      gamesPlayed: 24, season: "2026 Spring",
    },
  },
  {
    pseudo: "Advienne",
    realName: "Henk Reijenga",
    role: "SUPPORT",
    nationality: "NL",
    age: 20,
    currentTeam: "Movistar KOI",
    league: "LVP",
    status: "UNDER_CONTRACT",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "down",
    prospectPhotoUrl: null,
    eyeTestRating: 3.0,
    bestProResult: "Quarter-final LVP 2026 Spring",
    proWinrate: 0.53,
    soloqStats: {
      currentRank: "Grandmaster 768 LP",
      peakLp: 820,
      winrate: 0.53,
      totalGames: 265,
      championPool: `["Alistar","Rell","Rakan","Nautilus","Blitzcrank"]`,
    },
    proStats: {
      kda: 3.1, csdAt15: null, gdAt15: 80, dpm: 280, kpPercent: 0.80,
      visionScore: 98, championPool: `["Alistar","Rell","Rakan"]`,
      gamesPlayed: 26, season: "2026 Spring",
    },
  },
  {
    pseudo: "Lot",
    realName: "Erlend Vågseth",
    role: "TOP",
    nationality: "NO",
    age: 19,
    currentTeam: "NORD Esports",
    league: "NLC",
    status: "UNDER_CONTRACT",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "stable",
    prospectPhotoUrl: null,
    eyeTestRating: 3.0,
    bestProResult: "Semi-final NLC 2026 Spring",
    proWinrate: 0.55,
    soloqStats: {
      currentRank: "Grandmaster 742 LP",
      peakLp: 810,
      winrate: 0.54,
      totalGames: 276,
      championPool: `["Ornn","K'Sante","Gnar","Gragas","Jayce"]`,
    },
    proStats: {
      kda: 2.9, csdAt15: 8.5, gdAt15: 520, dpm: 480, kpPercent: 0.62,
      visionScore: 68, championPool: `["Ornn","K'Sante","Gnar"]`,
      gamesPlayed: 23, season: "2026 Spring",
    },
  },
  {
    pseudo: "Woolite",
    realName: "Paweł Pruski",
    role: "ADC",
    nationality: "PL",
    age: 20,
    currentTeam: "Illuminar Gaming",
    league: "Ultraliga",
    status: "UNDER_CONTRACT",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "down",
    prospectPhotoUrl: null,
    eyeTestRating: 2.5,
    bestProResult: "Quarter-final Ultraliga 2026 Spring",
    proWinrate: 0.52,
    soloqStats: {
      currentRank: "Grandmaster 712 LP",
      peakLp: 780,
      winrate: 0.53,
      totalGames: 255,
      championPool: `["Jinx","Aphelios","Varus","Ezreal","Kai'Sa"]`,
    },
    proStats: {
      kda: 3.5, csdAt15: 12.1, gdAt15: 820, dpm: 710, kpPercent: 0.67,
      visionScore: 62, championPool: `["Jinx","Aphelios","Varus"]`,
      gamesPlayed: 21, season: "2026 Spring",
    },
  },
  {
    pseudo: "Vasco",
    realName: "Jakub Bęcek",
    role: "TOP",
    nationality: "PL",
    age: 18,
    currentTeam: "Zero Tenacity",
    league: "Ultraliga",
    status: "UNDER_CONTRACT",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "up",
    prospectPhotoUrl: null,
    eyeTestRating: 3.0,
    bestProResult: "Semi-final Ultraliga 2026 Spring",
    proWinrate: 0.58,
    soloqStats: {
      currentRank: "Grandmaster 654 LP",
      peakLp: 710,
      winrate: 0.52,
      totalGames: 240,
      championPool: `["Aatrox","Fiora","Jax","Camille","Gwen"]`,
    },
    proStats: {
      kda: 2.8, csdAt15: 7.2, gdAt15: 450, dpm: 460, kpPercent: 0.58,
      visionScore: 60, championPool: `["Aatrox","Fiora","Jax"]`,
      gamesPlayed: 20, season: "2026 Spring",
    },
  },
  {
    pseudo: "Stend",
    realName: "Romain Kursner",
    role: "SUPPORT",
    nationality: "FR",
    age: 19,
    currentTeam: "Joblife",
    league: "LFL_D2",
    status: "UNDER_CONTRACT",
    riotPuuid: null,
    isProspect: true,
    prospectTrend: "new",
    prospectPhotoUrl: null,
    eyeTestRating: 2.5,
    bestProResult: "Final LFL_D2 2026 Spring",
    proWinrate: 0.56,
    soloqStats: {
      currentRank: "Grandmaster 628 LP",
      peakLp: 680,
      winrate: 0.51,
      totalGames: 230,
      championPool: `["Thresh","Braum","Nautilus","Rakan","Leona"]`,
    },
    proStats: {
      kda: 3.0, csdAt15: null, gdAt15: 60, dpm: 250, kpPercent: 0.77,
      visionScore: 88, championPool: `["Thresh","Braum","Nautilus"]`,
      gamesPlayed: 19, season: "2026 Spring",
    },
  },
];

async function main() {
  console.log("Seeding Top 30 Prospects (HLTV-style)...\n");

  for (let i = 0; i < prospects.length; i++) {
    const data = prospects[i];
    const { soloqStats, proStats, eyeTestRating, bestProResult, proWinrate, prospectTrend, prospectPhotoUrl, ...playerData } = data;

    const computed = computeProspectScore({
      peakLp: soloqStats.peakLp,
      proWinrate,
      currentLeague: playerData.league,
      bestProResult,
      soloqGames: soloqStats.totalGames,
      age: playerData.age,
      proChampionPool: proStats.championPool,
      soloqWinrate: soloqStats.winrate,
      eyeTestRating,
    });

    console.log(`${i + 1}. ${playerData.pseudo}: ${computed.total}/100 (${prospectTrend})`);

    const existing = await prisma.player.findFirst({
      where: { pseudo: playerData.pseudo },
    });

    if (existing) {
      await prisma.player.update({
        where: { id: existing.id },
        data: {
          ...playerData,
          prospectScore: computed.total,
          prospectRank: i + 1,
          prospectTrend,
          prospectPhotoUrl,
          soloqStats: {
            upsert: {
              create: { ...soloqStats, lastUpdated: new Date() },
              update: { ...soloqStats, lastUpdated: new Date() },
            },
          },
          proStats: {
            upsert: {
              create: proStats,
              update: proStats,
            },
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
      await prisma.player.create({
        data: {
          ...playerData,
          prospectScore: computed.total,
          prospectRank: i + 1,
          prospectTrend,
          prospectPhotoUrl,
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
  }

  console.log(`\n✅ Seeded ${prospects.length} prospects with HLTV-style ranks & trends.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
