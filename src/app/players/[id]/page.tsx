import { db } from "@/lib/server/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { unstable_cache } from "next/cache";
import { RANK_COLORS } from "@/lib/constants";
import dynamic from "next/dynamic";

function getRankColor(rankStr: string | null): string {
  if (!rankStr) return "text-foreground";
  const tier = rankStr.split(" ")[0].toUpperCase();
  return RANK_COLORS[tier] || "text-foreground";
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const player = await db.player.findUnique({
    where: { id: params.id },
    select: { pseudo: true, realName: true, role: true, league: true, bio: true, photoUrl: true },
  });

  if (!player) {
    return { title: "Player Not Found | LeagueScout" };
  }

  const title = `${player.pseudo} — ${player.role} | LeagueScout`;
  const description = player.bio || `Scouting profile for ${player.pseudo}, ${player.role} player in ${player.league}.`;
  const siteUrl = process.env.NEXTAUTH_URL || "https://leaguescout.gg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${siteUrl}/players/${params.id}`,
      images: player.photoUrl
        ? [{ url: player.photoUrl, width: 400, height: 400, alt: player.pseudo }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: player.photoUrl ? [player.photoUrl] : undefined,
    },
    alternates: {
      canonical: `${siteUrl}/players/${params.id}`,
    },
  };
}
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ExternalLink,
  Play,
  ArrowLeft,
  Briefcase,
  Trophy,
  Star,
  FileText,
  Swords,
  Clock,
  TrendingUp as TrendingUpIcon,
  Search,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ROLE_COLORS, STATUS_COLORS, BEHAVIOR_TAG_COLORS, TIER_COLORS, TIER_LABELS } from "@/lib/constants";
import { formatStatus } from "@/lib/utils";
import { ProfilePageJsonLd } from "@/components/JsonLd";
import { PageTitle, SectionHeader, DataLabel, DataValue } from "@/components/ui/typography";
import { Breadcrumb } from "@/components/Breadcrumb";
import SyncStatsButton from "./SyncStatsButton";
import FavoriteButton from "@/components/FavoriteButton";
import ExportPdfButton from "@/components/ExportPdfButton";
import ReportCard from "@/components/ReportCard";
import { ShareableReport } from "@/components/ShareableReport";

const RoleRadarChart = dynamic(() => import("@/components/charts/RoleRadarChart"));
const AdcRadarChart = dynamic(() => import("@/components/charts/AdcRadarChart"));
const StatHistoryChart = dynamic(() => import("./StatHistoryChart"));
const RoleRadar = dynamic(() => import("./RoleRadar"));
const RolePercentiles = dynamic(() => import("./RolePercentiles"));
const MatchHistory = dynamic(() => import("./MatchHistory"));
const ProMatchHistory = dynamic(() => import("./ProMatchHistory"));
const SoloqChampionPool = dynamic(() => import("./SoloqChampionPool"));
const SimilarPlayers = dynamic(() => import("./SimilarPlayers"));
const ProChampions = dynamic(() => import("@/components/ProChampions"));

import SoloqAccounts from "@/components/SoloqAccounts";
import PlayerStats from "./PlayerStats";
import ProStatsFull from "./ProStatsFull";

const getPlayer = unstable_cache(
  async (id: string) => {
    return db.player.findUnique({
      where: { id },
      include: {
        soloqStats: true,
        proStats: true,
        proMatches: {
          orderBy: { matchDate: "desc" },
        },
        reports: true,
        vods: true,
        timelineEvents: {
          orderBy: { date: "desc" },
        },
      },
    });
  },
  ["player-detail"],
  { revalidate: 120 }
);

export default async function PlayerPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const player = await getPlayer(params.id);

  if (!player) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isPremium = user?.isPremium === true && user?.subscriptionStatus === "active";
  const isAdmin = user?.role === "admin";

  const freeReports = player.reports.filter((r) => !r.isPremium);
  const premiumReports = player.reports.filter((r) => r.isPremium);

  return (
    <>
      <ProfilePageJsonLd player={player} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { name: "Players", href: "/players" },
            { name: player.pseudo, href: `/players/${params.id}` },
          ]}
        />

        {/* Player Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar */}
            {player.photoUrl ? (
              <Image
                src={player.photoUrl}
                alt={player.pseudo}
                width={96}
                height={96}
                priority
                className="rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center text-4xl font-bold text-white shrink-0">
                {(player.pseudo?.[0] ?? "?").toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <PageTitle className="text-foreground">
                  {player.pseudo}
                </PageTitle>
                <Badge className={ROLE_COLORS[player.role] || "bg-gray-100"}>
                  {player.role}
                </Badge>
                {player.tier && (
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${TIER_COLORS[player.tier] || "text-gray-400 bg-gray-400/10 border-gray-400/30"}`}
                    title={TIER_LABELS[player.tier] || ""}
                  >
                    {player.tier}
                  </span>
                )}
              </div>

              {player.realName && (
                <p className="text-muted-foreground mb-2">{player.realName}</p>
              )}

              {/* Behavior Tags */}
              {player.behaviorTags && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {(() => {
                    try {
                      const tags = JSON.parse(player.behaviorTags);
                      if (Array.isArray(tags)) {
                        return tags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className={`text-xs ${BEHAVIOR_TAG_COLORS[tag] || "bg-gray-100 text-gray-800 border-gray-200"}`}
                          >
                            {tag}
                          </Badge>
                        ));
                      }
                    } catch {
                      // fallback
                    }
                    return null;
                  })()}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {player.age && <span>{player.age} years old</span>}
                <span>{player.nationality}</span>
                <span>{player.league}</span>
                {player.currentTeam && (
                  <span className="font-medium text-foreground">
                    {player.currentTeam}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-6">
            {/* Bio */}
            {player.bio && (
              <div className="bg-muted/50 rounded-lg border border-border p-4">
                <p className="text-muted-foreground leading-relaxed max-w-prose">{player.bio}</p>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-muted border border-border overflow-x-auto scrollbar-hide w-full flex-wrap sm:flex-nowrap">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="matches">Matches</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 animate-fade-in">
                <ProStatsFull
                  playerId={player.id}
                  role={player.role}
                  league={player.league}
                  proStats={player.proStats}
                />
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted px-3 py-2 border-b border-border">
                    <SectionHeader>Performance Radar — {player.role}</SectionHeader>
                  </div>
                  <div className="bg-card p-4">
                    <RoleRadar playerId={player.id} />
                  </div>
                </div>
                <RolePercentiles playerId={player.id} />
              </TabsContent>

              {/* Matches Tab */}
              <TabsContent value="matches" className="space-y-6 animate-fade-in">
                {/* SoloQ Section */}
                <div>
                  <SectionHeader className="mb-4">SoloQ</SectionHeader>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-1 space-y-4">
                      <div>
                        <SectionHeader className="mb-3">SoloQ Accounts</SectionHeader>
                        <SoloqAccounts playerId={player.id} riotId={player.riotId} soloqStats={player.soloqStats} isAdmin={isAdmin} />
                      </div>
                      {player.soloqStats?.championPool && (
                        <SoloqChampionPool championPool={player.soloqStats.championPool} />
                      )}
                    </div>
                    <div className="lg:col-span-2">
                      <MatchHistory playerId={player.id} />
                    </div>
                  </div>
                </div>

                {/* Pro Matches Section */}
                <div>
                  <SectionHeader className="mb-4">Pro Matches</SectionHeader>
                  <ProMatchHistory matches={player.proMatches} />
                </div>
              </TabsContent>

              {/* Analysis Tab */}
              <TabsContent value="analysis" className="space-y-6 animate-fade-in">
                {/* Reports */}
                <div>
                  <SectionHeader className="mb-4">Reports</SectionHeader>
                  {player.reports.length > 0 ? (
                    <div className="space-y-6">
                      {freeReports.length > 0 && (
                        <div className="rounded-lg border border-border overflow-hidden">
                          <div className="bg-muted px-3 py-2 border-b border-border flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <SectionHeader>Free Reports</SectionHeader>
                          </div>
                          <div className="bg-card space-y-0">
                            {freeReports.map((report) => (
                              <div key={report.id} className="border-b border-border last:border-b-0 hover:bg-accent transition-colors p-3">
                                <ReportCard report={report} variant="free" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {premiumReports.length > 0 && (
                        <div className="rounded-lg border border-border overflow-hidden">
                          <div className="bg-muted px-3 py-2 border-b border-border flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <SectionHeader>Premium Reports</SectionHeader>
                          </div>
                          <div className="bg-card space-y-0">
                            {premiumReports.map((report) => (
                              <div key={report.id} className="border-b border-border last:border-b-0 hover:bg-accent transition-colors p-3">
                                <ReportCard report={report} variant={isPremium ? "premium" : "preview"} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      icon={FileText}
                      title="No reports available"
                      description="Scouting reports will appear here as they're published for this player."
                      action={{ label: "Browse reports", href: "/reports" }}
                    />
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <SectionHeader className="mb-4">Timeline ({player.timelineEvents.length})</SectionHeader>
                  {player.timelineEvents.length > 0 ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="bg-muted px-3 py-2 border-b border-border flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <SectionHeader>Career Timeline</SectionHeader>
                      </div>
                      <div className="bg-card p-4">
                        <div className="relative border-l-2 border-border ml-3 space-y-5">
                          {player.timelineEvents.map((event) => (
                            <div key={event.id} className="relative pl-6">
                              {/* Dot */}
                              <div className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 border-[#1A1F2E] ${
                                event.type === "transfer" ? "bg-blue-500" :
                                event.type === "rank_up" ? "bg-green-500" :
                                event.type === "award" ? "bg-yellow-500" :
                                event.type === "report" ? "bg-purple-500" :
                                "bg-gray-500"
                              }`} />
                              
                              <div className="flex items-start gap-3">
                                <div className="shrink-0 mt-0.5">
                                  {event.type === "transfer" && <Briefcase className="h-4 w-4 text-blue-500" aria-hidden="true" />}
                                  {event.type === "rank_up" && <TrendingUpIcon className="h-4 w-4 text-green-500" aria-hidden="true" />}
                                  {event.type === "award" && <Trophy className="h-4 w-4 text-yellow-500" aria-hidden="true" />}
                                  {event.type === "report" && <FileText className="h-4 w-4 text-purple-500" aria-hidden="true" />}
                                  {event.type === "milestone" && <Star className="h-4 w-4 text-orange-500" aria-hidden="true" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <SectionHeader>{event.type.replace("_", " ")}</SectionHeader>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(event.date).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
                                  <h3 className="text-xs font-semibold text-foreground">
                                    {event.title}
                                  </h3>
                                  {event.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={Clock}
                      title="No timeline events"
                      description="Career events will appear here as the player's journey progresses."
                      action={{ label: "View matches", href: `/players/${params.id}?tab=matches` }}
                    />
                  )}
                </div>

                {/* Similar Players */}
                <div>
                  <SectionHeader className="mb-4">Similar Players</SectionHeader>
                  <SimilarPlayers playerId={player.id} />
                </div>

                {/* Pro Champions */}
                <div>
                  <SectionHeader className="mb-4">Pro Champions</SectionHeader>
                  <ProChampions matches={player.proMatches} />
                </div>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-6 animate-fade-in">
                {/* VODs */}
                <div>
                  <SectionHeader className="mb-4">VODs ({player.vods.length})</SectionHeader>
                  {player.vods.length > 0 ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="bg-muted px-3 py-2 border-b border-border flex items-center gap-2">
                        <Play className="h-3.5 w-3.5 text-muted-foreground" />
                        <SectionHeader>VODs</SectionHeader>
                      </div>
                      <div className="bg-card">
                        {player.vods.map((vod) => (
                          <div
                            key={vod.id}
                            className="border-b border-border last:border-b-0 hover:bg-accent transition-colors px-3 py-3 flex items-start gap-3"
                          >
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                              <Play className="h-4 w-4 text-primary" aria-hidden="true" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xs font-semibold text-foreground truncate">
                                {vod.title}
                              </h3>
                              {vod.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {vod.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider bg-muted px-2 py-1 rounded">
                                  {vod.platform}
                                </span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider bg-muted px-2 py-1 rounded">
                                  {vod.matchType}
                                </span>
                                {vod.champion && (
                                  <span className="text-xs text-muted-foreground uppercase tracking-wider bg-muted px-2 py-1 rounded">
                                    {vod.champion}
                                  </span>
                                )}
                              </div>
                            </div>
                            <a
                              href={vod.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                            >
                              Watch
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={Play}
                      title="No VODs available"
                      description="Video on demand recordings will appear here when available."
                      action={{ label: "Browse players", href: "/players" }}
                    />
                  )}
                </div>

                {/* Stat History */}
                <div>
                  <SectionHeader className="mb-4">Stat History</SectionHeader>
                  <StatHistoryChart playerId={player.id} />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-4 animate-slide-in-right">
            {/* Quick Actions Card */}
            <div className="bg-muted/50 rounded-lg border border-border p-4 space-y-3">
              <SectionHeader>Quick Actions</SectionHeader>
              <div className="flex flex-col gap-2">
                <FavoriteButton playerId={player.id} />
                <ExportPdfButton playerId={player.id} />
                <Link href={`/compare?player1=${player.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Swords className="h-4 w-4 mr-2" />
                    Compare
                  </Button>
                </Link>
              </div>
            </div>

            {/* Shareable Report */}
            <div className="bg-muted/50 rounded-lg border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Share Report
              </h3>
              <ShareableReport
                player={{
                  id: player.id,
                  pseudo: player.pseudo,
                  realName: player.realName,
                  role: player.role,
                  league: player.league,
                  currentTeam: player.currentTeam,
                  photoUrl: player.photoUrl,
                  tier: player.tier,
                  age: player.age,
                  nationality: player.nationality,
                }}
                stats={
                  player.proStats
                    ? {
                        kda: player.proStats.kda,
                        dpm: player.proStats.dpm,
                        csdAt15: player.proStats.csdAt15,
                        gdAt15: player.proStats.gdAt15,
                        gamesPlayed: player.proStats.gamesPlayed,
                      }
                    : undefined
                }
              />
            </div>

            {/* External Links */}
            {(player.opggUrl || player.golggUrl || player.lolprosUrl || player.leaguepediaUrl || player.twitterUrl || player.twitchUrl) && (
              <div className="bg-muted/50 rounded-lg border border-border p-4 space-y-2">
                <SectionHeader>Links</SectionHeader>
                <div className="flex flex-col gap-1">
                  {player.opggUrl && (
                    <a href={player.opggUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:text-foreground">
                      op.gg <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {player.golggUrl && (
                    <a href={player.golggUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:text-foreground">
                      Gol.gg <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {player.lolprosUrl && (
                    <a href={player.lolprosUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:text-foreground">
                      LoLPros <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {player.leaguepediaUrl && (
                    <a href={player.leaguepediaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:text-foreground">
                      Leaguepedia <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {player.twitterUrl && (
                    <a href={player.twitterUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:text-foreground">
                      Twitter <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {player.twitchUrl && (
                    <a href={player.twitchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:text-foreground">
                      Twitch <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Contract Info */}
            {player.contractEndDate && (
              <div className="bg-muted/50 rounded-lg border border-border p-4">
                <SectionHeader className="mb-2">Contract</SectionHeader>
                <p className="text-sm text-foreground">
                  Until {new Date(player.contractEndDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
                {(() => {
                  const days = Math.ceil(
                    (+new Date(player.contractEndDate) - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  if (days <= 30) {
                    return (
                      <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded mt-1 inline-block">
                        {days}d left
                      </span>
                    );
                  } else if (days <= 90) {
                    return (
                      <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-1 rounded mt-1 inline-block">
                        {days}d left
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-muted/50 rounded-lg border border-border p-4 space-y-2">
              <SectionHeader>Quick Stats</SectionHeader>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <DataLabel>League</DataLabel>
                  <DataValue>{player.league}</DataValue>
                </div>
                <div>
                  <DataLabel>Role</DataLabel>
                  <DataValue>{player.role}</DataValue>
                </div>
                <div>
                  <DataLabel>Status</DataLabel>
                  <DataValue>{formatStatus(player.status)}</DataValue>
                </div>
                <div>
                  <DataLabel>Age</DataLabel>
                  <DataValue>{player.age || "—"}</DataValue>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
