// ============================================================================
// LeagueScout PROSPECT SCORING — V2 (2026)
// ============================================================================
// Total: 100%
//
// • Peak LP ELO (2 ans)      25%  — LP peak historique en SoloQ (2 dernières années)
// • Best Pro Result          25%  — Meilleur résultat en tournoi pro
// • Age                      20%  — Plus jeune = meilleur potentiel (à partir de 14 ans)
// • Current League Tier      10%  — ERL1 major > ERL1 minor > ERL amateur
// • Pro Winrate (année)      10%  — Winrate en compétitif sur la saison
// • Score Global (année)     10%  — Score global de l'année en cours (globalScore)
// • Eye Test (scout)         10%  — Appréciation personnelle du scout (0-5)
// ============================================================================

// --- Best Pro Result options (for admin UI) ---
export const BEST_PRO_RESULT_OPTIONS = [
  { value: "Champion", label: "Champion / Winner", t3Points: 25, t4Points: 12.5 },
  { value: "Final", label: "Final", t3Points: 20, t4Points: 10 },
  { value: "Semi", label: "Semi / 3-4", t3Points: 16.25, t4Points: 6.25 },
  { value: "Quarter", label: "Quarter / 5-8", t3Points: 12.5, t4Points: 2.5 },
  { value: "", label: "No result", t3Points: 2.5, t4Points: 2.5 },
];

export function getBestProResultPoints(value: string, league: string): number {
  const opt = BEST_PRO_RESULT_OPTIONS.find((o) => o.value === value);
  if (!opt) return 2.5;
  const tier3 = ["LFL", "LES", "TCL", "PRM", "NACL", "LDL", "LCK CL"];
  const isT3 = tier3.includes(league);
  return isT3 ? opt.t3Points : opt.t4Points;
}

// --- Peak LP options (for admin UI) ---
export const PEAK_LP_OPTIONS = [
  { value: 1500, label: "Top 100 EUW — 1500+ LP", points: 25 },
  { value: 1350, label: "1200-1500 LP — 20-25 pts", points: 22.5 },
  { value: 1050, label: "900-1199 LP — 15-20 pts", points: 17.5 },
  { value: 750, label: "600-899 LP — 10-15 pts", points: 12.5 },
  { value: 450, label: "300-599 LP — 5-10 pts", points: 7.5 },
  { value: 150, label: "0-299 LP — 0-5 pts", points: 2.5 },
  { value: 0, label: "Unknown", points: 0 },
];

// --- 25% Peak LP ELO (2 years) ---
function scorePeakLp(peakLp: number): number {
  // 0 LP → 0 pts | 1500 LP → 25 pts (linear)
  return Math.min((peakLp / 1500) * 25, 25);
}

// --- 25% Best Pro Result ---
// T3 (LFL, LES, TCL, PRM, NACL, LDL, LCK CL, etc.):
//   Champion = 25 | Final = 20 | 3/4 = 16.25 | 5/8 = 12.5
// T4 (ROL, NLC, LPLOL, EBL, HLL, LIT, RL, AL, HM, LFL2, PRM2, Amateur, etc.):
//   Winner = 12.5 | Final = 10 | 3/4 = 6.25 | 5/8 = 2.5
// EMEA Top 4 (annexe ERL) = 25 pts (to be enabled later)
function scoreBestProResult(
  bestResult: string | null,
  league: string
): number {
  if (!bestResult) {
    return 2.5; // minimal fallback if no result known
  }

  const tier3 = ["LFL", "LES", "TCL", "PRM", "NACL", "LDL", "LCK CL"];
  const tier4 = ["ROL", "NLC", "LPLOL", "EBL", "HLL", "LIT", "RL", "AL", "HM", "LFL2", "PRM2", "AMATEUR"];

  const result = bestResult.toLowerCase();

  // EMEA Top 4 (placeholder for future tournament)
  if (result.includes("emea") && (result.includes("top 4") || result.includes("4th"))) {
    return 25;
  }

  const isT3 = tier3.includes(league);
  const isT4 = tier4.includes(league);

  if (isT3) {
    if (result.includes("winner") || result.includes("champion")) return 25;
    if (result.includes("final") || result.includes("2nd")) return 20;
    if (result.includes("semi") || result.includes("3rd") || result.includes("4th")) return 16.25;
    if (result.includes("quarter") || result.includes("5th") || result.includes("8th")) return 12.5;
    return 5;
  }

  if (isT4) {
    if (result.includes("winner") || result.includes("champion")) return 12.5;
    if (result.includes("final") || result.includes("2nd")) return 10;
    if (result.includes("semi") || result.includes("3rd") || result.includes("4th")) return 6.25;
    if (result.includes("quarter") || result.includes("5th") || result.includes("8th")) return 2.5;
    return 1;
  }

  // Unknown league tier fallback
  return 5;
}

// --- 10% Current League Tier ---
// 4-tier system:
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

// --- 10% Pro Winrate (annual) ---
function scoreProWinrate(winrate: number | null): number {
  if (winrate === null || winrate === undefined) return 5; // default for unknown
  // 0% → 0 pts | 100% → 10 pts
  return winrate * 10;
}

// --- 20% Age ---
// Scale: 14 = 20 pts (max), each year older removes points.
// Formula linear from 14 to 24+: 14=20, 16=18, 18=16, 20=14, 22=12, 24=10, 26=8...
function scoreAge(age: number | null): number {
  if (age === null || age === undefined) return 10;
  if (age <= 14) return 20;
  // Linear decay: every year above 14 costs 1 point
  const score = 20 - (age - 14);
  return Math.max(1, score);
}

// --- 10% Score Global (current year) ---
// Uses the player's globalScore from ProStats (0-100 scale expected)
function scoreGlobalYear(globalScore: number | null): number {
  if (globalScore === null || globalScore === undefined) return 5;
  // globalScore 0 → 0 pts | globalScore 100 → 10 pts
  return Math.min((globalScore / 100) * 10, 10);
}

// --- 10% Eye Test (scout rating) ---
function scoreEyeTest(eyeTestRating: number | null): number {
  // 0-5 rating from scout → 0-10 pts
  if (eyeTestRating === null || eyeTestRating === undefined) return 5;
  return Math.max(0, Math.min((eyeTestRating / 5) * 10, 10));
}

export interface ProspectScoreBreakdown {
  peakLpScore: number;          // 25%
  bestProResultScore: number;   // 25%
  ageScore: number;             // 20%
  currentLeagueScore: number;   // 10%
  proWinrateScore: number;      // 10%
  globalYearScore: number;      // 10%
  eyeTestScore: number;         // 10%
}

export function computeProspectScore(params: {
  peakLp: number;
  bestProResult: string | null;
  currentLeague: string;
  proWinrate: number | null;
  age: number | null;
  globalScore: number | null;
  eyeTestRating: number | null;
}): {
  total: number;
  breakdown: ProspectScoreBreakdown;
} {
  const peakLpScore = scorePeakLp(params.peakLp);
  const bestProResultScore = scoreBestProResult(params.bestProResult, params.currentLeague);
  const ageScore = scoreAge(params.age);
  const currentLeagueScore = scoreCurrentLeague(params.currentLeague);
  const proWinrateScore = scoreProWinrate(params.proWinrate);
  const globalYearScore = scoreGlobalYear(params.globalScore);
  const eyeTestScore = scoreEyeTest(params.eyeTestRating);

  const total = Math.round(
    peakLpScore +
    bestProResultScore +
    ageScore +
    currentLeagueScore +
    proWinrateScore +
    globalYearScore +
    eyeTestScore
  );

  return {
    total,
    breakdown: {
      peakLpScore: Math.round(peakLpScore * 10) / 10,
      bestProResultScore: Math.round(bestProResultScore * 10) / 10,
      ageScore: Math.round(ageScore * 10) / 10,
      currentLeagueScore: Math.round(currentLeagueScore * 10) / 10,
      proWinrateScore: Math.round(proWinrateScore * 10) / 10,
      globalYearScore: Math.round(globalYearScore * 10) / 10,
      eyeTestScore: Math.round(eyeTestScore * 10) / 10,
    },
  };
}
