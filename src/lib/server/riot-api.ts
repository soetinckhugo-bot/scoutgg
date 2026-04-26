const RIOT_API_KEY = process.env.RIOT_API_KEY;
console.log("[Riot API] Key loaded:", RIOT_API_KEY ? RIOT_API_KEY.substring(0, 20) + "..." : "MISSING");
const RIOT_REGION = "euw1"; // Europe West for LFL/LEC players
const RIOT_REGIONAL = "europe"; // For account-v1 API

// ============================================================================
// RATE LIMITER — migrated from legacy riot-rate-limiter.js
// ============================================================================

interface RateLimitConfig {
  shortWindow: number; // requests
  shortWindowMs: number;
  longWindow: number; // requests
  longWindowMs: number;
}

const DEFAULT_LIMITS: RateLimitConfig = {
  shortWindow: 20,
  shortWindowMs: 1000,
  longWindow: 100,
  longWindowMs: 120_000,
};

const METHOD_LIMITS: Record<string, RateLimitConfig> = {
  account: { shortWindow: 1000, shortWindowMs: 60_000, longWindow: 1000, longWindowMs: 60_000 },
  "league-entries": { shortWindow: 20000, shortWindowMs: 10_000, longWindow: 20000, longWindowMs: 10_000 },
  "match-list": { shortWindow: 2000, shortWindowMs: 10_000, longWindow: 2000, longWindowMs: 10_000 },
};

class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = DEFAULT_LIMITS) {
    this.config = config;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    // Clean old requests
    this.requests = this.requests.filter((t) => now - t < this.config.longWindowMs);

    // Check long window
    const longWindowRequests = this.requests.filter((t) => now - t < this.config.longWindowMs);
    if (longWindowRequests.length >= this.config.longWindow) {
      const oldest = longWindowRequests[0];
      const wait = this.config.longWindowMs - (now - oldest);
      await new Promise((r) => setTimeout(r, wait + 50));
      return this.waitForSlot();
    }

    // Check short window
    const shortWindowRequests = this.requests.filter((t) => now - t < this.config.shortWindowMs);
    if (shortWindowRequests.length >= this.config.shortWindow) {
      const oldest = shortWindowRequests[0];
      const wait = this.config.shortWindowMs - (now - oldest);
      await new Promise((r) => setTimeout(r, wait + 10));
      return this.waitForSlot();
    }

    this.requests.push(Date.now());
  }
}

const defaultLimiter = new RateLimiter(DEFAULT_LIMITS);
const methodLimiters: Record<string, RateLimiter> = {};

function getLimiterForUrl(url: string): RateLimiter {
  if (url.includes("/account/")) return methodLimiters.account ?? new RateLimiter(METHOD_LIMITS.account);
  if (url.includes("/league/")) return methodLimiters["league-entries"] ?? new RateLimiter(METHOD_LIMITS["league-entries"]);
  if (url.includes("/matches/by-puuid/")) return methodLimiters["match-list"] ?? new RateLimiter(METHOD_LIMITS["match-list"]);
  return defaultLimiter;
}

// ============================================================================
// CACHED REQUESTS — in-memory TTL cache
// ============================================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(url: string): string {
  return url;
}

function getCached<T>(url: string): T | null {
  const entry = cache.get(getCacheKey(url));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(getCacheKey(url));
    return null;
  }
  return entry.data as T;
}

function setCached<T>(url: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  cache.set(getCacheKey(url), { data, expiresAt: Date.now() + ttlMs });
}

// ============================================================================
// RETRY LOGIC — exponential backoff
// ============================================================================

async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T | null> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.error(`Request failed after ${maxRetries + 1} attempts:`, lastError);
  return null;
}

// ============================================================================
// MAIN REQUEST FUNCTION
// ============================================================================

async function rateLimitedRequest<T>(url: string, options?: { cacheTtlMs?: number; skipCache?: boolean }): Promise<T | null> {
  // Check cache first
  if (!options?.skipCache) {
    const cached = getCached<T>(url);
    if (cached !== null) {
      return cached;
    }
  }

  // Rate limit
  const limiter = getLimiterForUrl(url);
  await limiter.waitForSlot();

  const result = await withRetry(async () => {
    const response = await fetch(url, {
      headers: {
        "X-Riot-Token": RIOT_API_KEY || "",
      },
    });

    if (response.status === 404) {
      return { __notFound: true } as unknown as T;
    }
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
      console.warn(`Riot API rate limited (429), waiting ${waitMs}ms...`);
      await new Promise((r) => setTimeout(r, waitMs));
      throw new Error("Rate limited");
    }
    if (!response.ok) {
      const text = await response.text();
      console.error("Riot API error:", response.status, text);
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return (await response.json()) as T;
  });

  if (result === null) return null;

  // Handle 404 sentinel
  if ((result as unknown as Record<string, unknown>).__notFound === true) {
    return null;
  }

  // Cache successful response
  if (!options?.skipCache) {
    setCached(url, result, options?.cacheTtlMs ?? DEFAULT_TTL_MS);
  }

  return result;
}

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummoner {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RiotLeagueEntry {
  leagueId: string;
  summonerId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
}

export interface RiotMatch {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    gameType: string;
    participants: RiotMatchParticipant[];
  };
}

export interface RiotMatchParticipant {
  puuid: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  teamPosition: string;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  summoner1Id: number;
  summoner2Id: number;
  perks: {
    styles: Array<{
      style: number;
      selections: Array<{ perk: number }>;
    }>;
  };
}

export interface RiotChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
  summonerId: string;
}

/**
 * Get account by Riot ID (gameName#tagLine)
 */
export async function getAccountByRiotId(
  gameName: string,
  tagLine: string
): Promise<RiotAccount | null> {
  const url = `https://${RIOT_REGIONAL}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
    gameName
  )}/${encodeURIComponent(tagLine)}`;
  return rateLimitedRequest<RiotAccount>(url);
}

/**
 * Get account by PUUID
 */
export async function getAccountByPuuid(puuid: string): Promise<RiotAccount | null> {
  const url = `https://${RIOT_REGIONAL}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`;
  return rateLimitedRequest<RiotAccount>(url);
}

/**
 * Get summoner by PUUID (for profile icon, level, etc.)
 */
export async function getSummonerByPuuid(puuid: string): Promise<RiotSummoner | null> {
  const url = `https://${RIOT_REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return rateLimitedRequest<RiotSummoner>(url);
}

/**
 * Get ranked stats (SoloQ / Flex) by PUUID (modern API)
 */
export async function getLeagueEntriesByPuuid(puuid: string): Promise<RiotLeagueEntry[]> {
  const url = `https://${RIOT_REGION}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
  const data = await rateLimitedRequest<RiotLeagueEntry[]>(url);
  return data || [];
}

/**
 * Get ranked stats (SoloQ / Flex) by encrypted summoner ID (legacy)
 */
export async function getLeagueEntries(summonerId: string): Promise<RiotLeagueEntry[]> {
  const url = `https://${RIOT_REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
  const data = await rateLimitedRequest<RiotLeagueEntry[]>(url);
  return data || [];
}

/**
 * Get recent match IDs by PUUID
 */
export async function getMatchIds(
  puuid: string,
  count: number = 10,
  queue: number = 420 // 420 = SoloQ ranked
): Promise<string[]> {
  const url = `https://${RIOT_REGIONAL}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=${queue}&count=${count}`;
  const data = await rateLimitedRequest<string[]>(url);
  return data || [];
}

/**
 * Get match details by match ID
 */
export async function getMatch(matchId: string): Promise<RiotMatch | null> {
  const url = `https://${RIOT_REGIONAL}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  return rateLimitedRequest<RiotMatch>(url);
}

/**
 * Get all match details for a list of match IDs
 */
export async function getMatches(matchIds: string[]): Promise<RiotMatch[]> {
  const matches: RiotMatch[] = [];
  for (const matchId of matchIds) {
    const match = await getMatch(matchId);
    if (match) matches.push(match);
  }
  return matches;
}

/**
 * Get champion mastery by encrypted summoner ID (Champion-Mastery-V4)
 */
export async function getChampionMastery(
  summonerId: string,
  count: number = 10
): Promise<RiotChampionMastery[]> {
  const url = `https://${RIOT_REGION}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}/top?count=${count}`;
  const data = await rateLimitedRequest<RiotChampionMastery[]>(url);
  return data || [];
}

/**
 * Compute SoloQ stats from match history
 */
export function computeSoloqStats(matches: RiotMatch[], playerPuuid: string) {
  let wins = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  const championCounts: Record<string, number> = {};

  for (const match of matches) {
    const participant = match.info.participants.find((p) => p.puuid === playerPuuid);
    if (!participant) continue;

    if (participant.win) wins++;
    totalKills += participant.kills;
    totalDeaths += participant.deaths;
    totalAssists += participant.assists;

    const champ = participant.championName;
    championCounts[champ] = (championCounts[champ] || 0) + 1;
  }

  const totalGames = matches.length;
  const winrate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
  const kda =
    totalDeaths > 0
      ? (totalKills + totalAssists) / totalDeaths
      : totalKills + totalAssists;

  // Sort champions by games played
  const championPool = Object.entries(championCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([champ, count]) => `${champ} (${count})`)
    .join(", ");

  return {
    totalGames,
    wins,
    losses: totalGames - wins,
    winrate: Math.round((wins / totalGames) * 1000) / 1000, // Store as ratio (0.6 = 60%)
    kda: Math.round(kda * 100) / 100,
    championPool,
  };
}

/**
 * Get complete SoloQ profile for a player
 */
export async function getSoloqProfile(
  gameName: string,
  tagLine: string
): Promise<{
  account: RiotAccount | null;
  summoner: RiotSummoner | null;
  ranked: RiotLeagueEntry | null;
  recentStats: ReturnType<typeof computeSoloqStats> | null;
} | null> {
  const account = await getAccountByRiotId(gameName, tagLine);
  if (!account) return null;

  const summoner = await getSummonerByPuuid(account.puuid);
  if (!summoner) return null;

  const entries = await getLeagueEntries(summoner.id);
  const ranked = entries.find((e) => e.queueType === "RANKED_SOLO_5x5") || null;

  const matchIds = await getMatchIds(account.puuid, 20);
  const matches = await getMatches(matchIds);
  const recentStats = matches.length > 0 ? computeSoloqStats(matches, account.puuid) : null;

  return {
    account,
    summoner,
    ranked,
    recentStats,
  };
}

