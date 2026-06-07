import { Metadata } from "next";
import { db } from "@/lib/server/db";
import { unstable_cache } from "next/cache";
import PageSection from "@/components/layout/PageSection";
import SectionHeader from "@/components/layout/SectionHeader";
import MercatoCard from "@/components/mercato/MercatoCard";
import { FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mercato Tracker | LeagueScout",
  description: "Track free agents and contract expiries across professional League of Legends leagues.",
};

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

const EXPIRY_OPTIONS = [
  { value: "all", label: "All dates" },
  { value: "expired", label: "Expired" },
  { value: "30days", label: "≤ 30 days" },
  { value: "90days", label: "≤ 90 days" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "FREE_AGENT", label: "Free Agent" },
  { value: "UNDER_CONTRACT", label: "Under Contract" },
];

async function getLeagues() {
  const rows = await db.player.groupBy({
    by: ["league"],
    where: { league: { not: "" } },
    _count: { league: true },
    orderBy: { league: "asc" },
  });
  return rows.map((r) => r.league);
}

const getCachedLeagues = unstable_cache(getLeagues, ["mercato-leagues"], {
  revalidate: 3600,
  tags: ["mercato-leagues", "mercato"],
});

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MercatoPage({ searchParams }: Props) {
  const params = await searchParams;
  const roleFilter = typeof params.role === "string" ? params.role : "";
  const leagueFilter = typeof params.league === "string" ? params.league : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const expiryFilter = typeof params.expiry === "string" ? params.expiry : "all";

  const leagues = await getCachedLeagues();

  const where: {
    role?: string;
    league?: string;
    status?: string | { in: string[] };
    contractEndDate?: { lt?: Date; gte?: Date; lte?: Date };
    AND?: Array<Record<string, unknown>>;
  } = {};

  if (roleFilter) where.role = roleFilter;
  if (leagueFilter) where.league = leagueFilter;

  if (statusFilter) {
    where.status = statusFilter;
  } else {
    where.status = { in: ["FREE_AGENT", "UNDER_CONTRACT"] };
  }

  if (expiryFilter !== "all") {
    const now = new Date();
    if (expiryFilter === "expired") {
      where.contractEndDate = { lt: now };
    } else if (expiryFilter === "30days") {
      const future = new Date();
      future.setDate(future.getDate() + 30);
      where.AND = [
        { contractEndDate: { gte: now } },
        { contractEndDate: { lte: future } },
      ];
    } else if (expiryFilter === "90days") {
      const future = new Date();
      future.setDate(future.getDate() + 90);
      where.AND = [
        { contractEndDate: { gte: now } },
        { contractEndDate: { lte: future } },
      ];
    }
  }

  const players = await db.player.findMany({
    where,
    orderBy: [
      { contractEndDate: { sort: "asc", nulls: "last" } },
      { pseudo: "asc" },
    ],
    take: 200,
    select: {
      id: true,
      pseudo: true,
      realName: true,
      role: true,
      league: true,
      status: true,
      currentTeam: true,
      photoUrl: true,
      nationality: true,
      contractEndDate: true,
    },
  });

  const hasFilters = roleFilter || leagueFilter || statusFilter || expiryFilter !== "all";

  return (
    <div className="min-h-screen bg-background">
      <PageSection>
        <SectionHeader
          title="Mercato Tracker"
          subtitle="Free agents and contract expiries across professional leagues"
        />

        {/* Filters */}
        <form className="flex flex-wrap gap-3 mb-8 items-end">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue={roleFilter}
              className="h-10 rounded-md border border-border bg-card px-3 text-sm text-text-heading focus:border-primary-accent focus:ring-1 focus:ring-primary-accent"
            >
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="league" className="text-xs font-medium text-text-muted uppercase tracking-wide">
              League
            </label>
            <select
              id="league"
              name="league"
              defaultValue={leagueFilter}
              className="h-10 rounded-md border border-border bg-card px-3 text-sm text-text-heading focus:border-primary-accent focus:ring-1 focus:ring-primary-accent"
            >
              <option value="">All leagues</option>
              {leagues.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={statusFilter}
              className="h-10 rounded-md border border-border bg-card px-3 text-sm text-text-heading focus:border-primary-accent focus:ring-1 focus:ring-primary-accent"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="expiry" className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Expiry
            </label>
            <select
              id="expiry"
              name="expiry"
              defaultValue={expiryFilter}
              className="h-10 rounded-md border border-border bg-card px-3 text-sm text-text-heading focus:border-primary-accent focus:ring-1 focus:ring-primary-accent"
            >
              {EXPIRY_OPTIONS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          <Button type="submit" size="sm" className="h-10">
            Filter
          </Button>

          {hasFilters && (
            <Link href="/mercato">
              <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5">
                <FilterX className="h-4 w-4" />
                Clear
              </Button>
            </Link>
          )}
        </form>

        {/* Results count */}
        <p className="text-sm text-text-muted mb-4">
          {players.length} player{players.length !== 1 ? "s" : ""} found
          {players.length === 200 && " (max displayed)"}
        </p>

        {/* Grid */}
        {players.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.map((player) => (
              <MercatoCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-text-muted text-lg mb-2">No players match your filters</p>
            <Link href="/mercato" className="text-primary-accent hover:underline text-sm">
              Clear all filters
            </Link>
          </div>
        )}
      </PageSection>
    </div>
  );
}
