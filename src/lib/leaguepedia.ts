/**
 * Leaguepedia Cargo API Client
 *
 * API gratuite et stable pour :
 * - Rosters équipes
 * - Calendriers tournois
 * - Stats de games (basiques)
 * - Drafts (picks/bans)
 *
 * Docs: https://lol.fandom.com/wiki/Help:Cargo_Export
 */

const BASE_URL = "https://lol.fandom.com/wiki/Special:CargoExport";
const RATE_LIMIT_MS = 1000; // 1 req/sec pour être safe

let lastRequest = 0;

async function cargoQuery(params: {
  tables: string;
  fields: string;
  where?: string;
  groupBy?: string;
  orderBy?: string;
  limit?: number;
}): Promise<any[]> {
  // Rate limiting
  const now = Date.now();
  const wait = lastRequest + RATE_LIMIT_MS - now;
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastRequest = Date.now();

  const searchParams = new URLSearchParams({
    tables: params.tables,
    fields: params.fields,
    format: "json",
  });

  if (params.where) searchParams.set("where", params.where);
  if (params.groupBy) searchParams.set("group by", params.groupBy);
  if (params.orderBy) searchParams.set("order by", params.orderBy);
  if (params.limit) searchParams.set("limit", String(params.limit));

  const url = `${BASE_URL}?${searchParams.toString()}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LeagueScout/1.0 (scouting tool)",
      },
    });

    if (!res.ok) {
      throw new Error(`Leaguepedia API error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Leaguepedia query failed:", error);
    throw error;
  }
}

// ============================================================================
// ROSTERS
// ============================================================================

export interface LeaguepediaPlayer {
  Name: string;
  Team: string;
  Role: string;
  IsRetired?: string;
  IsSubstitute?: string;
}

/**
 * Récupère le roster d'une équipe
 */
export async function getTeamRoster(teamName: string): Promise<LeaguepediaPlayer[]> {
  const results = await cargoQuery({
    tables: "ScoreboardPlayers=SP",
    fields: "SP.Name,SP.Team,SP.Role",
    where: `SP.Team="${teamName}"`,
    groupBy: "SP.Name",
    limit: 20,
  });

  return results.map((r) => ({
    Name: r.Name,
    Team: r.Team,
    Role: r.Role,
  }));
}

/**
 * Récupère tous les joueurs d'une ligue/saison
 */
export async function getLeaguePlayers(
  league: string,
  year: string,
  split: string
): Promise<LeaguepediaPlayer[]> {
  const overviewPage = `${league} ${year} ${split}`;

  const results = await cargoQuery({
    tables: "ScoreboardPlayers=SP",
    fields: "SP.Name,SP.Team,SP.Role",
    where: `SP.OverviewPage="${overviewPage}"`,
    groupBy: "SP.Name,SP.Team",
    limit: 500,
  });

  return results.map((r) => ({
    Name: r.Name,
    Team: r.Team,
    Role: r.Role,
  }));
}

// ============================================================================
// TEAMS
// ============================================================================

export interface LeaguepediaTeam {
  Name: string;
  Short: string;
  Region: string;
}

/**
 * Récupère les équipes d'une région
 */
export async function getTeamsByRegion(region: string): Promise<LeaguepediaTeam[]> {
  const results = await cargoQuery({
    tables: "Teams=T",
    fields: "T.Name,T.Short,T.Region",
    where: `T.Region="${region}"`,
    orderBy: "T.Name",
    limit: 100,
  });

  return results.map((r) => ({
    Name: r.Name,
    Short: r.Short,
    Region: r.Region,
  }));
}

// ============================================================================
// TOURNAMENTS
// ============================================================================

export interface LeaguepediaTournament {
  Name: string;
  OverviewPage: string;
  DateStart: string;
  DateEnd: string;
  League: string;
  Split: string;
  Year: string;
}

/**
 * Récupère les tournois d'une ligue
 */
export async function getTournaments(league: string): Promise<LeaguepediaTournament[]> {
  const results = await cargoQuery({
    tables: "ScoreboardGames=SG",
    fields: "SG.OverviewPage,SG.DateTime_UTC,SG.League,SG.Split,SG.Year",
    where: `SG.League="${league}"`,
    groupBy: "SG.OverviewPage",
    orderBy: "SG.DateTime_UTC DESC",
    limit: 20,
  });

  return results.map((r) => ({
    Name: r.OverviewPage,
    OverviewPage: r.OverviewPage,
    DateStart: r.DateTime_UTC,
    DateEnd: r.DateTime_UTC,
    League: r.League,
    Split: r.Split,
    Year: r.Year,
  }));
}

// ============================================================================
// SYNC AVEC NOTRE BDD
// ============================================================================

import { db } from "./server/db";

export interface SyncResult {
  updated: number;
  errors: string[];
  details: Array<{
    player: string;
    action: string;
    oldTeam?: string;
    newTeam?: string;
  }>;
}

/**
 * Synchronise les rosters Leaguepedia avec notre BDD
 * Met à jour currentTeam des joueurs
 */
export async function syncRostersWithLeaguepedia(
  league: string,
  year: string,
  split: string
): Promise<SyncResult> {
  const result: SyncResult = {
    updated: 0,
    errors: [],
    details: [],
  };

  try {
    const lpPlayers = await getLeaguePlayers(league, year, split);

    for (const lpPlayer of lpPlayers) {
      try {
        // Chercher le joueur dans notre BDD
        const player = await db.player.findFirst({
          where: {
            pseudo: { contains: lpPlayer.Name },
          },
        });

        if (!player) {
          // Joueur pas dans notre BDD — on pourrait le créer
          result.details.push({
            player: lpPlayer.Name,
            action: "not_found",
          });
          continue;
        }

        // Mettre à jour l'équipe si différente
        if (player.currentTeam !== lpPlayer.Team) {
          await db.player.update({
            where: { id: player.id },
            data: {
              currentTeam: lpPlayer.Team,
              league,
            },
          });

          result.updated++;
          result.details.push({
            player: player.pseudo,
            action: "team_updated",
            oldTeam: player.currentTeam || "—",
            newTeam: lpPlayer.Team,
          });
        } else {
          result.details.push({
            player: player.pseudo,
            action: "no_change",
          });
        }
      } catch (err: any) {
        result.errors.push(`${lpPlayer.Name}: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Global error: ${err.message}`);
  }

  return result;
}
