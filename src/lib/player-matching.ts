/**
 * Player Name Matching — Fuzzy match + name mapping
 *
 * Gère les variations de noms entre sources :
 * - Hiro → H1ro
 * - KKT → Karim KT
 * - Saken → SAKEN
 * - minuscules/majuscules
 * - espaces extra
 */

// Mapping manuel des noms problématiques
export const NAME_MAPPING: Record<string, string> = {
  // Variations connues
  "Hiro": "H1ro",
  "KKT": "Karim KT",
  "Saken": "SAKEN",
  "Adam": "ADAM",
  // Ajouter au besoin
};

/**
 * Normalise un nom pour la comparaison
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, ""); // Enlever caractères spéciaux
}

/**
 * Distance de Levenshtein — pour le fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // suppression
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Similarité entre deux noms (0-1)
 */
function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);

  if (na === nb) return 1;

  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(na, nb);
  return 1 - distance / maxLen;
}

/**
 * Trouve le meilleur match pour un nom dans une liste
 *
 * @param name Nom à chercher
 * @param candidates Liste des noms candidats
 * @param threshold Seuil de similarité minimum (défaut: 0.8)
 * @returns Le meilleur match ou null
 */
export function findBestMatch(
  name: string,
  candidates: string[],
  threshold = 0.8
): { name: string; similarity: number } | null {
  // D'abord vérifier le mapping exact
  if (NAME_MAPPING[name]) {
    const mapped = NAME_MAPPING[name];
    const match = candidates.find((c) => c === mapped);
    if (match) {
      return { name: match, similarity: 1 };
    }
  }

  // Vérifier le mapping inverse
  for (const [original, mapped] of Object.entries(NAME_MAPPING)) {
    if (mapped === name) {
      const match = candidates.find((c) => c === original);
      if (match) {
        return { name: match, similarity: 1 };
      }
    }
  }

  // Fuzzy matching
  let bestMatch: { name: string; similarity: number } | null = null;

  for (const candidate of candidates) {
    const sim = nameSimilarity(name, candidate);
    if (sim >= threshold && (!bestMatch || sim > bestMatch.similarity)) {
      bestMatch = { name: candidate, similarity: sim };
    }
  }

  return bestMatch;
}

/**
 * Match tous les joueurs d'une source contre une autre
 *
 * @param sourceNames Noms dans la source (ex: GOL.gg)
 * @param targetNames Noms dans la cible (ex: BDD ou Oracle's)
 * @returns Mapping {sourceName → targetName}
 */
export function matchPlayerNames(
  sourceNames: string[],
  targetNames: string[]
): {
  matches: Record<string, string>;
  unmatched: string[];
  ambiguous: Array<{ source: string; candidates: string[] }>;
} {
  const matches: Record<string, string> = {};
  const unmatched: string[] = [];
  const ambiguous: Array<{ source: string; candidates: string[] }> = [];

  const usedTargets = new Set<string>();

  for (const sourceName of sourceNames) {
    // Vérifier mapping exact
    if (NAME_MAPPING[sourceName]) {
      const mapped = NAME_MAPPING[sourceName];
      if (targetNames.includes(mapped) && !usedTargets.has(mapped)) {
        matches[sourceName] = mapped;
        usedTargets.add(mapped);
        continue;
      }
    }

    // Fuzzy match
    const candidates = targetNames.filter((t) => !usedTargets.has(t));
    const bestMatch = findBestMatch(sourceName, candidates, 0.75);

    if (bestMatch) {
      // Vérifier s'il n'y a pas d'ambiguïté (plusieurs matchs proches)
      const closeMatches = candidates
        .map((c) => ({ name: c, similarity: nameSimilarity(sourceName, c) }))
        .filter((c) => c.similarity >= 0.7 && c.similarity < bestMatch.similarity + 0.05)
        .sort((a, b) => b.similarity - a.similarity);

      if (closeMatches.length > 1) {
        ambiguous.push({
          source: sourceName,
          candidates: closeMatches.map((c) => c.name),
        });
      }

      matches[sourceName] = bestMatch.name;
      usedTargets.add(bestMatch.name);
    } else {
      unmatched.push(sourceName);
    }
  }

  return { matches, unmatched, ambiguous };
}

/**
 * Ajoute un mapping de nom
 */
export function addNameMapping(from: string, to: string): void {
  NAME_MAPPING[from] = to;
}

/**
 * Retourne tous les mappings connus
 */
export function getNameMappings(): Record<string, string> {
  return { ...NAME_MAPPING };
}
