/**
 * Import Validator — Sanity checks après import CSV
 *
 * Vérifie la cohérence des données importées :
 * - KDA calculable et cohérent
 * - Pas de valeurs négatives où il ne faut pas
 * - Stats avancées présentes (GD@15, CSD@15, etc.)
 * - Minimum de games
 * - Pas de doublons
 */

import { db } from "./server/db";

export interface ValidationIssue {
  type: "error" | "warning" | "info";
  player: string;
  field: string;
  message: string;
  value?: any;
  expected?: any;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: {
    totalPlayers: number;
    playersWithIssues: number;
    errors: number;
    warnings: number;
    infos: number;
  };
}

// ============================================================================
// RÈGLES DE VALIDATION
// ============================================================================

const RULES = {
  // Champs qui ne doivent jamais être négatifs
  nonNegative: [
    "gamesPlayed", "k", "d", "a", "kda",
    "cspm", "dpm", "egpm", "gpm",
    "gdAt10", "xpdAt10", "csdAt10",
    "gdAt15", "xpdAt15", "csdAt15",
    "wpm", "cwpm", "wcpm", "vwpm", "vspm",
    "avgKills", "avgDeaths", "avgAssists",
    "avgWpm", "avgWcpm", "avgVwpm",
    "csm", "tdpg", "stl",
    "soloKills", "pentaKills", "fbVictim",
  ],

  // Pourcentages doivent être entre 0 et 1 (ou 0 et 100)
  percentages: [
    "kpPercent", "ksPercent", "dthPercent",
    "fbPercent", "damagePercent", "goldPercent",
    "vsPercent", "csPercentAt15", "dPercentAt15",
    "ctrPercent",
  ],

  // Stats avancées importantes (devraient être présentes)
  advancedStats: [
    "gdAt15", "csdAt15", "xpdAt15",
    "vspm", "wpm", "cwpm", "wcpm",
  ],

  // Seuils de games minimum
  minGames: 3,

  // KDA max raisonnable (au-dessus = suspect)
  maxKda: 15,

  // DPM min/max raisonnables
  minDpm: 100,
  maxDpm: 8000,
};

// ============================================================================
// VALIDATION
// ============================================================================

export async function validateImport(league: string): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  // Récupérer tous les joueurs de la ligue avec leurs stats
  const players = await db.player.findMany({
    where: { league },
    include: { proStats: true },
  });

  if (players.length === 0) {
    return {
      valid: false,
      issues: [{
        type: "error",
        player: "—",
        field: "—",
        message: `Aucun joueur trouvé pour la ligue ${league}`,
      }],
      summary: {
        totalPlayers: 0,
        playersWithIssues: 0,
        errors: 1,
        warnings: 0,
        infos: 0,
      },
    };
  }

  // Vérifier les doublons
  const nameCounts: Record<string, number> = {};
  for (const p of players) {
    nameCounts[p.pseudo] = (nameCounts[p.pseudo] || 0) + 1;
  }
  for (const [name, count] of Object.entries(nameCounts)) {
    if (count > 1) {
      issues.push({
        type: "error",
        player: name,
        field: "pseudo",
        message: `Doublon détecté: ${count} joueurs avec le même pseudo`,
      });
    }
  }

  for (const player of players) {
    const stats = player.proStats;
    if (!stats) {
      issues.push({
        type: "error",
        player: player.pseudo,
        field: "proStats",
        message: "Pas de stats pro pour ce joueur",
      });
      continue;
    }

    // 1. Vérifier minimum de games
    if (!stats.gamesPlayed || stats.gamesPlayed < RULES.minGames) {
      issues.push({
        type: "warning",
        player: player.pseudo,
        field: "gamesPlayed",
        message: `Seulement ${stats.gamesPlayed || 0} games (min recommandé: ${RULES.minGames})`,
        value: stats.gamesPlayed,
      });
    }

    // 2. Vérifier KDA cohérent
    if (stats.k !== null && stats.d !== null && stats.a !== null && stats.d > 0) {
      const calculatedKda = (stats.k + stats.a) / stats.d;
      if (stats.kda !== null && stats.kda > 0) {
        const diff = Math.abs(calculatedKda - stats.kda);
        if (diff > 0.5) {
          issues.push({
            type: "warning",
            player: player.pseudo,
            field: "kda",
            message: `KDA incohérent: stocké=${stats.kda.toFixed(2)}, calculé=${calculatedKda.toFixed(2)}`,
            value: stats.kda,
            expected: calculatedKda,
          });
        }
      }
      if (calculatedKda > RULES.maxKda) {
        issues.push({
          type: "warning",
          player: player.pseudo,
          field: "kda",
          message: `KDA suspectement élevé: ${calculatedKda.toFixed(2)}`,
          value: calculatedKda,
        });
      }
    }

    // 3. Vérifier valeurs négatives
    for (const field of RULES.nonNegative) {
      const value = stats[field as keyof typeof stats] as number | null;
      if (value !== null && value < 0) {
        issues.push({
          type: "error",
          player: player.pseudo,
          field,
          message: `Valeur négative interdite: ${value}`,
          value,
        });
      }
    }

    // 4. Vérifier pourcentages
    for (const field of RULES.percentages) {
      const value = stats[field as keyof typeof stats] as number | null;
      if (value !== null) {
        // Les pourcentages peuvent être stockés comme 0-1 ou 0-100
        const maxVal = value > 1 ? 100 : 1;
        if (value < 0 || value > maxVal) {
          issues.push({
            type: "error",
            player: player.pseudo,
            field,
            message: `Pourcentage hors limites: ${value} (attendu: 0-${maxVal})`,
            value,
          });
        }
      }
    }

    // 5. Vérifier DPM raisonnable
    if (stats.dpm !== null) {
      if (stats.dpm < RULES.minDpm) {
        issues.push({
          type: "warning",
          player: player.pseudo,
          field: "dpm",
          message: `DPM très faible: ${stats.dpm} (min attendu: ~${RULES.minDpm})`,
          value: stats.dpm,
        });
      }
      if (stats.dpm > RULES.maxDpm) {
        issues.push({
          type: "warning",
          player: player.pseudo,
          field: "dpm",
          message: `DPM très élevé: ${stats.dpm} (max attendu: ~${RULES.maxDpm})`,
          value: stats.dpm,
        });
      }
    }

    // 6. Vérifier stats avancées manquantes
    const missingAdvanced = RULES.advancedStats.filter(
      (field) => stats[field as keyof typeof stats] === null
    );
    if (missingAdvanced.length > 0 && missingAdvanced.length === RULES.advancedStats.length) {
      issues.push({
        type: "info",
        player: player.pseudo,
        field: "advancedStats",
        message: `Aucune stat avancée (GD@15, CSD@15, Vision...) — probablement source Oracle's uniquement`,
      });
    } else if (missingAdvanced.length > 0) {
      issues.push({
        type: "info",
        player: player.pseudo,
        field: "advancedStats",
        message: `Stats avancées partiellement manquantes: ${missingAdvanced.join(", ")}`,
      });
    }

    // 7. Vérifier rôle
    const validRoles = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
    if (!validRoles.includes(player.role)) {
      issues.push({
        type: "warning",
        player: player.pseudo,
        field: "role",
        message: `Rôle non standard: ${player.role}`,
        value: player.role,
      });
    }
  }

  // Compter les issues par type
  const errors = issues.filter((i) => i.type === "error").length;
  const warnings = issues.filter((i) => i.type === "warning").length;
  const infos = issues.filter((i) => i.type === "info").length;

  // Joueurs avec au moins une issue
  const playersWithIssues = new Set(issues.map((i) => i.player)).size;

  return {
    valid: errors === 0,
    issues,
    summary: {
      totalPlayers: players.length,
      playersWithIssues,
      errors,
      warnings,
      infos,
    },
  };
}

/**
 * Valide un fichier CSV avant import (sans toucher à la BDD)
 */
export function validateCsvBeforeImport(
  rows: Array<Record<string, any>>
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (rows.length === 0) {
    return {
      valid: false,
      issues: [{
        type: "error",
        player: "—",
        field: "—",
        message: "CSV vide",
      }],
      summary: {
        totalPlayers: 0,
        playersWithIssues: 0,
        errors: 1,
        warnings: 0,
        infos: 0,
      },
    };
  }

  // Vérifier les headers requis
  const firstRow = rows[0];
  const requiredFields = ["Player", "Pos"];
  const missingFields = requiredFields.filter(
    (f) => !(f in firstRow) && !(f.toLowerCase() in firstRow)
  );

  if (missingFields.length > 0) {
    issues.push({
      type: "error",
      player: "—",
      field: "headers",
      message: `Champs requis manquants: ${missingFields.join(", ")}`,
    });
  }

  // Vérifier les doublons
  const nameCounts: Record<string, number> = {};
  for (const row of rows) {
    const name = row.Player || row.player || row.name || "";
    if (name) {
      nameCounts[name] = (nameCounts[name] || 0) + 1;
    }
  }
  for (const [name, count] of Object.entries(nameCounts)) {
    if (count > 1) {
      issues.push({
        type: "error",
        player: name,
        field: "Player",
        message: `Doublon: ${count} lignes pour ce joueur`,
      });
    }
  }

  for (const row of rows) {
    const playerName = row.Player || row.player || row.name || "Unknown";
    const games = parseInt(row.Games || row.games || "0") || 0;

    if (games < RULES.minGames) {
      issues.push({
        type: "warning",
        player: playerName,
        field: "Games",
        message: `Seulement ${games} games (min recommandé: ${RULES.minGames})`,
        value: games,
      });
    }

    // Vérifier KDA
    const k = parseFloat(row.K || row.k || "0") || 0;
    const d = parseFloat(row.D || row.d || "0") || 0;
    const a = parseFloat(row.A || row.a || "0") || 0;
    const kda = parseFloat(row.KDA || row.kda || "0") || 0;

    if (d > 0) {
      const calculatedKda = (k + a) / d;
      if (kda > 0 && Math.abs(calculatedKda - kda) > 0.5) {
        issues.push({
          type: "warning",
          player: playerName,
          field: "KDA",
          message: `KDA incohérent: CSV=${kda}, calculé=${calculatedKda.toFixed(2)}`,
          value: kda,
          expected: calculatedKda,
        });
      }
    }
  }

  const errors = issues.filter((i) => i.type === "error").length;
  const warnings = issues.filter((i) => i.type === "warning").length;
  const infos = issues.filter((i) => i.type === "info").length;

  return {
    valid: errors === 0,
    issues,
    summary: {
      totalPlayers: rows.length,
      playersWithIssues: new Set(issues.map((i) => i.player)).size,
      errors,
      warnings,
      infos,
    },
  };
}
