"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Card usage reduced: only used for POTW and Quick Links now
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Heart,
  Bell,
  TrendingUp,
  Star,
  Zap,
  FileText,
  ArrowRight,
  Users,
  Search,
  Loader2,
  AlertCircle,
  Briefcase,
  Crown,
  BarChart3,
  Eye,
  ClipboardList,
} from "lucide-react";
import ScoutIcon from "@/components/ScoutIcon";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { ROLE_COLORS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import PlayerCard from "@/components/PlayerCard";
// ScoutingBoard moved to /pipeline page
import { PageTitle, DataLabel, DataValue } from "@/components/ui/typography";

interface Favorite {
  id: string;
  playerId: string;
  notes: string | null;
  player: {
    id: string;
    pseudo: string;
    realName: string | null;
    role: string;
    league: string;
    status: string;
    currentTeam: string | null;
    photoUrl: string | null;
    soloqStats: {
      currentRank: string;
      peakLp: number;
      winrate: number;
      totalGames: number;
    } | null;
    proStats: {
      kda: number | null;
      csdAt15: number | null;
      gdAt15: number | null;
      dpm: number | null;
      kpPercent: number | null;
      visionScore: number | null;
      championPool: string | null;
      gamesPlayed: number | null;
      season: string;
    } | null;
  };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

interface Prospect {
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  league: string;
  photoUrl: string | null;
  prospectScore: number | null;
  soloqStats: {
    currentRank: string;
    peakLp: number;
  } | null;
}

interface Report {
  id: string;
  title: string;
  verdict: string;
  author: string;
  publishedAt: string;
  player: {
    pseudo: string;
  };
}

interface Potw {
  player: {
    id: string;
    pseudo: string;
    photoUrl: string | null;
    role: string;
    soloqStats: {
      currentRank: string;
      peakLp: number;
    } | null;
  };
  lpGain: number;
  winrate: number;
  gamesPlayed: number;
  reason: string;
}

function getNotifIcon(type: string) {
  switch (type) {
    case "status_change":
      return <ScoutIcon icon={AlertCircle} size="md" variant="info" />;
    case "new_report":
      return <ScoutIcon icon={FileText} size="md" variant="purple" />;
    case "rank_up":
      return <ScoutIcon icon={TrendingUp} size="md" variant="success" />;
    case "transfer":
      return <ScoutIcon icon={Briefcase} size="md" variant="warning" />;
    default:
      return <ScoutIcon icon={Bell} size="md" variant="default" />;
  }
}

function QuickStatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col">
        <DataValue highlight className="text-text-heading">{value}</DataValue>
        <DataLabel className="normal-case">{label}</DataLabel>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [potw, setPotw] = useState<Potw | null>(null);
  const [boardCount, setBoardCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      loadDashboard();
    }
  }, [status, router]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        throw new Error(`Dashboard API error: ${res.status}`);
      }
      const data = await res.json();

      setFavorites(data.favorites || []);
      setNotifications(data.notifications || []);
      setProspects(data.prospects || []);
      setReports(data.reports || []);
      setPotw(data.potw || null);
      setBoardCount(data.boardCount || 0);
    } catch (err) {
      logger.error("Dashboard load error", { err });
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-primary-accent" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <PageTitle className="text-text-heading mb-1">
          My Scout Desk
        </PageTitle>
        <p className="text-text-body">
          Your personalized scouting command center
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <QuickStatItem
          icon={Heart}
          label="Watchlist"
          value={favorites.length}
          color="bg-primary-accent/20 text-primary-accent"
        />
        <QuickStatItem
          icon={Bell}
          label="Unread Alerts"
          value={unreadCount}
          color="bg-blue-500/20 text-blue-400"
        />
        <QuickStatItem
          icon={Star}
          label="Prospects"
          value={prospects.length > 0 ? "Top 5" : 0}
          color="bg-amber-500/20 text-amber-400"
        />
        <QuickStatItem
          icon={FileText}
          label="Reports"
          value={reports.length}
          color="bg-purple-500/20 text-purple-400"
        />
        <Link href="/pipeline" className="block group">
          <QuickStatItem
            icon={ClipboardList}
            label="Pipeline"
            value={boardCount}
            color="bg-primary-accent/20 text-primary-accent"
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Watchlist */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-hover">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-text-heading">
                  <ScoutIcon icon={Heart} size="lg" variant="accent" glow />
                  My Watchlist
                </h3>
                <Link href="/watchlist">
                  <Button variant="ghost" size="default" className="text-xs">
                    View All
                    <ArrowRight className="size-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="p-4">
              {favorites.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title="Your watchlist is empty"
                  description="Add players to your watchlist to track their progress and get alerts."
                  action={{ label: "Browse players", href: "/players" }}
                  className="py-8"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {favorites.slice(0, 4).map((fav) => (
                    <PlayerCard
                      key={fav.id}
                      player={fav.player}
                      showStats
                      showFavorite={false}
                      variant="compact"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-hover">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-text-heading">
                  <ScoutIcon icon={Bell} size="lg" variant="info" glow />
                  Recent Activity
                  {unreadCount > 0 && (
                    <Badge className="bg-primary-accent text-text-heading text-xs h-5">
                      {unreadCount} new
                    </Badge>
                  )}
                </h3>
              </div>
            </div>
            <div className="p-0">
              {notifications.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No recent activity"
                  description="Notifications about your tracked players will appear here."
                  action={{ label: "Browse players", href: "/players" }}
                  className="py-8"
                />
              ) : (
                <div className="divide-y divide-border">
                  {notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 flex items-start gap-3 hover:bg-surface-hover transition-colors ${
                        !notif.read ? "bg-accent/10" : ""
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">{getNotifIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-heading">
                          {notif.title}
                        </p>
                        <p className="text-xs text-text-body">
                          {notif.message}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="shrink-0 w-2 h-2 rounded-full bg-primary-accent mt-1.5" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Prospects */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-hover">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-text-heading">
                  <ScoutIcon icon={Crown} size="lg" variant="gold" glow />
                  Top Prospects
                </h3>
                <Link href="/prospects">
                  <Button variant="ghost" size="default" className="text-xs">
                    View All
                    <ArrowRight className="size-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="p-4">
              {prospects.length === 0 ? (
                <EmptyState
                  icon={Crown}
                  title="No prospects found"
                  description="Top prospects will appear here once scouting data is available."
                  action={{ label: "View prospects", href: "/prospects" }}
                  className="py-8"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {prospects.map((prospect) => (
                    <Link
                      key={prospect.id}
                      href={`/players/${prospect.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary-accent/50 hover:bg-surface-hover transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        {prospect.photoUrl ? (
                          <AvatarImage src={prospect.photoUrl} alt={prospect.pseudo} />
                        ) : null}
                        <AvatarFallback className="bg-muted text-text-heading text-xs">
                          {(prospect.pseudo?.[0] ?? "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-text-heading truncate">
                            {prospect.pseudo}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-xs h-4 px-1 ${ROLE_COLORS[prospect.role] || ""}`}
                          >
                            {prospect.role}
                          </Badge>
                        </div>
                        <div className="text-xs text-text-body">
                          {prospect.league} · {prospect.soloqStats?.currentRank || "Unranked"}
                        </div>
                      </div>
                      {prospect.prospectScore && (
                        <div className="text-right">
                          <div className="text-sm font-bold text-primary-accent tabular-nums">
                            {prospect.prospectScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-text-body">score</div>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column — 1/3 */}
        <div className="space-y-6">
          {/* SoloQ POTW */}
          {potw && (
            <Card className="border-border bg-gradient-to-br from-amber-50 to-white from-amber-500/10 to-[#0F0F1A]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ScoutIcon icon={Zap} size="lg" variant="gold" glow />
                  SoloQ POTW
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    {potw.player.photoUrl ? (
                      <AvatarImage src={potw.player.photoUrl} alt={potw.player.pseudo} />
                    ) : null}
                    <AvatarFallback className="bg-muted text-text-heading">
                      {(potw.player.pseudo?.[0] ?? "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link
                      href={`/players/${potw.player.id}`}
                      className="font-bold text-text-heading hover:text-primary-accent transition-colors"
                    >
                      {potw.player.pseudo}
                    </Link>
                    <div className="text-xs text-text-body">
                      {potw.player.role} · {potw.player.soloqStats?.currentRank || "Unranked"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                  <div className="bg-background/60 rounded-lg p-2">
                    <div className="text-lg font-bold text-emerald-400 tabular-nums">
                      +{potw.lpGain}
                    </div>
                    <div className="text-xs text-text-body">LP Gain</div>
                  </div>
                  <div className="bg-background/60 rounded-lg p-2">
                    <div className="text-lg font-bold text-text-heading tabular-nums">
                      {potw.winrate}%
                    </div>
                    <div className="text-xs text-text-body">Winrate</div>
                  </div>
                  <div className="bg-background/60 rounded-lg p-2">
                    <div className="text-lg font-bold text-text-heading tabular-nums">
                      {potw.gamesPlayed}
                    </div>
                    <div className="text-xs text-text-body">Games</div>
                  </div>
                </div>
                {potw.reason && (
                  <p className="text-xs text-text-body mt-3 italic">
                    "{potw.reason}"
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Latest Reports */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-hover">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-text-heading">
                  <ScoutIcon icon={FileText} size="lg" variant="purple" glow />
                  Latest Reports
                </h3>
                <Link href="/reports">
                  <Button variant="ghost" size="default" className="text-xs">
                    All
                    <ArrowRight className="size-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="p-0">
              {reports.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No reports yet"
                  description="Scouting reports will appear here as they're published."
                  action={{ label: "Browse reports", href: "/reports" }}
                  className="py-6"
                />
              ) : (
                <div className="divide-y divide-border">
                  {reports.slice(0, 5).map((report) => (
                    <Link
                      key={report.id}
                      href={`/reports`}
                      className="block px-4 py-3 hover:bg-surface-hover transition-colors"
                    >
                      <p className="text-sm font-medium text-text-heading truncate">
                        {report.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-text-body">
                          {report.player.pseudo}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-xs h-4 px-1 ${
                            report.verdict === "Must Sign"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : report.verdict === "Pass"
                              ? "bg-primary-accent/20 text-primary-accent"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {report.verdict}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ScoutIcon icon={BarChart3} size="lg" variant="muted" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {[
                { href: "/players", icon: Users, label: "Browse Players" },
                { href: "/prospects", icon: Crown, label: "Top Prospects" },
                { href: "/leaderboards", icon: TrendingUp, label: "Leaderboards" },
                { href: "/compare", icon: Zap, label: "Compare Players" },
                { href: "/watchlist", icon: Heart, label: "My Watchlist" },
                { href: "/pipeline", icon: ClipboardList, label: "Scouting Pipeline" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover transition-colors group"
                >
                  <link.icon className="size-4 text-text-body group-hover:text-primary-accent transition-colors" />
                  <span className="text-sm text-text-heading group-hover:text-primary-accent transition-colors">
                    {link.label}
                  </span>
                  <ArrowRight className="size-3 ml-auto text-border group-hover:text-primary-accent transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

