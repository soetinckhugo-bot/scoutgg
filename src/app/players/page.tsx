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
  TIER_COLORS,
} from "@/lib/constants";

const LEAGUE_TIER_OPTIONS = [
  { value: "1", label: "Tier 1", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  { value: "2", label: "Tier 2", color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  { value: "3", label: "Tier 3", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  { value: "4", label: "Tier 4", color: "text-text-body bg-text-body/10 border-text-body/30" },
];

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
      contract?: string;
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

    // Contract expiry filter
    if (searchParams.contract) {
      const days = parseInt(searchParams.contract, 10);
      const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      where.contractEndDate = {
        not: null,
        lte: cutoff,
        gte: new Date(),
      };
    }

    let orderBy: any = { pseudo: "asc" };
    if (searchParams.sort === "rank") {
      orderBy = { soloqStats: { peakLp: "desc" } };
    } else if (searchParams.sort === "winrate") {
      orderBy = { soloqStats: { winrate: "desc" } };
    } else if (searchParams.sort === "age") {
      orderBy = { age: "asc" };
    } else if (searchParams.sort === "tier") {
      orderBy = { tier: "desc" };
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
              globalScore: true,
              tierScore: true,
              winRate: true,
            },
          },
          contractEndDate: true,
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
  { revalidate: 60, tags: ["players-list"] }
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
    contract?: string;
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
    { value: "tier", label: "Tier" },
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
    <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <PageTitle className="text-text-heading mb-2">Players</PageTitle>
        <p className="text-text-body">
          Browse and discover League of Legends talent across Worlds
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
          <span className="text-2xl font-bold text-text-heading">{totalCount}</span>
          <span className="text-sm text-text-muted">player{totalCount !== 1 ? "s" : ""} found</span>
        </div>
      </div>

      {/* Search */}
      <form className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          type="search"
          name="q"
          placeholder="Search by name or pseudo..."
          className="pl-10 bg-card border-border text-text-heading placeholder:text-text-muted"
          defaultValue={searchParams.q}
        />
      </form>

      {/* Filters */}
      <details className="group mb-6" open>
        <summary className="flex items-center justify-between cursor-pointer p-3 bg-surface-hover rounded-lg border border-border hover:bg-muted transition-colors list-none">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-semibold text-text-heading">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-text-muted transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-3 space-y-3 p-3 bg-card rounded-lg border border-border">
          {/* Clear all */}
          <div className="flex justify-end">
            <Link
              href="/players"
              className={`inline-flex items-center gap-1 text-sm font-medium transition-colors ${
                activeFilterCount === 0
                  ? "text-text-muted pointer-events-none opacity-50"
                  : "text-primary-accent hover:text-primary-accent/90"
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
                aria-label={`Filter by role ${role}${searchParams.role === role ? " (active)" : ""}`}
              >
                <Badge
                  variant={searchParams.role === role ? "default" : "outline"}
                  className={`cursor-pointer ${
                    searchParams.role === role
                      ? "bg-surface-elevated text-text-heading"
                      : "border-border text-text-muted hover:bg-surface-hover hover:text-text-heading"
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
                aria-label={`Filter by league ${league}${searchParams.league === league ? " (active)" : ""}`}
              >
                <Badge
                  variant={searchParams.league === league ? "default" : "outline"}
                  className={`cursor-pointer ${
                    searchParams.league === league
                      ? "bg-surface-elevated text-text-heading"
                      : "border-border text-text-muted hover:bg-surface-hover hover:text-text-heading"
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
                aria-label={`Filter by status ${status.label}${searchParams.status === status.value ? " (active)" : ""}`}
              >
                <Badge
                  variant={searchParams.status === status.value ? "default" : "outline"}
                  className={`cursor-pointer ${
                    searchParams.status === status.value
                      ? searchParams.status === "FREE_AGENT"
                        ? "bg-emerald-500 text-text-heading"
                        : "bg-surface-elevated text-text-heading"
                      : "border-border text-text-muted hover:bg-surface-hover hover:text-text-heading"
                  }`}
                >
                  {status.label}
                </Badge>
              </Link>
            ))}
          </div>

          {/* League Tier Filter */}
          <div className="flex flex-wrap gap-2">
            <DataLabel className="normal-case mr-2">League Tier:</DataLabel>
            {LEAGUE_TIER_OPTIONS.map((tier) => (
              <Link
                key={tier.value}
                href={`/players?${buildQueryString(baseParams, {
                  tier: searchParams.tier === tier.value ? undefined : tier.value,
                  page: undefined,
                })}`}
                aria-label={`Filter by tier ${tier.label}${searchParams.tier === tier.value ? " (active)" : ""}`}
              >
                <Badge
                  variant={searchParams.tier === tier.value ? "default" : "outline"}
                  className={`cursor-pointer ${
                    searchParams.tier === tier.value
                      ? tier.color
                      : "border-border text-text-muted hover:bg-surface-hover hover:text-text-heading"
                  }`}
                >
                  {tier.label}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Contract Filter */}
          <div className="flex flex-wrap gap-2">
            <DataLabel className="normal-case mr-2">Contract:</DataLabel>
            {[
              { value: "30", label: "< 30 days", color: "bg-red-500/20 text-red-400 border-red-500/30" },
              { value: "60", label: "< 60 days", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
              { value: "90", label: "< 90 days", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
            ].map((contract) => (
              <Link
                key={contract.value}
                href={`/players?${buildQueryString(baseParams, {
                  contract: searchParams.contract === contract.value ? undefined : contract.value,
                  page: undefined,
                })}`}
                aria-label={`Filter by contract ${contract.label}${searchParams.contract === contract.value ? " (active)" : ""}`}
              >
                <Badge
                  variant={searchParams.contract === contract.value ? "default" : "outline"}
                  className={`cursor-pointer ${
                    searchParams.contract === contract.value
                      ? contract.color
                      : "border-border text-text-muted hover:bg-surface-hover hover:text-text-heading"
                  }`}
                >
                  {contract.label}
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
                aria-label={`Sort by ${sort.label}${searchParams.sort === sort.value ? " (active)" : ""}`}
              >
                <Badge
                  variant={searchParams.sort === sort.value ? "default" : "outline"}
                  className={`cursor-pointer ${
                    searchParams.sort === sort.value
                      ? "bg-primary-accent text-text-heading"
                      : "border-border text-text-muted hover:bg-surface-hover hover:text-text-heading"
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
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-heading border border-border rounded-md hover:bg-surface-hover transition-colors"
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
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-surface-hover text-text-subtle hover:bg-muted hover:text-text-heading h-10 min-w-[44px] px-3 transition-colors touch-manipulation"
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
                  <Link key={1} href={`/players?${buildQueryString(baseParams, { page: "1" })}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 border border-border bg-surface-hover text-text-subtle hover:bg-muted transition-colors min-h-[44px] min-w-[44px] touch-manipulation">1</Link>
                );
                if (start > 2) buttons.push(<span key="start-ellipsis" className="text-text-muted px-1">...</span>);
              }
              for (let p = start; p <= end; p++) {
                buttons.push(
                  <Link
                    key={p}
                    href={`/players?${buildQueryString(baseParams, { page: String(p) })}`}
                    className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 transition-colors min-h-[44px] min-w-[44px] touch-manipulation ${
                      p === page
                        ? "bg-primary-accent text-text-heading"
                        : "border border-border bg-surface-hover text-text-subtle hover:bg-muted"
                    }`}
                  >
                    {p}
                  </Link>
                );
              }
              if (end < totalPages) {
                if (end < totalPages - 1) buttons.push(<span key="end-ellipsis" className="text-text-muted px-1">...</span>);
                buttons.push(
                  <Link key={totalPages} href={`/players?${buildQueryString(baseParams, { page: String(totalPages) })}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 border border-border bg-surface-hover text-text-subtle hover:bg-muted transition-colors min-h-[44px] min-w-[44px] touch-manipulation">{totalPages}</Link>
                );
              }
              return buttons;
            })()}
            {page < totalPages && (
              <Link
                href={`/players?${buildQueryString(baseParams, { page: String(page + 1) })}`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-surface-hover text-text-subtle hover:bg-muted hover:text-text-heading h-10 min-w-[44px] px-3 transition-colors touch-manipulation"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

