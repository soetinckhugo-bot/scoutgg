import { db } from "@/lib/server/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Download, Filter, ChevronDown, X } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import PlayerGrid from "./PlayerGrid";
import { PageTitle, DataLabel } from "@/components/ui/typography";
import {
  ROLES,
  LEAGUES,
  STATUSES,
  TIERS,
  TIER_COLORS,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Players",
  description: "Browse and discover League of Legends talent across Worlds. Filter by role, league, tier, and status.",
  openGraph: {
    title: "Players | LeagueScout",
    description: "Browse and discover League of Legends talent across Worlds.",
    type: "website",
  },
};

const PLAYERS_PER_PAGE = 9;

const getPlayers = unstable_cache(
  async (
    searchParams: {
      q?: string;
      role?: string;
      league?: string;
      status?: string;
      tier?: string;
      sort?: string;
      page?: string;
    }
  ) => {
    const where: any = {};

    if (searchParams.q) {
      where.OR = [
        { pseudo: { contains: searchParams.q } },
        { realName: { contains: searchParams.q } },
      ];
    }

    if (searchParams.role) {
      where.role = searchParams.role;
    }

    if (searchParams.league) {
      where.league = searchParams.league;
    }

    if (searchParams.status) {
      where.status = searchParams.status;
    }

    if (searchParams.tier) {
      where.tier = searchParams.tier;
    }

    let orderBy: any = { pseudo: "asc" };
    if (searchParams.sort === "rank") {
      orderBy = { soloqStats: { peakLp: "desc" } };
    } else if (searchParams.sort === "winrate") {
      orderBy = { soloqStats: { winrate: "desc" } };
    } else if (searchParams.sort === "age") {
      orderBy = { age: "asc" };
    }

    const page = Math.max(1, parseInt(searchParams.page || "1", 10));
    const skip = (page - 1) * PLAYERS_PER_PAGE;

    const [players, totalCount] = await Promise.all([
      db.player.findMany({
        where,
        select: {
          id: true,
          pseudo: true,
          realName: true,
          role: true,
          league: true,
          currentTeam: true,
          status: true,
          photoUrl: true,
          age: true,
          prospectScore: true,
          soloqStats: {
            select: {
              currentRank: true,
              peakLp: true,
              winrate: true,
              totalGames: true,
            },
          },
          proStats: {
            select: {
              kda: true,
              dpm: true,
              gamesPlayed: true,
            },
          },
        },
        orderBy,
        skip,
        take: PLAYERS_PER_PAGE,
      }),
      db.player.count({ where }),
    ]);

    return { players, totalCount, page, totalPages: Math.ceil(totalCount / PLAYERS_PER_PAGE) };
  },
  ["players-list"],
  { revalidate: 60 }
);

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

export default async function PlayersPage(props: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    league?: string;
    status?: string;
    tier?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const { players, totalCount, page, totalPages } = await getPlayers(searchParams);

  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "rank", label: "Rank (LP)" },
    { value: "winrate", label: "Winrate" },
    { value: "age", label: "Age" },
  ];

  const baseParams = {
    q: searchParams.q,
    role: searchParams.role,
    league: searchParams.league,
    status: searchParams.status,
    tier: searchParams.tier,
    sort: searchParams.sort,
  };

  const activeFilterCount = [
    searchParams.role !== undefined && searchParams.role !== "all",
    searchParams.league !== undefined && searchParams.league !== "all",
    searchParams.status !== undefined && searchParams.status !== "all",
    searchParams.tier !== undefined && searchParams.tier !== "all",
    searchParams.q !== undefined && searchParams.q !== "",
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <PageTitle className="text-[#1A1A2E] dark:text-white mb-2">Players</PageTitle>
        <p className="text-[#6C757D] dark:text-gray-400">
          Browse and discover League of Legends talent across Worlds
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-[#141621] border border-[#2A2D3A] rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-[#E9ECEF]">{totalCount}</span>
          <span className="text-sm text-[#6C757D]">player{totalCount !== 1 ? "s" : ""} found</span>
        </div>
      </div>

      {/* Search */}
      <form className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6C757D]" />
        <Input
          type="search"
          name="q"
          placeholder="Search by name or pseudo..."
          className="pl-10 dark:bg-[#1e293b] dark:border-gray-700 dark:text-white"
          defaultValue={searchParams.q}
        />
      </form>

      {/* Filters */}
      <details className="group mb-6" open>
        <summary className="flex items-center justify-between cursor-pointer p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors list-none">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-3 space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
          {/* Clear all */}
          <div className="flex justify-end">
            <Link
              href="/players"
              className={`inline-flex items-center gap-1 text-sm font-medium transition-colors ${
                activeFilterCount === 0
                  ? "text-muted-foreground pointer-events-none opacity-50"
                  : "text-[#E94560] hover:text-[#E94560]/80"
              }`}
              aria-disabled={activeFilterCount === 0}
            >
              <X className="h-3 w-3" />
              Clear all
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            <DataLabel className="normal-case mr-2">Role:</DataLabel>
            {ROLES.map((role) => (
              <Link
                key={role}
                href={`/players?${buildQueryString(baseParams, {
                  role: searchParams.role === role ? undefined : role,
                  page: undefined,
                })}`}
              >
                <Badge
                  variant={searchParams.role === role ? "default" : "outline"}
                  className={`cursor-pointer ${
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

          <div className="flex flex-wrap gap-2">
            <DataLabel className="normal-case mr-2">League:</DataLabel>
            {LEAGUES.map((league) => (
              <Link
                key={league}
                href={`/players?${buildQueryString(baseParams, {
                  league: searchParams.league === league ? undefined : league,
                  page: undefined,
                })}`}
              >
                <Badge
                  variant={searchParams.league === league ? "default" : "outline"}
                  className={`cursor-pointer ${
                    searchParams.league === league
                      ? "bg-[#1A1A2E] text-white"
                      : "border-[#E9ECEF] dark:border-gray-700 text-[#6C757D] dark:text-gray-400 hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b]"
                  }`}
                >
                  {league}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <DataLabel className="normal-case mr-2">Status:</DataLabel>
            {STATUSES.map((status) => (
              <Link
                key={status.value}
                href={`/players?${buildQueryString(baseParams, {
                  status: searchParams.status === status.value ? undefined : status.value,
                  page: undefined,
                })}`}
              >
                <Badge
                  variant={searchParams.status === status.value ? "default" : "outline"}
                  className={`cursor-pointer ${
                    searchParams.status === status.value
                      ? searchParams.status === "FREE_AGENT"
                        ? "bg-green-600 text-white"
                        : "bg-[#1A1A2E] text-white"
                      : "border-[#E9ECEF] dark:border-gray-700 text-[#6C757D] dark:text-gray-400 hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b]"
                  }`}
                >
                  {status.label}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Tier Filter */}
          <div className="flex flex-wrap gap-2">
            <DataLabel className="normal-case mr-2">Tier:</DataLabel>
            {TIERS.map((tier) => (
              <Link
                key={tier}
                href={`/players?${buildQueryString(baseParams, {
                  tier: searchParams.tier === tier ? undefined : tier,
                  page: undefined,
                })}`}
              >
                <Badge
                  variant={searchParams.tier === tier ? "default" : "outline"}
                  className={`cursor-pointer ${
                    searchParams.tier === tier
                      ? TIER_COLORS[tier] || "bg-[#1A1A2E] text-white"
                      : "border-[#E9ECEF] dark:border-gray-700 text-[#6C757D] dark:text-gray-400 hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b]"
                  }`}
                >
                  {tier}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Sort */}
          <div className="flex flex-wrap gap-2 items-center">
            <DataLabel className="normal-case mr-2">Sort by:</DataLabel>
            {sortOptions.map((sort) => (
              <Link
                key={sort.value}
                href={`/players?${buildQueryString(baseParams, {
                  sort: searchParams.sort === sort.value ? undefined : sort.value,
                  page: undefined,
                })}`}
              >
                <Badge
                  variant={searchParams.sort === sort.value ? "default" : "outline"}
                  className={`cursor-pointer ${
                    searchParams.sort === sort.value
                      ? "bg-[#E94560] text-white"
                      : "border-[#E9ECEF] dark:border-gray-700 text-[#6C757D] dark:text-gray-400 hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b]"
                  }`}
                >
                  {sort.label}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </details>

      {/* Export + Grid */}
      <div className="flex justify-end mb-4">
        <form action="/api/export/players" method="GET">
          <input type="hidden" name="q" value={searchParams.q || ""} />
          <input type="hidden" name="role" value={searchParams.role || ""} />
          <input type="hidden" name="league" value={searchParams.league || ""} />
          <input type="hidden" name="status" value={searchParams.status || ""} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1A1A2E] dark:text-white border border-[#E9ECEF] dark:border-gray-700 rounded-md hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b] transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </form>
      </div>
      <PlayerGrid players={players} />

      {players.length === 0 && (
        <EmptyState
          icon={Search}
          title="No players found"
          description="Try adjusting your filters or search for a different player."
          action={{ label: "Clear filters", href: "/players" }}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-8">
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/players?${buildQueryString(baseParams, { page: String(page - 1) })}`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-[#2A2D3A] bg-[#1A1D29] text-[#ADB5BD] hover:bg-[#232838] hover:text-[#E9ECEF] h-8 px-3 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Link>
            )}
            {(() => {
              // Show max 10 page buttons with ellipsis
              const maxButtons = 10;
              let start = Math.max(1, page - Math.floor(maxButtons / 2));
              const end = Math.min(totalPages, start + maxButtons - 1);
              if (end - start < maxButtons - 1) {
                start = Math.max(1, end - maxButtons + 1);
              }
              const buttons = [];
              if (start > 1) {
                buttons.push(
                  <Link key={1} href={`/players?${buildQueryString(baseParams, { page: "1" })}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 border border-[#2A2D3A] bg-[#1A1D29] text-[#ADB5BD] hover:bg-[#232838] transition-colors">1</Link>
                );
                if (start > 2) buttons.push(<span key="start-ellipsis" className="text-[#6C757D] px-1">...</span>);
              }
              for (let p = start; p <= end; p++) {
                buttons.push(
                  <Link
                    key={p}
                    href={`/players?${buildQueryString(baseParams, { page: String(p) })}`}
                    className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 transition-colors ${
                      p === page
                        ? "bg-[#E94560] text-white"
                        : "border border-[#2A2D3A] bg-[#1A1D29] text-[#ADB5BD] hover:bg-[#232838]"
                    }`}
                  >
                    {p}
                  </Link>
                );
              }
              if (end < totalPages) {
                if (end < totalPages - 1) buttons.push(<span key="end-ellipsis" className="text-[#6C757D] px-1">...</span>);
                buttons.push(
                  <Link key={totalPages} href={`/players?${buildQueryString(baseParams, { page: String(totalPages) })}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 border border-[#2A2D3A] bg-[#1A1D29] text-[#ADB5BD] hover:bg-[#232838] transition-colors">{totalPages}</Link>
                );
              }
              return buttons;
            })()}
            {page < totalPages && (
              <Link
                href={`/players?${buildQueryString(baseParams, { page: String(page + 1) })}`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-[#2A2D3A] bg-[#1A1D29] text-[#ADB5BD] hover:bg-[#232838] hover:text-[#E9ECEF] h-8 px-3 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

