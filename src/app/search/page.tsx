import { db } from "@/lib/server/db";
import Link from "next/link";
import { Search, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import PlayerCard from "@/components/PlayerCard";
import { ROLES, LEAGUES, STATUSES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Search",
  description: "Advanced search for League of Legends players. Filter by role, league, status, LP, and age.",
  openGraph: {
    title: "Player Search | LeagueScout",
    description: "Advanced search for League of Legends players.",
    type: "website",
  },
};

async function searchPlayers(params: {
  q?: string;
  role?: string;
  league?: string;
  status?: string;
  minLp?: string;
  maxAge?: string;
}) {
  const where: any = {};

  // Full-text search on pseudo, realName, team, bio
  if (params.q) {
    const q = params.q;
    where.OR = [
      { pseudo: { contains: q } },
      { realName: { contains: q } },
      { currentTeam: { contains: q } },
      { bio: { contains: q } },
    ];
  }

  // Filters
  if (params.role) where.role = params.role;
  if (params.league) where.league = params.league;
  if (params.status) where.status = params.status;
  if (params.maxAge) where.age = { lte: parseInt(params.maxAge) };

  // SoloQ LP filter
  if (params.minLp) {
    where.soloqStats = {
      peakLp: { gte: parseInt(params.minLp) },
    };
  }

  return db.player.findMany({
    where,
    include: {
      soloqStats: true,
      proStats: true,
    },
    orderBy: { pseudo: "asc" },
    take: 30,
  });
}

function buildQueryString(
  base: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  Object.entries({ ...base, ...overrides }).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, value);
    }
  });
  return params.toString();
}

export default async function SearchPage(props: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    league?: string;
    status?: string;
    minLp?: string;
    maxAge?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const players = await searchPlayers(searchParams);

  const hasFilters =
    searchParams.role ||
    searchParams.league ||
    searchParams.status ||
    searchParams.minLp ||
    searchParams.maxAge;

  const baseParams = {
    q: searchParams.q,
    role: searchParams.role,
    league: searchParams.league,
    status: searchParams.status,
    minLp: searchParams.minLp,
    maxAge: searchParams.maxAge,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-[#1A1A2E] dark:text-white mb-2">
        Advanced Search
      </h1>
      <p className="text-[#6C757D] dark:text-gray-400 mb-6">
        Search across players, teams, and bios with combined filters
      </p>

      {/* Search bar */}
      <form className="mb-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6C757D]" />
          <input
            type="search"
            name="q"
            placeholder="Search by name, team, or keyword..."
            defaultValue={searchParams.q || ""}
            className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#E9ECEF] dark:border-gray-700 bg-white dark:bg-[#1e293b] text-[#1A1A2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F3460]"
          />
        </div>
      </form>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#6C757D]" />
          <span className="text-sm font-medium text-[#1A1A2E] dark:text-white">Filters:</span>
          {hasFilters && (
            <Link
              href={`/search?q=${searchParams.q || ""}`}
              className="text-xs text-[#E94560] hover:underline flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear all
            </Link>
          )}
        </div>

        {/* Role */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-[#6C757D] dark:text-gray-400 uppercase font-medium">Role:</span>
          {ROLES.map((role) => (
            <Link
              key={role}
              href={`/search?${buildQueryString(baseParams, {
                role: searchParams.role === role ? undefined : role,
              })}`}
            >
              <Badge
                variant={searchParams.role === role ? "default" : "outline"}
                className={`cursor-pointer text-xs ${
                  searchParams.role === role
                    ? "bg-[#1A1A2E] text-white"
                    : "border-[#E9ECEF] dark:border-gray-700 text-[#6C757D] dark:text-gray-400 hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b]"
                }`}
              >
                {role}
              </Badge>
            </Link>
          ))}
        </div>

        {/* League */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-[#6C757D] dark:text-gray-400 uppercase font-medium">League:</span>
          {LEAGUES.map((league) => (
            <Link
              key={league}
              href={`/search?${buildQueryString(baseParams, {
                league: searchParams.league === league ? undefined : league,
              })}`}
            >
              <Badge
                variant={searchParams.league === league ? "default" : "outline"}
                className={`cursor-pointer text-xs ${
                  searchParams.league === league
                    ? "bg-[#0F3460] text-white"
                    : "border-[#E9ECEF] dark:border-gray-700 text-[#6C757D] dark:text-gray-400 hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b]"
                }`}
              >
                {league}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Status */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-[#6C757D] dark:text-gray-400 uppercase font-medium">Status:</span>
          {STATUSES.map((status) => (
            <Link
              key={status.value}
              href={`/search?${buildQueryString(baseParams, {
                status: searchParams.status === status.value ? undefined : status.value,
              })}`}
            >
              <Badge
                variant={searchParams.status === status.value ? "default" : "outline"}
                className={`cursor-pointer text-xs ${
                  searchParams.status === status.value
                    ? "bg-[#E94560] text-white"
                    : "border-[#E9ECEF] dark:border-gray-700 text-[#6C757D] dark:text-gray-400 hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b]"
                }`}
              >
                {status.label}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Min LP */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-[#6C757D] dark:text-gray-400 uppercase font-medium">Min Peak LP:</span>
          {["500", "800", "1000", "1200"].map((lp) => (
            <Link
              key={lp}
              href={`/search?${buildQueryString(baseParams, {
                minLp: searchParams.minLp === lp ? undefined : lp,
              })}`}
            >
              <Badge
                variant={searchParams.minLp === lp ? "default" : "outline"}
                className={`cursor-pointer text-xs ${
                  searchParams.minLp === lp
                    ? "bg-yellow-500 text-white"
                    : "border-[#E9ECEF] dark:border-gray-700 text-[#6C757D] dark:text-gray-400 hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b]"
                }`}
              >
                {lp}+
              </Badge>
            </Link>
          ))}
        </div>

        {/* Max Age */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-[#6C757D] dark:text-gray-400 uppercase font-medium">Max Age:</span>
          {["18", "20", "22", "25"].map((age) => (
            <Link
              key={age}
              href={`/search?${buildQueryString(baseParams, {
                maxAge: searchParams.maxAge === age ? undefined : age,
              })}`}
            >
              <Badge
                variant={searchParams.maxAge === age ? "default" : "outline"}
                className={`cursor-pointer text-xs ${
                  searchParams.maxAge === age
                    ? "bg-green-500 text-white"
                    : "border-[#E9ECEF] dark:border-gray-700 text-[#6C757D] dark:text-gray-400 hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b]"
                }`}
              >
                ≤ {age}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Results */}
      {searchParams.q && (
        <p className="text-[#6C757D] dark:text-gray-400 mb-4">
          {players.length} result{players.length !== 1 ? "s" : ""} for &quot;{searchParams.q}&quot;
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            showStats={true}
            showFavorite={true}
            variant="default"
          />
        ))}
      </div>

      {players.length === 0 && (searchParams.q || hasFilters) && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-[#E9ECEF] dark:text-gray-700 mx-auto mb-4" />
          <p className="text-[#6C757D] dark:text-gray-400">
            No players found matching your criteria
          </p>
        </div>
      )}

      {!searchParams.q && !hasFilters && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-[#E9ECEF] dark:text-gray-700 mx-auto mb-4" />
          <p className="text-[#6C757D] dark:text-gray-400">
            Use the search bar and filters to find players
          </p>
        </div>
      )}
    </div>
  );
}

