export const ROLE_COLORS: Record<string, string> = {
  TOP: "bg-red-500/15 text-red-400 border-red-500/25",
  JUNGLE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  MID: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  ADC: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  SUPPORT: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
};

export const STATUS_COLORS: Record<string, string> = {
  FREE_AGENT: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  UNDER_CONTRACT: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  ACADEMY: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SUB: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  SCOUTING: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
export const LEAGUES = ["LCK", "LPL", "LEC", "LCS", "CBLOL", "LCP", "LFL", "LES", "TCL", "PRM", "NACL", "LDL", "LCK CL", "ROL", "NLC", "LPLOL", "EBL", "HLL", "LIT", "RL", "AL", "HM", "LFL2", "PRM2", "Amateur"];
export const TIERS = ["T1", "T2", "T3", "T4"];

export const TIER_LABELS: Record<string, string> = {
  "T1": "Tier 1 — LCK / LPL",
  "T2": "Tier 2 — LEC / LCS / CBLOL / LCP",
  "T3": "Tier 3 — LFL / LES / TCL / PRM / NACL / LDL / LCK CL",
  "T4": "Tier 4 — ROL / NLC / LPLOL / EBL / HLL / LIT / RL / AL / HM / LFL2 / PRM2 / Amateur",
};

// New 4-tier league system with coefficients
export const LEAGUE_TIERS: Record<string, { tier: number; coefficient: number; region: string }> = {
  // Tier 1 — Major leagues (coefficient 1.0)
  LCK: { tier: 1, coefficient: 1.0, region: "Korea" },
  LPL: { tier: 1, coefficient: 1.0, region: "China" },
  // Tier 2 — Premier leagues (coefficient 0.75)
  LEC: { tier: 2, coefficient: 0.75, region: "Europe" },
  LCS: { tier: 2, coefficient: 0.75, region: "North America" },
  CBLOL: { tier: 2, coefficient: 0.75, region: "Brazil" },
  LCP: { tier: 2, coefficient: 0.75, region: "Taiwan" },
  // Tier 3 — ERL Major + Academy (coefficient 0.65)
  LFL: { tier: 3, coefficient: 0.65, region: "France" },
  LES: { tier: 3, coefficient: 0.65, region: "Spain" },
  TCL: { tier: 3, coefficient: 0.65, region: "Turkey" },
  PRM: { tier: 3, coefficient: 0.65, region: "DACH" },
  NACL: { tier: 3, coefficient: 0.65, region: "North America" },
  LDL: { tier: 3, coefficient: 0.65, region: "China" },
  "LCK CL": { tier: 3, coefficient: 0.65, region: "Korea" },
  // Tier 4 — ERL Minor + Division 2 + Amateur (coefficient 0.45)
  ROL: { tier: 4, coefficient: 0.45, region: "Benelux" },
  NLC: { tier: 4, coefficient: 0.45, region: "UK & Nordics" },
  LPLOL: { tier: 4, coefficient: 0.45, region: "Portugal" },
  EBL: { tier: 4, coefficient: 0.45, region: "Balkans" },
  HLL: { tier: 4, coefficient: 0.45, region: "Greece & Cyprus" },
  LIT: { tier: 4, coefficient: 0.45, region: "Italy" },
  RL: { tier: 4, coefficient: 0.45, region: "Poland & Baltics" },
  AL: { tier: 4, coefficient: 0.45, region: "Arabia" },
  HM: { tier: 4, coefficient: 0.45, region: "Czech & Slovakia" },
  LFL2: { tier: 4, coefficient: 0.45, region: "France" },
  PRM2: { tier: 4, coefficient: 0.45, region: "DACH" },
  Amateur: { tier: 4, coefficient: 0.45, region: "Various" },
};

export const TIER_COLORS: Record<string, string> = {
  "T1": "text-amber-300 bg-amber-300/10 border-amber-300/30",
  "T2": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "T3": "text-orange-400 bg-orange-400/10 border-orange-400/30",
  "T4": "text-slate-400 bg-slate-400/10 border-slate-400/30",
};

// Rank colors for SoloQ display
export const RANK_COLORS: Record<string, string> = {
  IRON: "text-[#6C757D]",
  BRONZE: "text-amber-700",
  SILVER: "text-slate-400",
  GOLD: "text-yellow-500",
  PLATINUM: "text-cyan-400",
  EMERALD: "text-emerald-400",
  DIAMOND: "text-blue-400",
  MASTER: "text-pink-400",
  GRANDMASTER: "text-red-500",
  CHALLENGER: "text-blue-300",
};

export const RANK_BG_COLORS: Record<string, string> = {
  IRON: "bg-gray-500/10",
  BRONZE: "bg-amber-700/10",
  SILVER: "bg-slate-400/10",
  GOLD: "bg-yellow-500/10",
  PLATINUM: "bg-cyan-400/10",
  EMERALD: "bg-emerald-400/10",
  DIAMOND: "bg-blue-400/10",
  MASTER: "bg-pink-400/10",
  GRANDMASTER: "bg-red-500/10",
  CHALLENGER: "bg-blue-300/10",
};

export const STATUSES = [
  { value: "FREE_AGENT", label: "Free Agent" },
  { value: "UNDER_CONTRACT", label: "Under Contract" },
  { value: "ACADEMY", label: "Academy" },
  { value: "SUB", label: "Substitute" },
  { value: "SCOUTING", label: "Scouting" },
];

export const BEHAVIOR_TAGS = [
  "Aggressive Laner",
  "Safe Farmer",
  "Vision Control",
  "OTP",
  "Chameleon",
  "Shotcaller",
  "Mechanical",
  "Macro Mind",
  "Teamfight King",
  "Splitpush Threat",
  "Roamer",
  "Lane Dominator",
  "Weakside Specialist",
  "Clutch",
  "Tilt Prone",
  "High Ceiling",
  "Proven Winner",
  "Fast Learner",
  "Veteran",
  "Youth Prospect",
] as const;

// Positive tags (strengths)
const POSITIVE_TAG_STYLE = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
// Negative tags (concerns)
const NEGATIVE_TAG_STYLE = "bg-red-500/20 text-red-400 border-red-500/30";
// Neutral tags
const NEUTRAL_TAG_STYLE = "bg-slate-500/20 text-slate-400 border-slate-500/30";

export const BEHAVIOR_TAG_COLORS: Record<string, string> = {
  // Positive tags
  "Team Player": POSITIVE_TAG_STYLE,
  "Vision Control": POSITIVE_TAG_STYLE,
  "Shotcaller": POSITIVE_TAG_STYLE,
  "Mechanical": POSITIVE_TAG_STYLE,
  "Macro Mind": POSITIVE_TAG_STYLE,
  "Teamfight King": POSITIVE_TAG_STYLE,
  "Clutch": POSITIVE_TAG_STYLE,
  "Proven Winner": POSITIVE_TAG_STYLE,
  "Fast Learner": POSITIVE_TAG_STYLE,
  "Weakside Specialist": POSITIVE_TAG_STYLE,
  "Safe Farmer": POSITIVE_TAG_STYLE,
  "Lane Dominator": POSITIVE_TAG_STYLE,
  // Negative tags
  "Tilt Prone": NEGATIVE_TAG_STYLE,
  "Inconsistent": NEGATIVE_TAG_STYLE,
  "OTP": NEGATIVE_TAG_STYLE,
  // Neutral tags
  "Aggressive Laner": NEUTRAL_TAG_STYLE,
  "Chameleon": NEUTRAL_TAG_STYLE,
  "Splitpush Threat": NEUTRAL_TAG_STYLE,
  "Roamer": NEUTRAL_TAG_STYLE,
  "High Ceiling": NEUTRAL_TAG_STYLE,
  "Veteran": NEUTRAL_TAG_STYLE,
  "Youth Prospect": NEUTRAL_TAG_STYLE,
};
