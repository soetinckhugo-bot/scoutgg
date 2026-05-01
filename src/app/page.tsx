import { db } from "@/lib/server/db";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
// Card kept only for report cards (clickable content)
import { unstable_cache } from "next/cache";
import { RANK_COLORS } from "@/lib/constants";

function getRankColor(rankStr: string | null): string {
  if (!rankStr) return "text-text-heading";
  const tier = rankStr.split(" ")[0].toUpperCase();
  return RANK_COLORS[tier] || "text-text-heading";
}
import {
  Search,
  TrendingUp,
  Users,
  ExternalLink,
  Flame,
  FileText,
  Trophy,
  Star,
  Zap,
} from "lucide-react";
import ScoutIcon from "@/components/ScoutIcon";
import { ROLE_COLORS, STATUS_COLORS } from "@/lib/constants";
import { formatStatus } from "@/lib/utils";
import PlayerCard from "@/components/PlayerCard";
import { WebsiteJsonLd, OrganizationJsonLd } from "@/components/JsonLd";
import { HeroTitle, SectionHeader, DataLabel, DataValue } from "@/components/ui/typography";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LeagueScout - LoL Esports Scouting Platform",
  description: "Discover and analyze the next generation of League of Legends talent. Professional scouting reports, player profiles, performance radars, and data-driven insights across LEC, LFL, LCK, LPL and more.",
  openGraph: {
    title: "LeagueScout - LoL Esports Scouting Platform",
    description: "Discover and analyze the next generation of League of Legends talent. Professional scouting reports, player profiles, and data-driven insights.",
    type: "website",
  },
};
import Flag from "@/components/Flag";

const getFeaturedPlayer = unstable_cache(
  async () => {
    return db.player.findFirst({
      where: { isFeatured: true },
      select: {
        id: true,
        pseudo: true,
        realName: true,
        age: true,
        nationality: true,
        role: true,
        league: true,
        currentTeam: true,
        status: true,
        photoUrl: true,
        bio: true,
        opggUrl: true,
        golggUrl: true,
        lolprosUrl: true,
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
            csdAt15: true,
            gdAt15: true,
            gamesPlayed: true,
            globalScore: true,
            tierScore: true,
            winRate: true,
          },
        },
        reports: {
          where: { isPremium: false },
          take: 1,
          select: {
            id: true,
            title: true,
            verdict: true,
            author: true,
          },
        },
      },
    });
  },
  ["featured-player"],
  { revalidate: 300, tags: ["featured-player"] }
);

const getRecentPlayers = unstable_cache(
  async () => {
    return db.player.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        pseudo: true,
        realName: true,
        role: true,
        league: true,
        currentTeam: true,
        status: true,
        photoUrl: true,
        soloqStats: {
          select: {
            currentRank: true,
            peakLp: true,
            winrate: true,
            totalGames: true,
          },
        },
      },
    });
  },
  ["recent-players"],
  { revalidate: 300, tags: ["recent-players"] }
);

const getRecentReports = unstable_cache(
  async () => {
    return db.report.findMany({
      take: 3,
      orderBy: { publishedAt: "desc" },
      where: { isPremium: false },
      select: {
        id: true,
        title: true,
        content: true,
        verdict: true,
        author: true,
        publishedAt: true,
        player: {
          select: {
            id: true,
            pseudo: true,
            role: true,
            photoUrl: true,
          },
        },
      },
    });
  },
  ["recent-reports"],
  { revalidate: 300, tags: ["recent-reports"] }
);

const getSoloqPOTW = unstable_cache(
  async () => {
    const now = new Date();
    const currentYear = now.getFullYear();

    return db.soloqPOTW.findFirst({
      where: {
        isActive: true,
        year: currentYear,
      },
      orderBy: { week: "desc" },
      select: {
        week: true,
        player: {
          select: {
            id: true,
            pseudo: true,
            realName: true,
            age: true,
            nationality: true,
            role: true,
            status: true,
            league: true,
            currentTeam: true,
            photoUrl: true,
            soloqStats: {
              select: {
                peakLp: true,
                winrate: true,
                currentRank: true,
                totalGames: true,
              },
            },
          },
        },
      },
    });
  },
  ["soloq-potw"],
  { revalidate: 300, tags: ["soloq-potw"] }
);

const getFreeAgentCount = unstable_cache(
  async () => {
    return db.player.count({
      where: { status: "FREE_AGENT" },
    });
  },
  ["free-agent-count"],
  { revalidate: 300, tags: ["free-agent-count"] }
);

const getTotalPlayers = unstable_cache(
  async () => db.player.count(),
  ["total-players"],
  { revalidate: 300, tags: ["total-players"] }
);

export default async function HomePage() {
  const [featuredPlayer, recentPlayers, recentReports, soloqPotw, freeAgentCount, totalPlayers] = await Promise.all([
    getFeaturedPlayer(),
    getRecentPlayers(),
    getRecentReports(),
    getSoloqPOTW(),
    getFreeAgentCount(),
    getTotalPlayers(),
  ]);



  return (
    <>
      <WebsiteJsonLd />
      <OrganizationJsonLd />
      <div className="flex flex-col">
        {/* Hero Section */}
      <section className="relative border-b border-border overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 25% 50%, var(--accent) 0%, transparent 50%), radial-gradient(circle at 75% 50%, var(--primary-accent) 0%, transparent 40%)`
          }} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <h1 className="text-4xl font-bold tracking-tight text-text-heading sm:text-5xl font-heading">
                League<span className="text-primary-accent">Scout</span>
              </h1>
            </div>
            <p className="mx-auto max-w-2xl text-lg text-text-body">
              League of Legends scouting made accessible to everyone.
              Whether you&apos;re an amateur or a professional, LeagueScout is made for you.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/players"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-text-heading bg-surface-elevated border border-border rounded-lg hover:bg-secondary hover:border-border-hover transition-all"
              >
                Browse Players
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-text-heading bg-primary-accent rounded-lg hover:bg-primary-accent/90 transition-colors"
              >
                Get Scout Pass
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* POTM + SOLOQ Side by Side */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Player of the Month */}
          {featuredPlayer && (
            <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-full">
              <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                <ScoutIcon icon={Star} size="md" variant="accent" glow />
                <SectionHeader className="text-text-heading">Player of the Month</SectionHeader>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-4 mb-4">
                  {featuredPlayer.photoUrl ? (
                    <Image src={featuredPlayer.photoUrl} alt={featuredPlayer.pseudo} width={64} height={64} className="rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-text-heading">{(featuredPlayer.pseudo?.[0] ?? "?").toUpperCase()}</div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-text-heading">{featuredPlayer.pseudo}</h2>
                    <p className="text-xs text-text-muted">
                      {featuredPlayer.realName && <span>{featuredPlayer.realName}</span>}
                      {featuredPlayer.age && <span> • {featuredPlayer.age} yo</span>}
                      {featuredPlayer.nationality && <span> • {featuredPlayer.nationality}</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs h-5 px-2 ${ROLE_COLORS[featuredPlayer.role] || ""}`}>{featuredPlayer.role}</Badge>
                      <Badge className={`text-xs h-5 px-2 ${STATUS_COLORS[featuredPlayer.status] || ""}`}>{formatStatus(featuredPlayer.status)}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                      <span>{featuredPlayer.league}</span>
                      <span>•</span>
                      <span>{featuredPlayer.currentTeam || "No team"}</span>
                    </div>
                  </div>
                </div>
                {featuredPlayer.proStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-surface-hover rounded py-2 px-1">
                      <p className="text-xs text-text-muted uppercase tracking-wider">KDA</p>
                      <p className="text-sm font-bold text-text-heading tabular-nums">{featuredPlayer.proStats.kda?.toFixed(2) || "-"}</p>
                    </div>
                    <div className="bg-surface-hover rounded py-2 px-1">
                      <p className="text-xs text-text-muted uppercase tracking-wider">CSD@15</p>
                      <p className="text-sm font-bold text-text-heading tabular-nums">{featuredPlayer.proStats.csdAt15 ? `${featuredPlayer.proStats.csdAt15 > 0 ? "+" : ""}${featuredPlayer.proStats.csdAt15.toFixed(1)}` : "-"}</p>
                    </div>
                    <div className="bg-surface-hover rounded py-2 px-1">
                      <p className="text-xs text-text-muted uppercase tracking-wider">DPM</p>
                      <p className="text-sm font-bold text-text-heading tabular-nums">{featuredPlayer.proStats.dpm?.toFixed(0) || "-"}</p>
                    </div>
                    <div className="bg-surface-hover rounded py-2 px-1">
                      <p className="text-xs text-text-muted uppercase tracking-wider">Games</p>
                      <p className="text-sm font-bold text-text-heading tabular-nums">{featuredPlayer.proStats.gamesPlayed || "-"}</p>
                    </div>
                  </div>
                )}
                <div className="flex-1" />
                <Link
                  href={`/players/${featuredPlayer.id}`}
                  className="inline-flex items-center justify-center w-full mt-4 px-4 py-2 text-sm font-medium text-text-heading bg-primary-accent rounded-md hover:bg-primary-accent/90 transition-colors"
                >
                  View Full Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Player of SOLOQ */}
          {soloqPotw ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-full">
              <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                <ScoutIcon icon={Zap} size="md" variant="gold" glow />
                <span className="text-xs font-semibold uppercase tracking-wider text-text-heading">Player of SOLOQ</span>
                <Badge className="text-xs h-5 px-2 bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Week {soloqPotw.week}</Badge>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-4 mb-4">
                  {soloqPotw.player.photoUrl ? (
                    <Image src={soloqPotw.player.photoUrl} alt={soloqPotw.player.pseudo} width={64} height={64} className="rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-text-heading">{(soloqPotw.player.pseudo?.[0] ?? "?").toUpperCase()}</div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-text-heading">{soloqPotw.player.pseudo}</h2>
                    <p className="text-xs text-text-muted">
                      {soloqPotw.player.realName && <span>{soloqPotw.player.realName}</span>}
                      {soloqPotw.player.age && <span> • {soloqPotw.player.age} yo</span>}
                      {soloqPotw.player.nationality && <span> • {soloqPotw.player.nationality}</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs h-5 px-2 ${ROLE_COLORS[soloqPotw.player.role] || ""}`}>{soloqPotw.player.role}</Badge>
                      <Badge className={`text-xs h-5 px-2 ${STATUS_COLORS[soloqPotw.player.status] || ""}`}>{formatStatus(soloqPotw.player.status)}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                      <span>{soloqPotw.player.league}</span>
                      <span>•</span>
                      <span>{soloqPotw.player.currentTeam || "No team"}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-surface-hover rounded py-2 px-1">
                    <p className="text-xs text-text-muted uppercase tracking-wider">Peak LP</p>
                    <p className="text-sm font-bold text-text-heading tabular-nums">{soloqPotw.player.soloqStats?.peakLp ? `+${soloqPotw.player.soloqStats.peakLp}` : "—"}</p>
                  </div>
                  <div className="bg-surface-hover rounded py-2 px-1">
                    <p className="text-xs text-text-muted uppercase tracking-wider">Winrate</p>
                    <p className="text-sm font-bold text-emerald-400 tabular-nums">{soloqPotw.player.soloqStats?.winrate ? `${(soloqPotw.player.soloqStats.winrate * 100).toFixed(0)}%` : "—"}</p>
                  </div>
                  <div className="bg-surface-hover rounded py-2 px-1">
                    <p className="text-xs text-text-muted uppercase tracking-wider">Rank</p>
                    <p className="text-sm font-bold text-text-heading tabular-nums">{soloqPotw.player.soloqStats?.currentRank?.split(" ")[0] || "—"}</p>
                  </div>
                  <div className="bg-surface-hover rounded py-2 px-1">
                    <p className="text-xs text-text-muted uppercase tracking-wider">Games</p>
                    <p className="text-sm font-bold text-text-heading tabular-nums">{soloqPotw.player.soloqStats?.totalGames || "—"}</p>
                  </div>
                </div>

                <div className="flex-1" />
                <Link
                  href={`/players/${soloqPotw.player.id}`}
                  className="inline-flex items-center justify-center w-full mt-4 px-4 py-2 text-sm font-medium text-text-heading bg-primary-accent rounded-md hover:bg-primary-accent/90 transition-colors"
                >
                  View Full Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-full items-center justify-center p-8 text-center">
              <ScoutIcon icon={Zap} size="xl" variant="gold" glow bg />
              <h2 className="text-lg font-bold text-text-heading mb-1">Player of SOLOQ</h2>
              <p className="text-sm text-text-muted">No SOLOQ player of the week yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-text-heading tabular-nums">{totalPlayers}</p>
              <p className="text-xs text-text-muted uppercase tracking-wider mt-1">Players</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-text-heading tabular-nums">{recentReports.length}</p>
              <p className="text-xs text-text-muted uppercase tracking-wider mt-1">Scouting Reports</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-text-heading tabular-nums">15+</p>
              <p className="text-xs text-text-muted uppercase tracking-wider mt-1">Leagues Covered</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-text-heading tabular-nums">Weekly</p>
              <p className="text-xs text-text-muted uppercase tracking-wider mt-1">New Reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Players */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-heading">Recently Added</h2>
          <Link
            href="/players"
            className="text-sm font-medium text-accent hover:text-text-heading text-text-body hover:text-text-heading flex items-center gap-1"
          >
            View All <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {recentPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              showStats={false}
              showFavorite={false}
              variant="compact"
            />
          ))}
        </div>
      </section>

      {/* Free Reports */}
      {recentReports.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-heading">Free Reports</h2>
            <Link
              href="/reports"
              className="text-sm font-medium text-text-body hover:text-text-heading flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentReports.map((report) => (
              <Link key={report.id} href={`/players/${report.player.id}`}>
                <Card className="hover:shadow-md transition-shadow border-border bg-card cursor-pointer h-full">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-text-heading">
                        {(report.player.pseudo?.[0] ?? "?").toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-text-heading">
                        {report.player.pseudo}
                      </span>
                    </div>
                    <h3 className="font-semibold text-text-heading mb-2">
                      {report.title}
                    </h3>
                    <p className="text-sm text-text-muted line-clamp-3 mb-3">
                      {report.content.slice(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-xs border-emerald-500 text-emerald-400"
                      >
                        {report.verdict}
                      </Badge>
                      <span className="text-xs text-text-muted">
                        by {report.author}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* See it in action */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-heading mb-3 font-heading">Our Tools</h2>
            <p className="text-text-body">The tools professionals use every day to make better decisions</p>
          </div>
          
          {/* Feature 1: Radar */}
          <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-text-muted">leaguescout.gg</span>
              </div>
              <div className="aspect-square bg-background rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                    <span className="text-4xl">📊</span>
                  </div>
                  <p className="text-sm text-text-muted">Performance Radar</p>
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-3 py-1 text-xs font-medium bg-accent/30 text-cyan-400 rounded-full mb-4">Visualization</span>
              <h3 className="text-2xl font-bold text-text-heading mb-3 font-heading">Customizable radars & charts</h3>
              <p className="text-text-body leading-relaxed">
                Choose from over 50 statistics — raw values, percentiles, or both at once. 
                Build the exact profile you need for each role. Compare any two players side by side 
                with our dual radar visualization.
              </p>
            </div>
          </div>

          {/* Feature 2: Similarity */}
          <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
            <div className="order-2 md:order-1">
              <span className="inline-block px-3 py-1 text-xs font-medium bg-primary-accent/10 text-primary-accent rounded-full mb-4">Scouting</span>
              <h3 className="text-2xl font-bold text-text-heading mb-3 font-heading">Similar player profiles</h3>
              <p className="text-text-body leading-relaxed">
                Find statistically comparable players in seconds. Filter by league, role, or age — 
                ideal for identifying budget-friendly alternatives or planning succession on a specific role.
              </p>
            </div>
            <div className="order-1 md:order-2 bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-text-muted">leaguescout.gg</span>
              </div>
              <div className="space-y-3">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded w-24 mb-1" />
                      <div className="h-2 bg-muted rounded w-16" />
                    </div>
                    <div className="h-2 bg-muted rounded w-12" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 3: Compare */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-text-muted">leaguescout.gg</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-2" />
                  <p className="text-xs text-text-muted">Player A</p>
                </div>
                <span className="text-lg font-bold text-primary-accent">VS</span>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-2" />
                  <p className="text-xs text-text-muted">Player B</p>
                </div>
              </div>
              <div className="space-y-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-2 bg-primary-accent rounded flex-1" style={{width: `${60 + i * 10}%`}} />
                    <div className="h-2 bg-accent rounded flex-1" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="inline-block px-3 py-1 text-xs font-medium bg-accent/30 text-cyan-400 rounded-full mb-4">Comparison</span>
              <h3 className="text-2xl font-bold text-text-heading mb-3 font-heading">Head-to-head comparison</h3>
              <p className="text-text-body leading-relaxed">
                Compare any two players across 20+ metrics. Visual bars show the winner for each stat, 
                with percentile context so you know not just who wins, but by how much.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Championships */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-text-heading mb-3 font-heading">Our Championships</h2>
            <p className="text-text-body">10+ leagues covered worldwide</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Europe Tier 1 */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-text-heading mb-4">Europe Tier 1</h3>
              <div className="space-y-2 flex-1">
                <Link href="/players?league=LEC" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">LEC</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="eu" /> Europe</span>
                </Link>
                <Link href="/players?league=LFL" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">LFL</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="fr" /> France</span>
                </Link>
                <Link href="/players?league=LES" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">LES</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="es" /> Spain</span>
                </Link>
                <Link href="/players?league=TCL" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">TCL</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="tr" /> Turkey</span>
                </Link>
                <Link href="/players?league=PRM" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">PRM</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code={["de", "at", "ch"]} /> DACH</span>
                </Link>
              </div>
            </div>

            {/* Europe Tier 2 */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-text-heading mb-4">Europe Tier 2</h3>
              <div className="space-y-2 flex-1">
                <Link href="/players?league=AL" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">AL</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="sa" /> Arabia</span>
                </Link>
                <Link href="/players?league=EBL" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">EBL</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="ba" /> Balkans</span>
                </Link>
                <Link href="/players?league=ROL" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">ROL</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code={["be", "nl", "lu"]} /> Benelux</span>
                </Link>
                <Link href="/players?league=HM" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">HM</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code={["cz", "sk"]} /> Czech/Slovakia</span>
                </Link>
                <Link href="/players?league=HLL" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">HLL</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code={["gr", "cy"]} /> Greece/Cyprus</span>
                </Link>
                <Link href="/players?league=LIT" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">LIT</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="it" /> Italy</span>
                </Link>
                <Link href="/players?league=RL" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">RL</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code={["pl", "lt", "lv", "ee"]} /> Poland/Baltics</span>
                </Link>
                <Link href="/players?league=LPLOL" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">LPLOL</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="pt" /> Portugal</span>
                </Link>
                <Link href="/players?league=NLC" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">NLC</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code={["uk", "dk", "no", "se", "fi"]} /> UK/Nordics</span>
                </Link>
                <Link href="/players?league=LFL2" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">LFL2</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="fr" /> France 2</span>
                </Link>
              </div>
              <p className="text-xs text-text-muted mt-3 text-center">and more...</p>
            </div>

            {/* World */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-text-heading mb-4">World</h3>
              <div className="space-y-2 flex-1">
                <Link href="/players?league=LCK" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">LCK</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="kr" /> Korea</span>
                </Link>
                <Link href="/players?league=LPL" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">LPL</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="cn" /> China</span>
                </Link>
                <Link href="/players?league=LDL" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">LDL</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="cn" /> China 2</span>
                </Link>
                <Link href="/players?league=LCS" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">LCS</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="us" /> North America</span>
                </Link>
                <Link href="/players?league=NACL" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">NACL</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="us" /> NA Challengers</span>
                </Link>
                <Link href="/players?league=CBLOL" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">CBLOL</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="br" /> Brazil</span>
                </Link>
                <Link href="/players?league=LCK+CL" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">LCK CL</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="kr" /> Korea 2</span>
                </Link>
                <Link href="/players?league=LCP" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <span className="text-sm font-medium text-text-heading">LCP</span>
                  <span className="text-xs text-text-muted flex items-center gap-1.5"><Flag code="tw" /> Taiwan</span>
                </Link>
              </div>
              <p className="text-xs text-text-muted mt-3 text-center">and more...</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Plans */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-heading mb-3 font-heading">Our Plans</h2>
            <p className="text-text-body">Choose the plan that matches your ambitions</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
              <div className="min-h-[28px]" />
              <h3 className="text-lg font-semibold text-text-heading mb-2">Free</h3>
              <div className="min-h-[60px]">
                <p className="text-3xl font-bold text-text-heading mb-1">€0</p>
                <p className="text-sm text-text-muted">Forever free</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 mt-6">
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> Browse all players
                </li>
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> Basic stats & radar
                </li>
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> Player comparison
                </li>
                <li className="flex items-center gap-2 text-sm text-text-muted">
                  <span className="text-text-muted">✗</span> Scouting reports
                </li>
              </ul>
              <a href="/players" className="block w-full text-center py-2.5 text-sm font-medium text-text-heading border border-border rounded-lg hover:bg-surface-hover transition-colors mt-auto">
                Get Started
              </a>
            </div>

            {/* Supporter */}
            <div className="rounded-xl border border-border bg-card p-6 relative flex flex-col">
              <div className="min-h-[28px]" />
              <h3 className="text-lg font-semibold text-text-heading mb-2">Supporter</h3>
              <div className="min-h-[60px]">
                <p className="text-3xl font-bold text-text-heading mb-1">€1.99</p>
                <p className="text-sm text-text-muted">/month</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 mt-6">
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> Everything in Free
                </li>
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> Premium reports
                </li>
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> Watchlist
                </li>
                <li className="flex items-center gap-2 text-sm text-text-muted">
                  <span className="text-text-muted">✗</span> Advanced filters
                </li>
              </ul>
              <a href="/pricing" className="block w-full text-center py-2.5 text-sm font-medium text-text-heading bg-surface-elevated rounded-lg hover:bg-secondary transition-colors mt-auto">
                Subscribe
              </a>
            </div>

            {/* Scout Pro */}
            <div className="rounded-xl border-2 border-primary-accent bg-card px-6 pb-6 pt-4 relative flex flex-col overflow-visible">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="inline-flex items-center rounded-full bg-primary-accent px-3 py-1 text-xs font-semibold text-text-heading whitespace-nowrap">Most Popular</span>
              </div>
              <h3 className="text-lg font-semibold text-text-heading mb-2 mt-2">Scout Pro</h3>
              <div className="min-h-[60px]">
                <p className="text-3xl font-bold text-text-heading mb-1">€9.99</p>
                <p className="text-sm text-text-muted">/month</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 mt-6">
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> Everything in Supporter
                </li>
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> Advanced filters
                </li>
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> Export data (CSV)
                </li>
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> Discord access
                </li>
              </ul>
              <a href="/pricing" className="block w-full text-center py-2.5 text-sm font-medium text-text-heading bg-primary-accent rounded-lg hover:bg-primary-accent/90 transition-colors mt-auto">
                Get Scout Pro →
              </a>
            </div>

            {/* Consulting */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
              <div className="min-h-[28px]" />
              <h3 className="text-lg font-semibold text-text-heading mb-2">Consulting</h3>
              <div className="min-h-[60px]">
                <p className="text-3xl font-bold text-text-heading mb-1">Custom</p>
                <p className="text-sm text-text-muted">For organizations</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 mt-6">
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> Everything in Scout Pro
                </li>
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> API access
                </li>
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> Dedicated support
                </li>
                <li className="flex items-center gap-2 text-sm text-text-body">
                  <span className="text-emerald-400">✓</span> Custom reports
                </li>
              </ul>
              <a href="/contact" className="block w-full text-center py-2.5 text-sm font-medium text-text-heading border border-border rounded-lg hover:bg-surface-hover transition-colors mt-auto">
                Contact Us
              </a>
            </div>
          </div>
          <div className="text-center mt-8">
            <a href="/pricing" className="text-sm text-primary-accent hover:text-primary-accent/90 transition-colors">
              View all details →
            </a>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

