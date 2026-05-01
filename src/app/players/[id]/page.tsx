import { db } from "@/lib/server/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { cache } from "react";
import { RANK_COLORS } from "@/lib/constants";
import dynamic from "next/dynamic";

function getRankColor(rankStr: string | null): string {
  if (!rankStr) return "text-text-heading";
  const tier = rankStr.split(" ")[0].toUpperCase();
  return RANK_COLORS[tier] || "text-text-heading";
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
  FileText,
  Swords,
  LayoutGrid,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ROLE_COLORS, STATUS_COLORS, BEHAVIOR_TAG_COLORS } from "@/lib/constants";
import { formatStatus } from "@/lib/utils";
import { ProfilePageJsonLd } from "@/components/JsonLd";
import Flag from "@/components/Flag";
import { SectionHeader, DataLabel, DataValue } from "@/components/ui/typography";
import { Breadcrumb } from "@/components/Breadcrumb";

import FavoriteButton from "@/components/FavoriteButton";
import ExportPdfButton from "@/components/ExportPdfButton";
import ReportCard from "@/components/ReportCard";
// import { ShareableReport } from "@/components/ShareableReport";

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
import ProInsightCards from "./ProInsightCards";
import SeasonSplitSelector from "./SeasonSplitSelector";
import RadarComparisonTable from "./RadarComparisonTable";

const getPlayer = cache(async (id: string) => {
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
});

export default async function PlayerPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
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

  // Season/Split selector UI (filtering stats is handled client-side in ProStatsFull)
  // ProMatches don't have season/split fields yet — filtering matches would require schema change
  const seasons = ["2026", "2025", "2024", "2023", "2022"];
  const splits = ["Spring", "Summer", "Winter", "MSI", "Worlds"];

  return (
    <>
      <ProfilePageJsonLd player={player} />
      <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { name: "Players", href: "/players" },
            { name: player.pseudo, href: `/players/${params.id}` },
          ]}
        />

        {/* Player Header — Gradient bg, glowing avatar, accent buttons */}
        <div className="relative mb-8 -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          {/* Subtle gradient background matching homepage hero */}
          <div className="absolute inset-0 bg-background">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, #0F3460 0%, transparent 50%), radial-gradient(circle at 80% 50%, #E94560 0%, transparent 40%)`
            }} />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="relative flex flex-col items-center text-center">
            {/* Avatar with glow ring */}
            {player.photoUrl ? (
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-primary-accent/20 blur-xl scale-110" />
                <Image
                  src={player.photoUrl}
                  alt={player.pseudo}
                  width={120}
                  height={120}
                  priority
                  className="relative rounded-full object-cover border-2 border-primary-accent/50"
                />
              </div>
            ) : (
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-primary-accent/20 blur-xl scale-110" />
                <div className="relative w-[120px] h-[120px] rounded-full bg-card flex items-center justify-center text-5xl font-bold text-text-heading border-2 border-primary-accent/50">
                  {(player.pseudo?.[0] ?? "?").toUpperCase()}
                </div>
              </div>
            )}

            {/* Pseudo */}
            <h1 className="text-3xl font-bold text-text-heading font-heading tracking-tight">
              {player.pseudo}
            </h1>

            {/* Real name + age */}
            {player.realName && (
              <p className="text-text-muted mt-1">
                {player.realName}
                {player.age ? ` · ${player.age} years old` : ""}
              </p>
            )}
            {!player.realName && player.age && (
              <p className="text-text-muted mt-1">{player.age} years old</p>
            )}

            {/* League · Role · Team · Status */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-sm">
              {player.nationality && <Flag code={player.nationality} className="inline-block" />}
              {player.currentTeam && (
                <span className="font-semibold text-text-heading">{player.currentTeam}</span>
              )}
              <Badge className={`${ROLE_COLORS[player.role] || "bg-surface-hover"} font-semibold`}>
                {player.role}
              </Badge>
              <Badge
                variant="outline"
                className={STATUS_COLORS[player.status] || "bg-surface-hover text-text-heading border-border"}
              >
                {formatStatus(player.status)}
              </Badge>
            </div>

            {/* Behavior Tags */}
            {player.behaviorTags && (
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {(() => {
                  try {
                    const tags = JSON.parse(player.behaviorTags);
                    if (Array.isArray(tags)) {
                      return tags.map((tag: string) => (
                        <span
                          key={tag}
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${BEHAVIOR_TAG_COLORS[tag] || "bg-surface-hover text-text-heading border-border"}`}
                        >
                          {tag}
                        </span>
                      ));
                    }
                  } catch {
                    // fallback
                  }
                  return null;
                })()}
              </div>
            )}

            {/* Social Links — Vibrant hover */}
            <div className="flex items-center justify-center gap-3 mt-4">
              {player.opggUrl && (
                <a
                  href={player.opggUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-elevated border border-border text-text-muted hover:text-primary-accent hover:border-primary-accent/50 hover:bg-primary-accent/10 transition-all"
                  title="op.gg"
                >
                  <span className="text-xs font-bold">OP</span>
                </a>
              )}
              {player.twitterUrl && (
                <a
                  href={player.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-elevated border border-border text-text-muted hover:text-primary-accent hover:border-primary-accent/50 hover:bg-primary-accent/10 transition-all"
                  title="Twitter/X"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
              {player.twitchUrl && (
                <a
                  href={player.twitchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-elevated border border-border text-text-muted hover:text-primary-accent hover:border-primary-accent/50 hover:bg-primary-accent/10 transition-all"
                  title="Twitch"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>
                </a>
              )}
              {player.riotId && (
                <a
                  href={`https://www.leagueofgraphs.com/fr/summoner/euw/${encodeURIComponent(player.riotId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-elevated border border-border text-text-muted hover:text-primary-accent hover:border-primary-accent/50 hover:bg-primary-accent/10 transition-all"
                  title="League of Graphs"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                </a>
              )}
            </div>

            {/* Action Buttons — Accent primary */}
            <div className="flex items-center justify-center gap-2 mt-5">
              <FavoriteButton playerId={player.id} />
              <Link href={`/compare?player1=${player.id}`}>
                <Button variant="outline" size="sm" className="gap-2 border-border hover:border-primary-accent/50 hover:text-primary-accent hover:bg-primary-accent/10 transition-all">
                  <Swords className="h-4 w-4" />
                  Compare
                </Button>
              </Link>
              <ExportPdfButton playerId={player.id} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-6">
            {/* Bio */}
            {player.bio && (
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-text-body leading-relaxed max-w-prose">{player.bio}</p>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <TabsList className="bg-card border border-border overflow-x-auto scrollbar-hide flex-nowrap">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="soloq">SoloQ</TabsTrigger>
                  <TabsTrigger value="pro">Pro</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="vods">VODs</TabsTrigger>
                </TabsList>
                <SeasonSplitSelector seasons={seasons} splits={splits} />
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 animate-fade-in">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                    <SectionHeader className="text-text-heading">Pro Stats</SectionHeader>
                  </div>
                  <div className="p-4">
                    <ProStatsFull
                      playerId={player.id}
                      role={player.role}
                      league={player.league}
                      proStats={player.proStats}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                    <SectionHeader className="text-text-heading">Performance Radar — {player.role}</SectionHeader>
                  </div>
                  <div className="p-4">
                    <RoleRadar playerId={player.id} />
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                    <SectionHeader className="text-text-heading">Percentiles</SectionHeader>
                  </div>
                  <div className="p-4">
                    <RolePercentiles playerId={player.id} />
                  </div>
                </div>
              </TabsContent>

              {/* SoloQ Tab */}
              <TabsContent value="soloq" className="space-y-6 animate-fade-in">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                    <SectionHeader className="text-text-heading">SoloQ Accounts</SectionHeader>
                  </div>
                  <div className="p-4">
                    <SoloqAccounts playerId={player.id} riotId={player.riotId} soloqStats={player.soloqStats} isAdmin={isAdmin} />
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                    <SectionHeader className="text-text-heading">Match History</SectionHeader>
                  </div>
                  <div className="p-4">
                    <MatchHistory playerId={player.id} />
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                    <SectionHeader className="text-text-heading">Champion Pool</SectionHeader>
                  </div>
                  <div className="p-4">
                    {player.soloqStats?.championPool ? (
                      <SoloqChampionPool championPool={player.soloqStats.championPool} />
                    ) : (
                      <EmptyState
                        icon={LayoutGrid}
                        title="No champion pool data"
                        description="SoloQ champion pool data will appear here."
                      />
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                    <SectionHeader className="text-text-heading">Rank History</SectionHeader>
                  </div>
                  <div className="p-4">
                    <StatHistoryChart playerId={player.id} />
                  </div>
                </div>
              </TabsContent>

              {/* Pro Tab */}
              <TabsContent value="pro" className="space-y-6 animate-fade-in">
                <ProInsightCards proMatches={player.proMatches} />
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                    <SectionHeader className="text-text-heading">Pro Champions</SectionHeader>
                  </div>
                  <div className="p-4">
                    <ProChampions matches={player.proMatches} />
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                    <SectionHeader className="text-text-heading">Pro Matches</SectionHeader>
                  </div>
                  <div className="p-4">
                    <ProMatchHistory matches={player.proMatches} />
                  </div>
                </div>
              </TabsContent>

              {/* Analysis Tab */}
              <TabsContent value="analysis" className="space-y-6 animate-fade-in">
                {/* Reports */}
                {player.reports.length > 0 ? (
                  <div className="space-y-4">
                    {freeReports.length > 0 && (
                      <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                          <FileText className="h-4 w-4 text-text-muted" />
                          <SectionHeader className="text-text-heading">Free Reports</SectionHeader>
                        </div>
                        <div className="divide-y divide-border">
                          {freeReports.map((report) => (
                            <div key={report.id} className="hover:bg-surface-hover transition-colors p-4">
                              <ReportCard report={report} variant="free" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {premiumReports.length > 0 && (
                      <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                          <FileText className="h-4 w-4 text-text-muted" />
                          <SectionHeader className="text-text-heading">Premium Reports</SectionHeader>
                        </div>
                        <div className="divide-y divide-border">
                          {premiumReports.map((report) => (
                            <div key={report.id} className="hover:bg-surface-hover transition-colors p-4">
                              <ReportCard report={report} variant={isPremium ? "premium" : "preview"} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="p-4">
                      <EmptyState
                        icon={FileText}
                        title="No reports available"
                        description="Scouting reports will appear here as they're published for this player."
                        action={{ label: "Browse reports", href: "/reports" }}
                      />
                    </div>
                  </div>
                )}

                {/* Stat History */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                    <SectionHeader className="text-text-heading">Stat History</SectionHeader>
                  </div>
                  <div className="p-4">
                    <StatHistoryChart playerId={player.id} />
                  </div>
                </div>

                {/* Similar Players */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                    <SectionHeader className="text-text-heading">Similar Players</SectionHeader>
                  </div>
                  <div className="p-4">
                    <SimilarPlayers playerId={player.id} />
                  </div>
                </div>
              </TabsContent>

              {/* VODs Tab */}
              <TabsContent value="vods" className="space-y-6 animate-fade-in">
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                    <Play className="h-4 w-4 text-text-muted" />
                    <SectionHeader className="text-text-heading">VODs ({player.vods.length})</SectionHeader>
                  </div>
                  {player.vods.length > 0 ? (
                    <div className="divide-y divide-border">
                      {player.vods.map((vod) => (
                        <div
                          key={vod.id}
                          className="hover:bg-surface-hover transition-colors px-4 py-3 flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
                            <Play className="h-4 w-4 text-primary-accent" aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-text-heading truncate">
                              {vod.title}
                            </h3>
                            {vod.description && (
                              <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                                {vod.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-text-muted uppercase tracking-wider bg-surface-hover px-2 py-1 rounded">
                                {vod.platform}
                              </span>
                              <span className="text-[10px] text-text-muted uppercase tracking-wider bg-surface-hover px-2 py-1 rounded">
                                {vod.matchType}
                              </span>
                              {vod.champion && (
                                <span className="text-[10px] text-text-muted uppercase tracking-wider bg-surface-hover px-2 py-1 rounded">
                                  {vod.champion}
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={vod.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-primary-accent transition-colors shrink-0 mt-0.5"
                          >
                            Watch
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4">
                      <EmptyState
                        icon={Play}
                        title="No VODs available"
                        description="Video on demand recordings will appear here when available."
                        action={{ label: "Browse players", href: "/players" }}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>


            </Tabs>
          </div>

          <aside className="space-y-4 animate-slide-in-right">
            {/* Socials & Contact */}
            {(player.twitterUrl || player.twitchUrl || player.opggUrl) && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                  <SectionHeader className="text-text-heading">Socials</SectionHeader>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  {player.twitterUrl && (
                    <a href={player.twitterUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-text-body hover:text-primary-accent transition-colors">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      <span className="truncate">{player.twitterUrl.replace("https://twitter.com/", "").replace("https://x.com/", "")}</span>
                    </a>
                  )}
                  {player.twitchUrl && (
                    <a href={player.twitchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-text-body hover:text-primary-accent transition-colors">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>
                      <span className="truncate">{player.twitchUrl.replace("https://twitch.tv/", "").replace("https://www.twitch.tv/", "")}</span>
                    </a>
                  )}
                  {player.opggUrl && (
                    <a href={player.opggUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-text-body hover:text-primary-accent transition-colors">
                      <span className="text-xs font-bold">OP</span>
                      <span className="truncate">op.gg</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Contract Info */}
            {player.contractEndDate && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
                  <SectionHeader className="text-text-heading">Contract</SectionHeader>
                </div>
                <div className="p-4">
                  <DataLabel>Until</DataLabel>
                  <DataValue>{new Date(player.contractEndDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</DataValue>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
      </div>
    </>
  );
}
