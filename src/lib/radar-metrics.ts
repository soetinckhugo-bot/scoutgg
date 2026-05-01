/**
 * LeagueScout Legacy — Role-Based Radar Metrics System
 * Migrated from RADARHUGOV1/src/web/app.js
 *
 * Defines per-role metrics with coefficients, labels, and inversion flags.
 * Also includes the metric lexicon (definitions) and fuzzy matching utilities.
 */

export interface MetricDef {
  key: string;
  label: string;
  inverted: boolean;
  coeff: number;
}

export interface RoleMetricSet {
  name: string;
  icon: string;
  metrics: MetricDef[];
}

// ============================================================================
// ROLE METRICS — migrated from legacy roleMetrics object
// ============================================================================

export const ROLE_METRICS: Record<string, RoleMetricSet> = {
  all: {
    name: "All Metrics",
    icon: "asterisk",
    metrics: [],
  },
  TOP: {
    name: "Top",
    icon: "shield",
    metrics: [
      { key: "W%", label: "W%", inverted: false, coeff: 0 },
      { key: "KP", label: "KP", inverted: false, coeff: 1.5 },
      { key: "CTR%", label: "CTR%", inverted: true, coeff: 2 },
      { key: "DTH%", label: "DTH%", inverted: true, coeff: 1.5 },
      { key: "CSPM", label: "CSPM", inverted: false, coeff: 3 },
      { key: "DMG%", label: "DMG%", inverted: false, coeff: 2 },
      { key: "EGPM", label: "EGPM", inverted: false, coeff: 3 },
      { key: "GOLD%", label: "GOLD%", inverted: true, coeff: 0 },
      { key: "FB Victim", label: "FB Victim", inverted: true, coeff: 1.5 },
      { key: "Solo Kills", label: "Solo Kills", inverted: false, coeff: 2 },
      { key: "DPM", label: "DPM", inverted: false, coeff: 1.5 },
      { key: "CSD15", label: "CSD@15", inverted: false, coeff: 2 },
      { key: "CSD10", label: "CSD@10", inverted: false, coeff: 2 },
      { key: "XPD15", label: "XPD@15", inverted: false, coeff: 2 },
      { key: "XPD10", label: "XPD@10", inverted: false, coeff: 2 },
      { key: "GD15", label: "GD@15", inverted: false, coeff: 2 },
      { key: "GD10", label: "GD@10", inverted: false, coeff: 2 },
    ],
  },
  JUNGLE: {
    name: "Jungle",
    icon: "tree",
    metrics: [
      { key: "W%", label: "W%", inverted: false, coeff: 0 },
      { key: "KP", label: "KP", inverted: false, coeff: 2 },
      { key: "DTH%", label: "DTH%", inverted: true, coeff: 1.5 },
      { key: "FB%", label: "FB%", inverted: false, coeff: 2 },
      { key: "D%P15", label: "D%P15", inverted: false, coeff: 1.5 },
      { key: "GOLD%", label: "GOLD%", inverted: true, coeff: 0 },
      { key: "VSPM", label: "VSPM", inverted: false, coeff: 0.5 },
      { key: "VS%", label: "VS%", inverted: false, coeff: 0.5 },
      { key: "WPM", label: "WPM", inverted: false, coeff: 0.5 },
      { key: "CWPM", label: "CWPM", inverted: false, coeff: 0.5 },
      { key: "WCPM", label: "WCPM", inverted: false, coeff: 0.5 },
      { key: "DPM", label: "DPM", inverted: false, coeff: 1.5 },
      { key: "KDA", label: "KDA", inverted: false, coeff: 2 },
      { key: "FB Victim", label: "FB Victim", inverted: true, coeff: 2 },
      { key: "CSD15", label: "CSD@15", inverted: false, coeff: 2 },
      { key: "CSD10", label: "CSD@10", inverted: false, coeff: 2 },
      { key: "XPD15", label: "XPD@15", inverted: false, coeff: 2 },
      { key: "XPD10", label: "XPD@10", inverted: false, coeff: 2 },
      { key: "GD15", label: "GD@15", inverted: false, coeff: 2 },
      { key: "GD10", label: "GD@10", inverted: false, coeff: 2 },
    ],
  },
  MID: {
    name: "Mid",
    icon: "bolt",
    metrics: [
      { key: "W%", label: "W%", inverted: false, coeff: 0 },
      { key: "KP", label: "KP", inverted: false, coeff: 1 },
      { key: "KS%", label: "KS%", inverted: false, coeff: 1.5 },
      { key: "DTH%", label: "DTH%", inverted: true, coeff: 1.5 },
      { key: "FB%", label: "FB%", inverted: false, coeff: 1 },
      { key: "CSPM", label: "CSPM", inverted: false, coeff: 2 },
      { key: "DMG%", label: "DMG%", inverted: false, coeff: 1.5 },
      { key: "EGPM", label: "EGPM", inverted: false, coeff: 2 },
      { key: "GOLD%", label: "GOLD%", inverted: true, coeff: 0 },
      { key: "DPM", label: "DPM", inverted: false, coeff: 2 },
      { key: "CSD15", label: "CSD@15", inverted: false, coeff: 1.5 },
      { key: "CSD10", label: "CSD@10", inverted: false, coeff: 1.5 },
      { key: "XPD15", label: "XPD@15", inverted: false, coeff: 1.5 },
      { key: "XPD10", label: "XPD@10", inverted: false, coeff: 1.5 },
      { key: "GD15", label: "GD@15", inverted: false, coeff: 1.5 },
      { key: "GD10", label: "GD@10", inverted: false, coeff: 1.5 },
      { key: "FB Victim", label: "FB Victim", inverted: true, coeff: 1 },
      { key: "Solo Kills", label: "Solo Kills", inverted: false, coeff: 1.5 },
      { key: "KDA", label: "KDA", inverted: false, coeff: 1.5 },
    ],
  },
  ADC: {
    name: "ADC",
    icon: "crosshair",
    metrics: [
      { key: "W%", label: "W%", inverted: false, coeff: 0 },
      { key: "KP", label: "KP", inverted: false, coeff: 1 },
      { key: "KS%", label: "KS%", inverted: false, coeff: 1.5 },
      { key: "DTH%", label: "DTH%", inverted: true, coeff: 1.5 },
      { key: "CSPM", label: "CSPM", inverted: false, coeff: 2 },
      { key: "CS%P15", label: "CS%P15", inverted: false, coeff: 1 },
      { key: "DPM", label: "DPM", inverted: false, coeff: 2 },
      { key: "DMG%", label: "DMG%", inverted: false, coeff: 1.5 },
      { key: "D%P15", label: "D%P15", inverted: false, coeff: 1 },
      { key: "EGPM", label: "EGPM", inverted: false, coeff: 2 },
      { key: "GOLD%", label: "GOLD%", inverted: true, coeff: 0 },
      { key: "K", label: "K", inverted: false, coeff: 0.5 },
      { key: "D", label: "D", inverted: true, coeff: 0.5 },
      { key: "A", label: "A", inverted: false, coeff: 0.5 },
      { key: "CSD15", label: "CSD@15", inverted: false, coeff: 2 },
      { key: "CSD10", label: "CSD@10", inverted: false, coeff: 1.5 },
      { key: "XPD15", label: "XPD@15", inverted: false, coeff: 2 },
      { key: "XPD10", label: "XPD@10", inverted: false, coeff: 1 },
      { key: "GD15", label: "GD@15", inverted: false, coeff: 2 },
      { key: "GD10", label: "GD@10", inverted: false, coeff: 1.5 },
      { key: "FB Victim", label: "FB Victim", inverted: true, coeff: 1.5 },
      { key: "KDA", label: "KDA", inverted: false, coeff: 2 },
    ],
  },
  SUPPORT: {
    name: "Support",
    icon: "hands-helping",
    metrics: [
      { key: "W%", label: "W%", inverted: false, coeff: 0 },
      { key: "CTR%", label: "CTR%", inverted: true, coeff: 1.5 },
      { key: "D", label: "D", inverted: true, coeff: 1.5 },
      { key: "A", label: "A", inverted: false, coeff: 2 },
      { key: "KP", label: "KP", inverted: false, coeff: 1.5 },
      { key: "DTH%", label: "DTH%", inverted: true, coeff: 1 },
      { key: "FB%", label: "FB%", inverted: false, coeff: 3 },
      { key: "WPM", label: "WPM", inverted: false, coeff: 0.5 },
      { key: "CWPM", label: "CWPM", inverted: false, coeff: 0.5 },
      { key: "WCPM", label: "WCPM", inverted: false, coeff: 0.5 },
      { key: "VS%", label: "VS%", inverted: false, coeff: 0.5 },
      { key: "VSPM", label: "VSPM", inverted: false, coeff: 0.5 },
      { key: "VWPM", label: "VWPM", inverted: false, coeff: 0.5 },
      { key: "GOLD%", label: "Gold%", inverted: false, coeff: 0 },
      { key: "XPD15", label: "XPD@15", inverted: false, coeff: 2 },
      { key: "XPD10", label: "XPD@10", inverted: false, coeff: 1.5 },
      { key: "GD15", label: "GD@15", inverted: false, coeff: 1.5 },
      { key: "GD10", label: "GD@10", inverted: false, coeff: 1 },
      { key: "KDA", label: "KDA", inverted: false, coeff: 2 },
      { key: "FB Victim", label: "FB Victim", inverted: true, coeff: 1 },
    ],
  },
};

/**
 * Get metrics for a specific role
 */
export function getRoleMetrics(role: string): MetricDef[] {
  return ROLE_METRICS[role]?.metrics ?? ROLE_METRICS.all.metrics;
}

/**
 * Get all unique metric keys across all roles
 */
export function getAllMetricKeys(): string[] {
  const keys = new Set<string>();
  Object.values(ROLE_METRICS).forEach((roleSet) => {
    roleSet.metrics.forEach((m) => keys.add(m.key));
  });
  return Array.from(keys);
}

// ============================================================================
// METRIC LEXICON — human-readable definitions
// ============================================================================

export interface LexiconEntry {
  fullName: string;
  description: string;
  category?: "fight" | "vision" | "resources" | "early" | "general";
}

export const METRIC_LEXICON: Record<string, LexiconEntry> = {
  // General / Game
  Player: { fullName: "Player", description: "Player name", category: "general" },
  Team: { fullName: "Team", description: "Team name", category: "general" },
  Pos: { fullName: "Position", description: "Player role", category: "general" },
  Games: { fullName: "Games Played", description: "Total games played", category: "general" },
  GP: { fullName: "Games Played", description: "Number of games played", category: "general" },
  "W%": { fullName: "Win Percentage", description: "Percentage of victories", category: "general" },

  // Combat
  K: { fullName: "Kills", description: "Champions killed", category: "fight" },
  D: { fullName: "Deaths", description: "Number of deaths", category: "fight" },
  A: { fullName: "Assists", description: "Number of assists", category: "fight" },
  KDA: { fullName: "KDA Ratio", description: "(Kills + Assists) / Deaths", category: "fight" },
  KP: { fullName: "Kill Participation", description: "% of team kills the player participated in", category: "fight" },
  "KP%": { fullName: "Kill Participation %", description: "Kill participation percentage", category: "fight" },
  "KS%": { fullName: "Kill Share", description: "% of team kills achieved by this player", category: "fight" },
  "DTH%": { fullName: "Death Share", description: "Average share of team's deaths", category: "fight" },
  "DT%": { fullName: "Damage Taken %", description: "% of damage received by the team", category: "fight" },
  "Solo Kills": { fullName: "Solo Kills", description: "Kills achieved without assistance", category: "fight" },

  // Counter Pick / First Blood
  "CTR%": { fullName: "Counter Pick Rate", description: "% of games where player was counter-picked", category: "general" },
  "FB%": { fullName: "First Blood Rate", description: "% of games where player gets First Blood", category: "fight" },
  "FB Victim": { fullName: "First Blood Victim", description: "Times the player is the first victim", category: "fight" },

  // Gold / Economy
  GPM: { fullName: "Gold Per Minute", description: "Gold earned per minute", category: "resources" },
  EGPM: { fullName: "Earned Gold Per Minute", description: "Gold earned (excluding passives) per minute", category: "resources" },
  "GOLD%": { fullName: "Gold Share", description: "% of total team gold won by this player", category: "resources" },
  "Gold%": { fullName: "Gold Share", description: "% of team gold", category: "resources" },

  // XP
  XPD10: { fullName: "XP Difference @10", description: "XP difference at 10 min vs opponent", category: "early" },
  "XPD@10": { fullName: "XP Difference @10", description: "XP difference at 10 minutes", category: "early" },
  XPD15: { fullName: "XP Difference @15", description: "XP difference at 15 min vs opponent", category: "early" },
  "XPD@15": { fullName: "XP Difference @15", description: "XP difference at 15 minutes", category: "early" },

  // CS / Farming
  CSD10: { fullName: "CS Difference @10", description: "CS difference at 10 min vs opponent", category: "early" },
  "CSD@10": { fullName: "CS Difference @10", description: "CS difference at 10 minutes", category: "early" },
  CSD15: { fullName: "CS Difference @15", description: "CS difference at 15 min vs opponent", category: "early" },
  "CSD@15": { fullName: "CS Difference @15", description: "CS difference at 15 minutes", category: "early" },
  CSPM: { fullName: "CS Per Minute", description: "Creep Score per minute", category: "resources" },
  CSM: { fullName: "CS Per Minute", description: "CS per minute", category: "resources" },
  "CS%P15": { fullName: "CS Share @15", description: "% of team CS at 15 minutes", category: "early" },

  // Damage
  DPM: { fullName: "Damage Per Minute", description: "Damage dealt per minute", category: "fight" },
  "DMG%": { fullName: "Damage Share", description: "% of team damage dealt by this player", category: "fight" },
  DMG: { fullName: "Damage Share", description: "Share of team damage", category: "fight" },
  "D%P15": { fullName: "Damage % @15", description: "% of damage at 15 minutes", category: "early" },

  // Vision
  WPM: { fullName: "Wards Per Minute", description: "Wards placed per minute", category: "vision" },
  CWPM: { fullName: "Control Wards Per Minute", description: "Control wards placed per minute", category: "vision" },
  WCPM: { fullName: "Wards Cleared Per Minute", description: "Enemy wards destroyed per minute", category: "vision" },
  VWPM: { fullName: "Vision Wards Per Minute", description: "Vision wards placed per minute", category: "vision" },
  "VS%": { fullName: "Vision Score Share", description: "Share of team vision score", category: "vision" },
  VS: { fullName: "Vision Score", description: "Total vision score", category: "vision" },
  VSPM: { fullName: "Vision Score Per Minute", description: "Vision score per minute", category: "vision" },

  // Gold Difference
  GD10: { fullName: "Gold Difference @10", description: "Gold difference at 10 min vs opponent", category: "early" },
  "GD@10": { fullName: "Gold Difference @10", description: "Gold difference at 10 minutes", category: "early" },
  GD15: { fullName: "Gold Difference @15", description: "Gold difference at 15 min vs opponent", category: "early" },
  "GD@15": { fullName: "Gold Difference @15", description: "Gold difference at 15 minutes", category: "early" },

  // Special
  STL: { fullName: "Steals", description: "Objectives stolen (Baron, Dragon...)", category: "general" },
  Penta: { fullName: "Pentakills", description: "Pentakills achieved", category: "fight" },
  "Penta Kills": { fullName: "Pentakills", description: "Pentakills", category: "fight" },
  "Avg kills": { fullName: "Average Kills", description: "Kills per game", category: "fight" },
  "Avg deaths": { fullName: "Average Deaths", description: "Deaths per game", category: "fight" },
  "Avg assists": { fullName: "Average Assists", description: "Assists per game", category: "fight" },
  "Avg WPM": { fullName: "Average Wards Per Minute", description: "Wards placed per minute (avg)", category: "vision" },
  "Avg WCPM": { fullName: "Average Wards Cleared Per Minute", description: "Enemy wards destroyed per minute (avg)", category: "vision" },
  "Avg VWPM": { fullName: "Average Vision Wards Per Minute", description: "Vision wards placed per minute (avg)", category: "vision" },
};

/**
 * Look up a metric in the lexicon (case-insensitive)
 */
export function getMetricDefinition(key: string): LexiconEntry | undefined {
  const direct = METRIC_LEXICON[key];
  if (direct) return direct;

  // Case-insensitive search
  const lower = key.toLowerCase();
  for (const [k, v] of Object.entries(METRIC_LEXICON)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}

// ============================================================================
// METRIC DIRECTION — true = higher is better, false = lower is better
// ============================================================================

const METRIC_DIRECTION: Record<string, boolean> = {
  K: true,
  A: true,
  KDA: true,
  KP: true,
  "KP%": true,
  "KS%": true,
  "FB%": true,
  FB: true,
  FBPercent: true,
  "Solo Kills": true,
  GD10: true,
  "GD@10": true,
  GD15: true,
  "GD@15": true,
  GPM: true,
  EGPM: true,
  XPD10: true,
  "XPD@10": true,
  XPD15: true,
  "XPD@15": true,
  CSD10: true,
  "CSD@10": true,
  CSD15: true,
  "CSD@15": true,
  CSPM: true,
  CSM: true,
  "CS%P15": true,
  DPM: true,
  "DMG%": true,
  DMG: true,
  "D%P15": true,
  WPM: true,
  CWPM: true,
  WCPM: true,
  VWPM: true,
  "VS%": true,
  VS: true,
  VSPM: true,
  STL: true,
  Penta: true,
  "Penta Kills": true,
  // Inverted (lower is better)
  D: false,
  "DTH%": false,
  "DT%": false,
  "CTR%": false,
  "FB Victim": false,
  FBVictim: false,
  "GOLD%": false,
  Gold: false,
  "Gold%": false,
  TDPG: false,
  Games: true,
  "Avg kills": true,
  "Avg deaths": false,
  "Avg assists": true,
  "Avg WPM": true,
  "Avg WCPM": true,
  "Avg VWPM": true,
};

/**
 * Check if a metric is "inverted" (lower value = better performance)
 */
export function isInvertedMetric(key: string): boolean {
  if (METRIC_DIRECTION[key] !== undefined) return !METRIC_DIRECTION[key];

  // Case-insensitive fallback
  const lower = key.toLowerCase().replace(/\s/g, "");
  for (const [k, v] of Object.entries(METRIC_DIRECTION)) {
    if (k.toLowerCase().replace(/\s/g, "") === lower) {
      return !v;
    }
  }
  return false; // Default: higher is better
}

// ============================================================================
// FUZZY MATCHING — find metric in available columns
// ============================================================================

const METRIC_VARIATIONS: Record<string, string[]> = {
  winrate: ["winrate", "win%", "w%", "win rate"],
  kda: ["kda", "KDA"],
  kp: ["kp", "kill participation"],
  "ks%": ["ks%", "kill share"],
  "dth%": ["dth%", "death share"],
  "fb%": ["fb%", "first blood %"],
  "fb victim": ["fb victim", "fbvictim"],
  fbvictim: ["fbvictim", "fb victim"],
  cspm: ["cspm", "csm"],
  gpm: ["gpm"],
  egpm: ["egpm", "earned gold per minute"],
  dpm: ["dpm"],
  "dmg%": ["dmg%", "damage%"],
  "gold%": ["gold%", "gold share"],
  "ctr%": ["ctr%", "counter pick rate"],
  "cs%p15": ["cs%p15", "cs%@15", "csp15"],
  "d%p15": ["d%p15", "d%@15"],
  vspm: ["vspm"],
  "vs%": ["vs%", "vision score%"],
  vwpm: ["vwpm", "vswpm", "avg vwpm"],
  wpm: ["wpm"],
  cwpm: ["cwpm"],
  wcpm: ["wcpm"],
  solokills: ["solo kills", "solokills", "solokill", "stl"],
  "solo kills": ["solo kills", "solokills", "solokill", "stl"],
  gd15: ["gd15", "gd@15", "GD15", "GD@15"],
  "gd@15": ["gd15", "gd@15", "GD15", "GD@15"],
  gd10: ["gd10", "gd@10", "GD10", "GD@10"],
  "gd@10": ["gd10", "gd@10", "GD10", "GD@10"],
  csd15: ["csd15", "csd@15", "CSD15", "CSD@15", "cs@15", "csp15", "cs15"],
  "csd@15": ["csd15", "csd@15", "CSD15", "CSD@15", "cs@15", "csp15", "cs15"],
  csd10: ["csd10", "csd@10", "CSD10", "CSD@10", "cs@10", "csp10", "cs10"],
  "csd@10": ["csd10", "csd@10", "CSD10", "CSD@10", "cs@10", "csp10", "cs10"],
  xpd15: ["xpd15", "xpd@15", "XPD15", "XPD@15", "xp@15", "xpp15", "xp15"],
  "xpd@15": ["xpd15", "xpd@15", "XPD15", "XPD@15", "xp@15", "xpp15", "xp15"],
  xpd10: ["xpd10", "xpd@10", "XPD10", "XPD@10", "xp@10", "xpp10", "xp10"],
  "xpd@10": ["xpd10", "xpd@10", "XPD10", "XPD@10", "xp@10", "xpp10", "xp10"],
};

function normalizeMetricName(name: string): string {
  return name.toLowerCase().replace(/\s/g, "");
}

/**
 * Find a matching metric key in a list of available metrics.
 * Supports exact match, case-insensitive, @ variations, and known aliases.
 */
export function findMatchingMetric(key: string, availableMetrics: string[]): string | null {
  if (!key || !availableMetrics?.length) return null;

  // 1. Exact match
  if (availableMetrics.includes(key)) return key;

  // 2. Case-insensitive exact match
  const lowerKey = normalizeMetricName(key);
  const caseMatch = availableMetrics.find((m) => normalizeMetricName(m) === lowerKey);
  if (caseMatch) return caseMatch;

  // 3. @ symbol variations (CSD15 ↔ CSD@15)
  const withAt = lowerKey.replace(/(\d+)$/, "@$1");
  const withoutAt = lowerKey.replace(/@(\d+)$/, "$1");

  for (const test of [withAt, withoutAt]) {
    const match = availableMetrics.find((m) => normalizeMetricName(m) === test);
    if (match) return match;
  }

  // 4. Known variations
  const keysToTry = [lowerKey, withAt, withoutAt];
  for (const k of keysToTry) {
    const variations = METRIC_VARIATIONS[k];
    if (variations) {
      for (const variant of variations) {
        const match = availableMetrics.find((m) => normalizeMetricName(m) === normalizeMetricName(variant));
        if (match) return match;
      }
    }
  }

  // 5. Partial match (last resort)
  for (const k of keysToTry) {
    const partial = availableMetrics.find((m) => {
      const mClean = normalizeMetricName(m);
      return mClean.includes(k) || k.includes(mClean);
    });
    if (partial) return partial;
  }

  return null;
}

// ============================================================================
// TIMEFRAME DETECTION — @10 / @15 patterns
// ============================================================================

const TIMEFRAME_PATTERNS: Record<number, string[]> = {
  10: ["10", "@10", "10min", "gd10", "csd10", "xpd10", "gd@10", "csd@10", "xpd@10"],
  15: ["15", "@15", "15min", "gd15", "csd15", "xpd15", "gd@15", "csd@15", "xpd@15", "csp15", "cs%p15", "d%p15"],
};

export type Timeframe = "all" | "10" | "15" | "compare";

/**
 * Detect if a metric belongs to a specific timeframe (10 or 15 min)
 */
export function detectTimeframe(metric: string): number | null {
  const lower = metric.toLowerCase();

  // Check 15 first (more specific)
  for (const pattern of TIMEFRAME_PATTERNS[15]) {
    if (lower.includes(pattern.toLowerCase())) return 15;
  }

  for (const pattern of TIMEFRAME_PATTERNS[10]) {
    if (lower.includes(pattern.toLowerCase())) return 10;
  }

  return null;
}

/**
 * Filter metrics by timeframe
 */
export function filterMetricsByTimeframe(metrics: string[], timeframe: Timeframe): string[] {
  if (timeframe === "all") return metrics;

  if (timeframe === "10") {
    return metrics.filter((m) => {
      const tf = detectTimeframe(m);
      return tf === 10 || tf === null;
    });
  }

  if (timeframe === "15") {
    return metrics.filter((m) => {
      const tf = detectTimeframe(m);
      return tf === 15 || tf === null;
    });
  }

  if (timeframe === "compare") {
    return metrics.filter((m) => detectTimeframe(m) !== null);
  }

  return metrics;
}

/**
 * Get the base name of a metric (strip @10/@15)
 */
export function getMetricBaseName(metric: string): string {
  return metric
    .replace(/[@]?(10|15)$/i, "")
    .replace(/(10|15)$/i, "")
    .replace(/[@]?(10|15)min$/i, "")
    .trim();
}

/**
 * Find the counterpart metric (10 ↔ 15)
 */
export function findMetricPair(metric: string, allMetrics: string[]): string | null {
  const base = getMetricBaseName(metric);
  const currentTf = detectTimeframe(metric);
  if (!currentTf) return null;

  const targetTf = currentTf === 10 ? 15 : 10;
  return allMetrics.find((m) => detectTimeframe(m) === targetTf && getMetricBaseName(m) === base) ?? null;
}

// ============================================================================
// METRIC CATEGORIES — Fight / Vision / Resources / Early
// ============================================================================

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  fight: ["kda", "kp", "dmg", "dpm", "kill", "kills", "death", "deaths", "assist", "assists", "ks%", "dth%", "solokill", "fb", "ctr", "counter", "tdpg", "fbvictim", "victim", "d%p15", "damage%", "dmg%", "damage %", "stl", "penta"],
  vision: ["vision", "vspm", "vs%", "wpm", "cwpm", "wcpm", "vwpm", "ward"],
  resources: ["cspm", "csm", "gpm", "gold", "egpm", "gold%", "cs%"],
  early: ["gd10", "gd15", "csd10", "csd15", "xpd10", "xpd15", "gd@10", "gd@15", "csd@10", "csd@15", "xpd@10", "xpd@15", "cs%p15", "d%p15"],
};

const EXCLUDED_METRICS = ["steals", "pentakills", "penta", "games", "gamesplayed", "gameplayed", "stl", "winrate", "win", "percentage"];
const EXCLUDED_EXACT = ["gp", "w%"];

/**
 * Categorize metrics into Fight / Vision / Resources / Early
 */
export function getMetricsByCategory(metrics: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    fight: [],
    vision: [],
    resources: [],
    early: [],
    other: [],
  };

  for (const metric of metrics) {
    const lower = metric.toLowerCase().replace(/\s/g, "");

    // Skip excluded
    if (EXCLUDED_EXACT.includes(lower)) continue;
    if (EXCLUDED_METRICS.some((ex) => lower.includes(ex))) continue;

    let categorized = false;
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        categories[cat].push(metric);
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      categories.other.push(metric);
    }
  }

  return categories;
}
