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
  if (!rankStr) return "text-white";
  const tier = rankStr.split(" ")[0].toUpperCase();
  return RANK_COLORS[tier] || "text-white";
}
import {
  Search,
  TrendingUp,
  Users,
  Star,
  ExternalLink,
  Zap,
  Flame,
  FileText,
  Trophy,
} from "lucide-react";
import { ROLE_COLORS, STATUS_COLORS } from "@/lib/constants";
import { formatStatus } from "@/lib/utils";
import PlayerCard from "@/components/PlayerCard";
import { WebsiteJsonLd, OrganizationJsonLd } from "@/components/JsonLd";
import { HeroTitle, SectionHeader, DataLabel, DataValue } from "@/components/ui/typography";

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
      include: {
        player: {
          include: {
            soloqStats: true,
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
        <div className="absolute inset-0 bg-[#0F0F1A]">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 25% 50%, #0F3460 0%, transparent 50%), radial-gradient(circle at 75% 50%, #E94560 0%, transparent 40%)`
          }} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl font-heading">
                League<span className="text-[#E94560]">Scout</span>
              </h1>
            </div>
            <p className="mx-auto max-w-2xl text-lg text-[#A0AEC0]">
              League of Legends scouting made accessible to everyone.
              Whether you&apos;re an amateur or a professional, LeagueScout is made for you.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <a
                href="/players"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-[#1A1A2E] border border-[#2A2D3A] rounded-lg hover:bg-[#16213E] hover:border-[#3A3D4A] transition-all"
              >
                Browse Players
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-[#E94560] rounded-lg hover:bg-[#d13b54] transition-colors"
              >
                Get Scout Pass
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* POTM + SOLOQ Side by Side */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Player of the Month */}
          {featuredPlayer && (
            <div className="rounded-xl border border-[#2A2D3A] bg-[#141621] overflow-hidden flex flex-col h-full">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#1A1D29] border-b border-[#2A2D3A]">
                <Star className="size-4 text-[#E94560]" />
                <SectionHeader className="text-[#E9ECEF]">Player of the Month</SectionHeader>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-4 mb-4">
                  {featuredPlayer.photoUrl ? (
                    <Image src={featuredPlayer.photoUrl} alt={featuredPlayer.pseudo} width={64} height={64} className="rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#232838] flex items-center justify-center text-xl font-bold text-[#E9ECEF]">{(featuredPlayer.pseudo?.[0] ?? "?").toUpperCase()}</div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-[#E9ECEF]">{featuredPlayer.pseudo}</h3>
                    <p className="text-xs text-[#6C757D]">
                      {featuredPlayer.realName && <span>{featuredPlayer.realName}</span>}
                      {featuredPlayer.age && <span> • {featuredPlayer.age} yo</span>}
                      {featuredPlayer.nationality && <span> • {featuredPlayer.nationality}</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs h-5 px-2 ${ROLE_COLORS[featuredPlayer.role] || ""}`}>{featuredPlayer.role}</Badge>
                      <Badge className={`text-xs h-5 px-2 ${STATUS_COLORS[featuredPlayer.status] || ""}`}>{formatStatus(featuredPlayer.status)}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#6C757D]">
                      <span>{featuredPlayer.league}</span>
                      <span>•</span>
                      <span>{featuredPlayer.currentTeam || "No team"}</span>
                    </div>
                  </div>
                </div>
                {featuredPlayer.proStats && (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-[#1A1D29] rounded py-2 px-1">
                      <p className="text-xs text-[#6C757D] uppercase tracking-wider">KDA</p>
                      <p className="text-sm font-bold text-[#E9ECEF] tabular-nums">{featuredPlayer.proStats.kda?.toFixed(2) || "-"}</p>
                    </div>
                    <div className="bg-[#1A1D29] rounded py-2 px-1">
                      <p className="text-xs text-[#6C757D] uppercase tracking-wider">CSD@15</p>
                      <p className="text-sm font-bold text-[#E9ECEF] tabular-nums">{featuredPlayer.proStats.csdAt15 ? `${featuredPlayer.proStats.csdAt15 > 0 ? "+" : ""}${featuredPlayer.proStats.csdAt15.toFixed(1)}` : "-"}</p>
                    </div>
                    <div className="bg-[#1A1D29] rounded py-2 px-1">
                      <p className="text-xs text-[#6C757D] uppercase tracking-wider">DPM</p>
                      <p className="text-sm font-bold text-[#E9ECEF] tabular-nums">{featuredPlayer.proStats.dpm?.toFixed(0) || "-"}</p>
                    </div>
                    <div className="bg-[#1A1D29] rounded py-2 px-1">
                      <p className="text-xs text-[#6C757D] uppercase tracking-wider">Games</p>
                      <p className="text-sm font-bold text-[#E9ECEF] tabular-nums">{featuredPlayer.proStats.gamesPlayed || "-"}</p>
                    </div>
                  </div>
                )}
                <div className="flex-1" />
                <a
                  href={`/players/${featuredPlayer.id}`}
                  className="inline-flex items-center justify-center w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-[#E94560] rounded-md hover:bg-[#d13b54] transition-colors"
                >
                  View Full Profile <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          {/* Player of SOLOQ */}
          {/* SOLOQ Player of the Week - Mock Data */}
          <div className="rounded-xl border border-[#2A2D3A] bg-[#141621] overflow-hidden flex flex-col h-full">
            <div className="flex items-center gap-2 px-4 py-3 bg-[#1A1D29] border-b border-[#2A2D3A]">
              <Zap className="size-4 text-yellow-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#E9ECEF]">Player of SOLOQ</span>
              <Badge className="text-xs h-5 px-2 bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Week 12</Badge>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-[#232838] flex items-center justify-center text-xl font-bold text-[#E9ECEF]">V</div>
                <div>
                  <h3 className="text-lg font-bold text-[#E9ECEF]">Vladi</h3>
                  <p className="text-xs text-[#6C757D]">Vladimir T. • 21 yo • France</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs h-5 px-2 ${ROLE_COLORS["MID"] || ""}`}>MID</Badge>
                    <Badge className="text-xs h-5 px-2 bg-[#1A1A2E] text-[#ADB5BD] border-[#2A2D3A]">UNDER CONTRACT</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#6C757D]">
                    <span>LFL</span>
                    <span>•</span>
                    <span>Karmine Corp</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-[#1A1D29] rounded py-2 px-1">
                  <p className="text-xs text-[#6C757D] uppercase tracking-wider">Peak LP</p>
                  <p className="text-sm font-bold text-[#E9ECEF] tabular-nums">+312</p>
                </div>
                <div className="bg-[#1A1D29] rounded py-2 px-1">
                  <p className="text-xs text-[#6C757D] uppercase tracking-wider">Winrate</p>
                  <p className="text-sm font-bold text-emerald-400 tabular-nums">68%</p>
                </div>
                <div className="bg-[#1A1D29] rounded py-2 px-1">
                  <p className="text-xs text-[#6C757D] uppercase tracking-wider">Rank</p>
                  <p className="text-sm font-bold text-[#E9ECEF] tabular-nums">CHALLENGER</p>
                </div>
                <div className="bg-[#1A1D29] rounded py-2 px-1">
                  <p className="text-xs text-[#6C757D] uppercase tracking-wider">Games</p>
                  <p className="text-sm font-bold text-[#E9ECEF] tabular-nums">47</p>
                </div>
              </div>

              <div className="flex-1" />
              <a
                href="/players"
                className="inline-flex items-center justify-center w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-[#E94560] rounded-md hover:bg-[#d13b54] transition-colors"
              >
                View Full Profile <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-[#2A2D3A] bg-[#0F0F1A]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-[#E9ECEF] tabular-nums">{totalPlayers}</p>
              <p className="text-xs text-[#6C757D] uppercase tracking-wider mt-1">Players</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#E9ECEF] tabular-nums">{recentReports.length}</p>
              <p className="text-xs text-[#6C757D] uppercase tracking-wider mt-1">Scouting Reports</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#E9ECEF] tabular-nums">10+</p>
              <p className="text-xs text-[#6C757D] uppercase tracking-wider mt-1">Leagues Covered</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#E9ECEF] tabular-nums">Weekly</p>
              <p className="text-xs text-[#6C757D] uppercase tracking-wider mt-1">New Reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Players */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1A1A2E] dark:text-white">Recently Added</h2>
          <Link
            href="/players"
            className="text-sm font-medium text-[#0F3460] hover:text-[#1A1A2E] dark:text-gray-400 dark:hover:text-white flex items-center gap-1"
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

      {/* See it in action */}
      <section className="border-t border-[#2A2D3A] bg-[#0F0F1A]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3 font-heading">Our Tools</h2>
            <p className="text-[#A0AEC0]">The tools professionals use every day to make better decisions</p>
          </div>
          
          {/* Feature 1: Radar */}
          <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
            <div className="bg-[#141621] rounded-xl border border-[#2A2D3A] p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-[#6C757D] ml-2">leaguescout.gg</span>
              </div>
              <div className="aspect-square bg-[#0F0F1A] rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full border-2 border-dashed border-[#2A2D3A] flex items-center justify-center">
                    <span className="text-4xl">📊</span>
                  </div>
                  <p className="text-sm text-[#6C757D]">Performance Radar</p>
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-3 py-1 text-xs font-medium bg-[#0F3460]/30 text-[#4ECDC4] rounded-full mb-4">Visualization</span>
              <h3 className="text-2xl font-bold text-white mb-3 font-heading">Customizable radars & charts</h3>
              <p className="text-[#A0AEC0] leading-relaxed">
                Choose from over 50 statistics — raw values, percentiles, or both at once. 
                Build the exact profile you need for each role. Compare any two players side by side 
                with our dual radar visualization.
              </p>
            </div>
          </div>

          {/* Feature 2: Similarity */}
          <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
            <div className="order-2 md:order-1">
              <span className="inline-block px-3 py-1 text-xs font-medium bg-[#E94560]/10 text-[#E94560] rounded-full mb-4">Scouting</span>
              <h3 className="text-2xl font-bold text-white mb-3 font-heading">Similar player profiles</h3>
              <p className="text-[#A0AEC0] leading-relaxed">
                Find statistically comparable players in seconds. Filter by league, role, or age — 
                ideal for identifying budget-friendly alternatives or planning succession on a specific role.
              </p>
            </div>
            <div className="order-1 md:order-2 bg-[#141621] rounded-xl border border-[#2A2D3A] p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-[#6C757D] ml-2">leaguescout.gg</span>
              </div>
              <div className="space-y-3">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#0F0F1A] rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-[#232838]" />
                    <div className="flex-1">
                      <div className="h-3 bg-[#232838] rounded w-24 mb-1" />
                      <div className="h-2 bg-[#232838] rounded w-16" />
                    </div>
                    <div className="h-2 bg-[#232838] rounded w-12" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 3: Compare */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-[#141621] rounded-xl border border-[#2A2D3A] p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-[#6C757D] ml-2">leaguescout.gg</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#232838] mx-auto mb-2" />
                  <p className="text-xs text-[#6C757D]">Player A</p>
                </div>
                <span className="text-lg font-bold text-[#E94560]">VS</span>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#232838] mx-auto mb-2" />
                  <p className="text-xs text-[#6C757D]">Player B</p>
                </div>
              </div>
              <div className="space-y-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-2 bg-[#E94560] rounded flex-1" style={{width: `${60 + i * 10}%`}} />
                    <div className="h-2 bg-[#0F3460] rounded flex-1" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="inline-block px-3 py-1 text-xs font-medium bg-[#0F3460]/30 text-[#4ECDC4] rounded-full mb-4">Comparison</span>
              <h3 className="text-2xl font-bold text-white mb-3 font-heading">Head-to-head comparison</h3>
              <p className="text-[#A0AEC0] leading-relaxed">
                Compare any two players across 20+ metrics. Visual bars show the winner for each stat, 
                with percentile context so you know not just who wins, but by how much.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Reports */}
      {recentReports.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-[#2A2D3A]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Free Reports</h2>
            <Link
              href="/reports"
              className="text-sm font-medium text-[#A0AEC0] hover:text-white flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentReports.map((report) => (
              <Link key={report.id} href={`/players/${report.player.id}`}>
                <Card className="hover:shadow-md transition-shadow border-[#2A2D3A] bg-[#141621] cursor-pointer h-full">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-[#232838] flex items-center justify-center text-sm font-bold text-[#E9ECEF]">
                        {(report.player.pseudo?.[0] ?? "?").toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-[#E9ECEF]">
                        {report.player.pseudo}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#E9ECEF] mb-2">
                      {report.title}
                    </h3>
                    <p className="text-sm text-[#6C757D] line-clamp-3 mb-3">
                      {report.content.slice(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-xs border-emerald-500 text-emerald-400"
                      >
                        {report.verdict}
                      </Badge>
                      <span className="text-xs text-[#6C757D]">
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

      {/* Our Championships */}
      <section className="border-t border-[#2A2D3A] bg-[#0F0F1A]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3 font-heading">Our Championships</h2>
            <p className="text-[#A0AEC0]">10+ leagues covered worldwide</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Europe Tier 1 */}
            <div className="rounded-xl border border-[#2A2D3A] bg-[#141621] p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-[#E9ECEF] mb-4">Europe Tier 1</h3>
              <div className="space-y-2 flex-1">
                <Link href="/players?league=LEC" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">LEC</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDEA\uD83C\uDDFA Europe</span>
                </Link>
                <Link href="/players?league=LFL" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">LFL</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDEB\uD83C\uDDF7 France</span>
                </Link>
                <Link href="/players?league=LES" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">LES</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDEA\uD83C\uDDF8 Spain</span>
                </Link>
                <Link href="/players?league=TCL" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">TCL</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDF9\uD83C\uDDF7 Turkey</span>
                </Link>
                <Link href="/players?league=PRM" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">PRM</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDE9\uD83C\uDDEA\uD83C\uDDE6\uD83C\uDDF9\uD83C\uDDE8\uD83C\uDDED DACH</span>
                </Link>
              </div>
            </div>

            {/* Europe Tier 2 */}
            <div className="rounded-xl border border-[#2A2D3A] bg-[#141621] p-6">
              <h3 className="text-lg font-semibold text-[#E9ECEF] mb-4">Europe Tier 2</h3>
              <div className="space-y-2">
                <Link href="/players?league=AL" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">AL</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDF8\uD83C\uDDE6 Arabia</span>
                </Link>
                <Link href="/players?league=EBL" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">EBL</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDE7\uD83C\uDDE6 Balkans</span>
                </Link>
                <Link href="/players?league=ROL" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">ROL</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDE7\uD83C\uDDEA\uD83C\uDDF3\uD83C\uDDF1 Benelux</span>
                </Link>
                <Link href="/players?league=HM" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">HM</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDE8\uD83C\uDDFF\uD83C\uDDF8\uD83C\uDDF0 Czech/Slovakia</span>
                </Link>
                <Link href="/players?league=HLL" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">HLL</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDEC\uD83C\uDDF7\uD83C\uDDE8\uD83C\uDDFE Greece/Cyprus</span>
                </Link>
                <Link href="/players?league=LIT" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">LIT</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDEE\uD83C\uDDF9 Italy</span>
                </Link>
                <Link href="/players?league=RL" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">RL</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDF5\uD83C\uDDF1 Poland/Baltics</span>
                </Link>
                <Link href="/players?league=LPLOL" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">LPLOL</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDF5\uD83C\uDDF9 Portugal</span>
                </Link>
                <Link href="/players?league=NLC" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">NLC</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDEC\uD83C\uDDE7\uD83C\uDDF3\uD83C\uDDF4 UK/Nordics</span>
                </Link>
                <Link href="/players?league=LFL2" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">LFL2</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDEB\uD83C\uDDF7 France 2</span>
                </Link>
              </div>
              <p className="text-xs text-[#6C757D] mt-3 text-center">and more...</p>
            </div>

            {/* World */}
            <div className="rounded-xl border border-[#2A2D3A] bg-[#141621] p-6">
              <h3 className="text-lg font-semibold text-[#E9ECEF] mb-4">World</h3>
              <div className="space-y-2">
                <Link href="/players?league=LCK" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">LCK</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDF0\uD83C\uDDF7 Korea</span>
                </Link>
                <Link href="/players?league=LPL" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">LPL</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDE8\uD83C\uDDF3 China</span>
                </Link>
                <Link href="/players?league=LDL" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">LDL</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDE8\uD83C\uDDF3 China 2</span>
                </Link>
                <Link href="/players?league=LCS" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">LCS</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDFA\uD83C\uDDF8 North America</span>
                </Link>
                <Link href="/players?league=NACL" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">NACL</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDFA\uD83C\uDDF8 NA Challengers</span>
                </Link>
                <Link href="/players?league=CBLOL" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">CBLOL</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDE7\uD83C\uDDF7 Brazil</span>
                </Link>
                <Link href="/players?league=LCK+CL" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">LCK CL</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDF0\uD83C\uDDF7 Korea 2</span>
                </Link>
                <Link href="/players?league=LCP" className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1D29] transition-colors group">
                  <span className="text-sm font-medium text-[#E9ECEF]">LCP</span>
                  <span className="text-xs text-[#6C757D]">\uD83C\uDDF9\uD83C\uDDFC Taiwan</span>
                </Link>
              </div>
              <p className="text-xs text-[#6C757D] mt-3 text-center">and more...</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Plans */}
      <section className="border-t border-[#2A2D3A] bg-[#0F0F1A]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3 font-heading">Our Plans</h2>
            <p className="text-[#A0AEC0]">Choose the plan that matches your ambitions</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="rounded-xl border border-[#2A2D3A] bg-[#141621] p-6 flex flex-col">
              <div className="min-h-[28px]" />
              <h3 className="text-lg font-semibold text-white mb-2">Free</h3>
              <div className="min-h-[60px]">
                <p className="text-3xl font-bold text-white mb-1">€0</p>
                <p className="text-sm text-[#6C757D]">Forever free</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 mt-6">
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> Browse all players
                </li>
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> Basic stats & radar
                </li>
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> Player comparison
                </li>
                <li className="flex items-center gap-2 text-sm text-[#6C757D]">
                  <span className="text-[#6C757D]">✗</span> Scouting reports
                </li>
              </ul>
              <a href="/players" className="block w-full text-center py-2.5 text-sm font-medium text-white border border-[#2A2D3A] rounded-lg hover:bg-[#1A1D29] transition-colors mt-auto">
                Get Started
              </a>
            </div>

            {/* Supporter */}
            <div className="rounded-xl border border-[#2A2D3A] bg-[#141621] p-6 relative flex flex-col">
              <div className="min-h-[28px]" />
              <h3 className="text-lg font-semibold text-white mb-2">Supporter</h3>
              <div className="min-h-[60px]">
                <p className="text-3xl font-bold text-white mb-1">€1.99</p>
                <p className="text-sm text-[#6C757D]">/month</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 mt-6">
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> Everything in Free
                </li>
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> Premium reports
                </li>
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> Watchlist
                </li>
                <li className="flex items-center gap-2 text-sm text-[#6C757D]">
                  <span className="text-[#6C757D]">✗</span> Advanced filters
                </li>
              </ul>
              <a href="/pricing" className="block w-full text-center py-2.5 text-sm font-medium text-white bg-[#1A1A2E] rounded-lg hover:bg-[#16213E] transition-colors mt-auto">
                Subscribe
              </a>
            </div>

            {/* Scout Pro */}
            <div className="rounded-xl border-2 border-[#E94560] bg-[#141621] p-6 relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="inline-flex items-center rounded-full bg-[#E94560] px-3 py-1 text-xs font-semibold text-white whitespace-nowrap shadow-sm">Most Popular</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 mt-2">Scout Pro</h3>
              <div className="min-h-[60px]">
                <p className="text-3xl font-bold text-white mb-1">€9.99</p>
                <p className="text-sm text-[#6C757D]">/month</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 mt-6">
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> Everything in Supporter
                </li>
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> Advanced filters
                </li>
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> Export data (CSV)
                </li>
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> Discord access
                </li>
              </ul>
              <a href="/pricing" className="block w-full text-center py-2.5 text-sm font-medium text-white bg-[#E94560] rounded-lg hover:bg-[#d13b54] transition-colors mt-auto">
                Get Scout Pro →
              </a>
            </div>

            {/* Consulting */}
            <div className="rounded-xl border border-[#2A2D3A] bg-[#141621] p-6 flex flex-col">
              <div className="min-h-[28px]" />
              <h3 className="text-lg font-semibold text-white mb-2">Consulting</h3>
              <div className="min-h-[60px]">
                <p className="text-3xl font-bold text-white mb-1">Custom</p>
                <p className="text-sm text-[#6C757D]">For organizations</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 mt-6">
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> Everything in Scout Pro
                </li>
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> API access
                </li>
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> Dedicated support
                </li>
                <li className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <span className="text-emerald-400">✓</span> Custom reports
                </li>
              </ul>
              <a href="/contact" className="block w-full text-center py-2.5 text-sm font-medium text-white border border-[#2A2D3A] rounded-lg hover:bg-[#1A1D29] transition-colors mt-auto">
                Contact Us
              </a>
            </div>
          </div>
          <div className="text-center mt-8">
            <a href="/pricing" className="text-sm text-[#E94560] hover:text-[#d13b54] transition-colors">
              View all details →
            </a>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

