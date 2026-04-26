/**
 * League of Legends game asset URLs and mappings
 * Uses DataDragon CDN for icons
 */

const DDRAGON_PATCH = "15.8.1";

// ─── Champion Icons ───
export function getChampionIconUrl(championName: string): string {
  const id = getChampionId(championName);
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_PATCH}/img/champion/${id}.png`;
}

const CHAMPION_ID_MAP: Record<string, string> = {
  "Wukong": "MonkeyKing",
  "Nunu & Willump": "Nunu",
  "Renata Glasc": "Renata",
  "K'Sante": "KSante",
  "Kai'Sa": "Kaisa",
  "Kha'Zix": "Khazix",
  "Cho'Gath": "Chogath",
  "Vel'Koz": "Velkoz",
  "Rek'Sai": "RekSai",
  "LeBlanc": "Leblanc",
  "Dr. Mundo": "DrMundo",
  "Jarvan IV": "JarvanIV",
  "Lee Sin": "LeeSin",
  "Miss Fortune": "MissFortune",
  "Tahm Kench": "TahmKench",
  "Twisted Fate": "TwistedFate",
  "Xin Zhao": "XinZhao",
};

export function getChampionId(name: string): string {
  const mapped = CHAMPION_ID_MAP[name];
  if (mapped) return mapped;
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().replace(/[^a-zA-Z]/g, "");
}

// ─── Item Icons ───
export function getItemIconUrl(itemId: string | number): string {
  const id = typeof itemId === "string" ? itemId : itemId.toString();
  if (id === "0" || id === "") return "";
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_PATCH}/img/item/${id}.png`;
}

// ─── Summoner Spell Icons ───
const SUMMONER_SPELL_MAP: Record<number, string> = {
  1: "SummonerBoost",      // Cleanse
  3: "SummonerExhaust",    // Exhaust
  4: "SummonerFlash",      // Flash
  6: "SummonerHaste",      // Ghost
  7: "SummonerHeal",       // Heal
  11: "SummonerSmite",     // Smite
  12: "SummonerTeleport",  // Teleport
  13: "SummonerMana",      // Clarity
  14: "SummonerDot",       // Ignite
  21: "SummonerBarrier",   // Barrier
  32: "SummonerSnowball",  // Mark (ARAM)
};

export function getSummonerSpellName(spellId: number): string {
  return SUMMONER_SPELL_MAP[spellId] || "";
}

export function getSummonerSpellIconUrl(spellName: string): string {
  if (!spellName) return "";
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_PATCH}/img/spell/${spellName}.png`;
}

export function getSummonerSpellIconUrlById(spellId: number): string {
  const name = getSummonerSpellName(spellId);
  return getSummonerSpellIconUrl(name);
}

// ─── Rune Icons ───
// Keystone rune IDs → icon paths
const KEYSTONE_RUNE_MAP: Record<number, string> = {
  // Precision
  8005: "Precision/PressTheAttack/PressTheAttack",
  8008: "Precision/LethalTempo/LethalTempoTemp",
  8021: "Precision/FleetFootwork/FleetFootwork",
  8010: "Precision/Conqueror/Conqueror",
  // Domination
  8112: "Domination/Electrocute/Electrocute",
  8124: "Domination/Predator/Predator",
  8128: "Domination/DarkHarvest/DarkHarvest",
  9923: "Domination/HailOfBlades/HailOfBlades",
  // Sorcery
  8214: "Sorcery/SummonAery/SummonAery",
  8229: "Sorcery/ArcaneComet/ArcaneComet",
  8230: "Sorcery/PhaseRush/PhaseRush",
  // Resolve
  8437: "Resolve/GraspOfTheUndying/GraspOfTheUndying",
  8439: "Resolve/VeteranAftershock/VeteranAftershock",
  8465: "Resolve/Guardian/Guardian",
  // Inspiration
  8351: "Inspiration/GlacialAugment/GlacialAugment",
  8360: "Inspiration/UnsealedSpellbook/UnsealedSpellbook",
  8369: "Inspiration/FirstStrike/FirstStrike",
};

// Secondary style IDs → icon paths
const SECONDARY_STYLE_MAP: Record<number, string> = {
  8000: "7201_Precision",
  8100: "7200_Domination",
  8200: "7202_Sorcery",
  8300: "7203_Whimsy",
  8400: "7204_Resolve",
};

export function getKeystoneRuneIconUrl(runeId: number): string {
  const path = KEYSTONE_RUNE_MAP[runeId];
  if (!path) return "";
  return `https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/${path}.png`;
}

export function getSecondaryRuneIconUrl(styleId: number): string {
  const path = SECONDARY_STYLE_MAP[styleId];
  if (!path) return "";
  return `https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/${path}.png`;
}
