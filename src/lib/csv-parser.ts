/**
 * GOL.gg CSV Parser — Full 46-column support
 * Maps all GOL.gg CSV columns to our database schema
 */

export interface CsvPlayerRow {
  Player: string;
  Team: string;
  Pos: string;
  Games: string;
  "W%": string;
  "CTR%": string;
  K: string;
  D: string;
  A: string;
  KDA: string;
  KP: string;
  "KS%": string;
  "DTH%": string;
  "FB%": string;
  "FB Victim": string;
  GD10: string;
  XPD10: string;
  CSD10: string;
  CSPM: string;
  "CS%P15": string;
  DPM: string;
  "DMG%": string;
  "D%P15": string;
  TDPG: string;
  EGPM: string;
  "GOLD%": string;
  STL: string;
  WPM: string;
  CWPM: string;
  WCPM: string;
  "Avg kills": string;
  "Avg deaths": string;
  "Avg assists": string;
  CSM: string;
  "VS%": string;
  VSPM: string;
  "Avg WPM": string;
  "Avg WCPM": string;
  "Avg VWPM": string;
  "GD@15": string;
  "CSD@15": string;
  "XPD@15": string;
  "Penta Kills": string;
  "Solo Kills": string;
}

// ============================================================================
// CSV METRIC DETECTION — auto-detect which metrics are present in the file
// ============================================================================

/**
 * Detect which metrics are present in the CSV rows by checking non-empty values.
 * Returns the metric keys (using the CsvPlayerRow key names).
 */
export function detectCsvMetrics(rows: CsvPlayerRow[]): string[] {
  const metrics = new Set<string>();
  for (const row of rows) {
    for (const [key, val] of Object.entries(row)) {
      if (key === "Player" || key === "Team" || key === "Pos") continue;
      if (val && val.trim() !== "" && val.trim() !== "-") {
        metrics.add(key);
      }
    }
  }
  return Array.from(metrics);
}

function parseNumber(val: string | undefined): number | null {
  if (!val || val.trim() === "" || val.trim() === "-") return null;
  const n = parseFloat(val.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

function parseIntOrNull(val: string | undefined): number | null {
  if (!val || val.trim() === "" || val.trim() === "-") return null;
  const n = parseInt(val.replace(/,/g, ""), 10);
  return isNaN(n) ? null : n;
}

function parsePercent(val: string | undefined): number | null {
  if (!val || val.trim() === "" || val.trim() === "-") return null;
  const clean = val.replace(/%/g, "").trim();
  const n = parseFloat(clean);
  return isNaN(n) ? null : n / 100;
}

export function normalizeRole(pos: string): string {
  const map: Record<string, string> = {
    Top: "TOP",
    Jungle: "JUNGLE",
    Middle: "MID",
    MIDDLE: "MID",
    ADC: "ADC",
    Support: "SUPPORT",
    TOP: "TOP",
    JUNGLE: "JUNGLE",
    MID: "MID",
    JGL: "JUNGLE",
    SUP: "SUPPORT",
    SUPP: "SUPPORT",
    BOT: "ADC",
    MARKSMAN: "ADC",
    UTILITY: "SUPPORT",
  };
  return map[pos.trim().toUpperCase()] || pos.toUpperCase();
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsv(content: string): CsvPlayerRow[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: CsvPlayerRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row as unknown as CsvPlayerRow);
  }

  return rows;
}

export interface ParsedProStats {
  gamesPlayed: number | null;
  k: number | null;
  d: number | null;
  a: number | null;
  kda: number | null;
  kpPercent: number | null;
  ksPercent: number | null;
  dthPercent: number | null;
  fbPercent: number | null;
  fbVictim: number | null;
  soloKills: number | null;
  pentaKills: number | null;
  ctrPercent: number | null;
  gdAt10: number | null;
  xpdAt10: number | null;
  csdAt10: number | null;
  gdAt15: number | null;
  xpdAt15: number | null;
  csdAt15: number | null;
  cspm: number | null;
  csm: number | null;
  csPercentAt15: number | null;
  dpm: number | null;
  damagePercent: number | null;
  dPercentAt15: number | null;
  tdpg: number | null;
  egpm: number | null;
  gpm: number | null;
  goldPercent: number | null;
  wpm: number | null;
  cwpm: number | null;
  wcpm: number | null;
  vwpm: number | null;
  vsPercent: number | null;
  vspm: number | null;
  stl: number | null;
  avgKills: number | null;
  avgDeaths: number | null;
  avgAssists: number | null;
  avgWpm: number | null;
  avgWcpm: number | null;
  avgVwpm: number | null;
  winRate: number | null;
}

// ============================================================================
// VALIDATION RULES — ranges réalistes pour chaque statistique
// ============================================================================

export interface ValidationRule {
  min?: number;
  max?: number;
  required?: boolean;
  type: "int" | "float" | "percent" | "string";
}

export interface ValidationError {
  field: string;
  value: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  pseudo: string;
}

export const CSV_VALIDATION_RULES: Record<string, ValidationRule> = {
  Player: { type: "string", required: true },
  Pos: { type: "string", required: true },
  Games: { type: "int", min: 0, max: 200 },
  "W%": { type: "percent", min: 0, max: 1 },
  KDA: { type: "float", min: 0, max: 20 },
  KP: { type: "percent", min: 0, max: 1 },
  "KS%": { type: "percent", min: 0, max: 1 },
  "DTH%": { type: "percent", min: 0, max: 1 },
  "FB%": { type: "percent", min: 0, max: 1 },
  "FB Victim": { type: "percent", min: 0, max: 1 },
  GD10: { type: "float", min: -10000, max: 10000 },
  XPD10: { type: "float", min: -10000, max: 10000 },
  CSD10: { type: "float", min: -500, max: 500 },
  CSPM: { type: "float", min: 0, max: 20 },
  DPM: { type: "float", min: 0, max: 5000 },
  "DMG%": { type: "percent", min: 0, max: 1 },
  "D%P15": { type: "percent", min: 0, max: 1 },
  TDPG: { type: "float", min: 0 },
  EGPM: { type: "float", min: 0 },
  "GOLD%": { type: "percent", min: 0, max: 1 },
  WPM: { type: "float", min: 0, max: 5 },
  CWPM: { type: "float", min: 0, max: 5 },
  WCPM: { type: "float", min: 0, max: 10 },
  "VS%": { type: "percent", min: 0, max: 1 },
  VSPM: { type: "float", min: 0, max: 10 },
  "GD@15": { type: "float", min: -10000, max: 10000 },
  "CSD@15": { type: "float", min: -500, max: 500 },
  "XPD@15": { type: "float", min: -10000, max: 10000 },
  "Penta Kills": { type: "int", min: 0, max: 50 },
  "Solo Kills": { type: "int", min: 0, max: 200 },
  "Avg kills": { type: "float", min: 0, max: 20 },
  "Avg deaths": { type: "float", min: 0, max: 15 },
  "Avg assists": { type: "float", min: 0, max: 25 },
};

export function validateCsvRow(row: CsvPlayerRow, lineNumber: number): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const pseudo = row.Player?.trim() || `Ligne ${lineNumber}`;

  // Vérification pseudo
  if (!row.Player || row.Player.trim() === "") {
    errors.push({ field: "Player", value: row.Player || "", message: "Pseudo manquant" });
  }

  // Vérification rôle
  const normalizedRole = normalizeRole(row.Pos || "");
  const validRoles = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
  if (!validRoles.includes(normalizedRole)) {
    errors.push({ field: "Pos", value: row.Pos, message: `Rôle invalide: "${row.Pos}"` });
  }

  // Vérification nombre de games (warning si < 5)
  const games = parseIntOrNull(row.Games);
  if (games !== null && games < 5) {
    warnings.push({ field: "Games", value: row.Games, message: `Seulement ${games} games — score peu fiable` });
  }

  // Validation des règles numériques
  for (const [field, rule] of Object.entries(CSV_VALIDATION_RULES)) {
    if (rule.type === "string") continue;

    const rawValue = (row as any)[field] as string | undefined;
    if (!rawValue || rawValue.trim() === "" || rawValue.trim() === "-") continue;

    let value: number | null = null;
    if (rule.type === "percent") value = parsePercent(rawValue);
    else if (rule.type === "int") value = parseIntOrNull(rawValue);
    else value = parseNumber(rawValue);

    if (value === null) {
      errors.push({ field, value: rawValue, message: `Valeur non numérique: "${rawValue}"` });
      continue;
    }

    if (rule.min !== undefined && value < rule.min) {
      errors.push({ field, value: rawValue, message: `Trop bas: ${value} (min: ${rule.min})` });
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push({ field, value: rawValue, message: `Trop haut: ${value} (max: ${rule.max})` });
    }
  }

  return { valid: errors.length === 0, errors, warnings, pseudo };
}

export function findDuplicatePlayers(rows: CsvPlayerRow[]): string[] {
  const seen = new Map<string, number[]>();
  const duplicates: string[] = [];

  rows.forEach((row, idx) => {
    const pseudo = row.Player?.trim();
    if (!pseudo) return;
    if (!seen.has(pseudo)) seen.set(pseudo, []);
    seen.get(pseudo)!.push(idx + 2); // +2 car ligne 1 = header
  });

  for (const [pseudo, lines] of seen) {
    if (lines.length > 1) {
      duplicates.push(`${pseudo} (lignes ${lines.join(", ")})`);
    }
  }

  return duplicates;
}

export function parseProStatsFromRow(row: CsvPlayerRow): ParsedProStats {
  return {
    gamesPlayed: parseIntOrNull(row.Games),
    k: parseNumber(row.K),
    d: parseNumber(row.D),
    a: parseNumber(row.A),
    kda: parseNumber(row.KDA),
    kpPercent: parsePercent(row.KP),
    ksPercent: parsePercent(row["KS%"]),
    dthPercent: parsePercent(row["DTH%"]),
    fbPercent: parsePercent(row["FB%"]),
    fbVictim: parsePercent(row["FB Victim"]),
    soloKills: parseNumber(row["Solo Kills"]),
    pentaKills: parseNumber(row["Penta Kills"]),
    ctrPercent: parsePercent(row["CTR%"]),
    gdAt10: parseNumber(row.GD10),
    xpdAt10: parseNumber(row.XPD10),
    csdAt10: parseNumber(row.CSD10),
    gdAt15: parseNumber(row["GD@15"]),
    xpdAt15: parseNumber(row["XPD@15"]),
    csdAt15: parseNumber(row["CSD@15"]),
    cspm: parseNumber(row.CSPM),
    csm: parseNumber(row.CSM),
    csPercentAt15: parsePercent(row["CS%P15"]),
    dpm: parseNumber(row.DPM),
    damagePercent: parsePercent(row["DMG%"]),
    dPercentAt15: parsePercent(row["D%P15"]),
    tdpg: parseNumber(row.TDPG),
    egpm: parseNumber(row.EGPM),
    gpm: parseNumber(row.EGPM), // EGPM ≈ GPM for now
    goldPercent: parsePercent(row["GOLD%"]),
    wpm: parseNumber(row.WPM),
    cwpm: parseNumber(row.CWPM),
    wcpm: parseNumber(row.WCPM),
    vwpm: parseNumber(row["Avg VWPM"]),
    vsPercent: parsePercent(row["VS%"]),
    vspm: parseNumber(row.VSPM),
    stl: parseNumber(row.STL),
    avgKills: parseNumber(row["Avg kills"]),
    avgDeaths: parseNumber(row["Avg deaths"]),
    avgAssists: parseNumber(row["Avg assists"]),
    avgWpm: parseNumber(row["Avg WPM"]),
    avgWcpm: parseNumber(row["Avg WCPM"]),
    avgVwpm: parseNumber(row["Avg VWPM"]),
    winRate: parsePercent(row["W%"]),
  };
}
