// ============================================================================
// LeagueScout PROSPECT SCORING — SIMPLIFIED ALGORITHM
// ============================================================================
// Total: 100%
//
// • Peak LP ELO Score          25%  — LP peak historique en SoloQ
// • Pro Winrate (année)        15%  — Winrate en compétitif sur la saison
// • Current League Tier         5%  — ERL1 major > ERL1 minor > ERL amateur
// • Best Pro Result            25%  — Meilleur résultat en tournoi pro
// • SoloQ Games Volume          5%  — Nombre de games en SoloQ
// • Age                        10%  — Plus jeune = meilleur potentiel
// • Pro Champion Pool           5%  — Largeur du pool en compétitif
// • SoloQ Winrate               5%  — Winrate global en SoloQ
// • Eye Test (scout)            5%  — Appréciation personnelle du scout
// ============================================================================

// --- 25% Peak LP ELO ---
function scorePeakLp(peakLp: number): number {
  // 0 LP → 0 pts | 1500 LP → 25 pts (linear)
  return Math.min((peakLp / 1500) * 25, 25);
}

// --- 15% Pro Winrate (annual) ---
function scoreProWinrate(winrate: number | null): number {
  if (winrate === null || winrate === undefined) return 5; // default for unknown
  // 0% → 0 pts | 100% → 15 pts
  return winrate * 15;
}

// --- 5% Current League Tier ---
// New 4-tier system:
// Tier 1: LCK, LPL                              → 5 pts
// Tier 2: LEC, LCS, CBLOL, LCP                  → 4 pts
// Tier 3: LFL, LES, TCL, PRM, NACL, LDL, LCK CL → 3 pts
// Tier 4: ROL, NLC, LPLOL, EBL, HLL, LIT, RL, AL, HM, LFL2, PRM2, Amateur → 2 pts
function scoreCurrentLeague(league: string): number {
  const tier1 = ["LCK", "LPL"];
  const tier2 = ["LEC", "LCS", "CBLOL", "LCP"];
  const tier3 = ["LFL", "LES", "TCL", "PRM", "NACL", "LDL", "LCK CL"];
  const tier4 = ["ROL", "NLC", "LPLOL", "EBL", "HLL", "LIT", "RL", "AL", "HM", "LFL2", "PRM2", "AMATEUR"];

  if (tier1.includes(league)) return 5;
  if (tier2.includes(league)) return 4;
  if (tier3.includes(league)) return 3;
  if (tier4.includes(league)) return 2;
  return 1; // fallback / unknown
}

// --- 25% Best Pro Result ---
function scoreBestProResult(
  bestResult: string | null,
  league: string
): number {
  if (!bestResult) {
    // Fallback: estimate from league tier
    const score = scoreCurrentLeague(league);
    return (score / 5) * 15; // max 15 if no result known
  }

  const result = bestResult.toLowerCase();
  if (result.includes("winner") || result.includes("champion")) return 25;
  if (result.includes("final") || result.includes("2nd")) return 20;
  if (result.includes("semi") || result.includes("3rd") || result.includes("4th"))
    return 15;
  if (result.includes("quarter") || result.includes("5th") || result.includes("8th"))
    return 10;
  if (result.includes("playoff")) return 7;
  return 5; // participated
}

// --- 5% SoloQ Games Volume ---
function scoreSoloqGames(totalGames: number): number {
  // 0 games → 0 pts | 500+ games → 5 pts
  return Math.min((totalGames / 500) * 5, 5);
}

// --- 10% Age ---
function scoreAge(age: number | null): number {
  if (age === null || age === undefined) return 5;
  // 16 = 10 pts | 18 = 9 pts | 20 = 7 pts | 22 = 5 pts | 24 = 3 pts
  if (age <= 16) return 10;
  if (age <= 18) return 9;
  if (age <= 20) return 7;
  if (age <= 22) return 5;
  if (age <= 24) return 3;
  return 1;
}

// --- 5% Pro Champion Pool ---
function scoreProChampionPool(championPool: string | null): number {
  if (!championPool) return 2.5;
  try {
    const parsed = JSON.parse(championPool);
    const count = Array.isArray(parsed) ? parsed.length : 0;
    // 1 champ = 1 pt | 3 = 3 pts | 5+ = 5 pts
    return Math.min(count, 5);
  } catch {
    const count = championPool.split(",").length;
    return Math.min(count, 5);
  }
}

// --- 5% SoloQ Winrate ---
function scoreSoloqWinrate(winrate: number): number {
  // 40% → 0 pts | 60% → 5 pts (centered around 50%)
  return Math.max(0, Math.min(((winrate - 0.4) / 0.2) * 5, 5));
}

// --- 5% Eye Test (scout rating) ---
function scoreEyeTest(eyeTestRating: number | null): number {
  // 0-5 rating from scout → 0-5 pts
  if (eyeTestRating === null || eyeTestRating === undefined) return 2.5;
  return Math.max(0, Math.min(eyeTestRating, 5));
}

export interface ProspectScoreBreakdown {
  peakLpScore: number;          // 25%
  proWinrateScore: number;      // 15%
  currentLeagueScore: number;   // 5%
  bestProResultScore: number;   // 25%
  soloqGamesScore: number;      // 5%
  ageScore: number;             // 10%
  proChampionPoolScore: number; // 5%
  soloqWinrateScore: number;    // 5%
  eyeTestScore: number;         // 5%
}

export function computeProspectScore(params: {
  peakLp: number;
  proWinrate: number | null;
  currentLeague: string;
  bestProResult: string | null;
  soloqGames: number;
  age: number | null;
  proChampionPool: string | null;
  soloqWinrate: number;
  eyeTestRating: number | null;
}): {
  total: number;
  breakdown: ProspectScoreBreakdown;
} {
  const peakLpScore = scorePeakLp(params.peakLp);
  const proWinrateScore = scoreProWinrate(params.proWinrate);
  const currentLeagueScore = scoreCurrentLeague(params.currentLeague);
  const bestProResultScore = scoreBestProResult(
    params.bestProResult,
    params.currentLeague
  );
  const soloqGamesScore = scoreSoloqGames(params.soloqGames);
  const ageScore = scoreAge(params.age);
  const proChampionPoolScore = scoreProChampionPool(params.proChampionPool);
  const soloqWinrateScore = scoreSoloqWinrate(params.soloqWinrate);
  const eyeTestScore = scoreEyeTest(params.eyeTestRating);

  const total = Math.round(
    peakLpScore +
    proWinrateScore +
    currentLeagueScore +
    bestProResultScore +
    soloqGamesScore +
    ageScore +
    proChampionPoolScore +
    soloqWinrateScore +
    eyeTestScore
  );

  return {
    total,
    breakdown: {
      peakLpScore: Math.round(peakLpScore * 10) / 10,
      proWinrateScore: Math.round(proWinrateScore * 10) / 10,
      currentLeagueScore: Math.round(currentLeagueScore * 10) / 10,
      bestProResultScore: Math.round(bestProResultScore * 10) / 10,
      soloqGamesScore: Math.round(soloqGamesScore * 10) / 10,
      ageScore: Math.round(ageScore * 10) / 10,
      proChampionPoolScore: Math.round(proChampionPoolScore * 10) / 10,
      soloqWinrateScore: Math.round(soloqWinrateScore * 10) / 10,
      eyeTestScore: Math.round(eyeTestScore * 10) / 10,
    },
  };
}

