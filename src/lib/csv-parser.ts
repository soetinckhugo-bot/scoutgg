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
  };
}
