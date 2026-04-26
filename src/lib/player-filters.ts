// ============================================================================
// PLAYER FILTERS & SORTING — Pure logic extracted for testability
// ============================================================================

export interface FilterablePlayer {
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  league: string;
  status: string;
  currentTeam: string | null;
  age: number | null;
  soloqStats?: {
    currentRank: string;
    peakLp: number;
    winrate: number;
    totalGames: number;
  } | null;
}

export interface PlayerFilters {
  q?: string;
  role?: string;
  league?: string;
  status?: string;
}

export type SortOption = "name" | "rank" | "winrate" | "age";

export function filterPlayers(
  players: FilterablePlayer[],
  filters: PlayerFilters
): FilterablePlayer[] {
  return players.filter((player) => {
    if (filters.q) {
      const query = filters.q.toLowerCase();
      const matchesPseudo = player.pseudo.toLowerCase().includes(query);
      const matchesRealName = player.realName?.toLowerCase().includes(query) ?? false;
      if (!matchesPseudo && !matchesRealName) return false;
    }

    if (filters.role && player.role !== filters.role) return false;
    if (filters.league && player.league !== filters.league) return false;
    if (filters.status && player.status !== filters.status) return false;

    return true;
  });
}

export function sortPlayers(
  players: FilterablePlayer[],
  sort: SortOption
): FilterablePlayer[] {
  const sorted = [...players];

  switch (sort) {
    case "rank":
      sorted.sort((a, b) => (b.soloqStats?.peakLp ?? 0) - (a.soloqStats?.peakLp ?? 0));
      break;
    case "winrate":
      sorted.sort((a, b) => (b.soloqStats?.winrate ?? 0) - (a.soloqStats?.winrate ?? 0));
      break;
    case "age":
      sorted.sort((a, b) => {
        const ageA = a.age ?? Infinity;
        const ageB = b.age ?? Infinity;
        return ageA - ageB;
      });
      break;
    case "name":
    default:
      sorted.sort((a, b) => a.pseudo.localeCompare(b.pseudo));
      break;
  }

  return sorted;
}

export function paginatePlayers<T>(
  players: T[],
  page: number,
  pageSize: number
): { items: T[]; totalPages: number } {
  const safePage = Math.max(1, page);
  const totalPages = Math.max(1, Math.ceil(players.length / pageSize));
  const clampedPage = Math.min(safePage, totalPages);
  const start = (clampedPage - 1) * pageSize;
  const items = players.slice(start, start + pageSize);
  return { items, totalPages };
}

