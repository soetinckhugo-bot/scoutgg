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
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { ROLE_COLORS } from "@/lib/constants";
import PlayerCard from "@/components/PlayerCard";
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
      return <AlertCircle className="size-4 text-blue-500" />;
    case "new_report":
      return <FileText className="size-4 text-purple-500" />;
    case "rank_up":
      return <TrendingUp className="size-4 text-green-500" />;
    case "transfer":
      return <Briefcase className="size-4 text-orange-500" />;
    default:
      return <Bell className="size-4 text-gray-400" />;
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
    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <DataValue highlight className="text-[#1A1A2E] dark:text-white">{value}</DataValue>
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
      const [favRes, notifRes, prospectRes, reportRes, potwRes] = await Promise.all([
        fetch("/api/favorites").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/notifications").then((r) => (r.ok ? r.json() : { notifications: [] })),
        fetch("/api/prospects?limit=5").then((r) => (r.ok ? r.json() : { prospects: [] })),
        fetch("/api/reports?limit=5").then((r) => (r.ok ? r.json() : { reports: [] })),
        fetch("/api/soloq-potw").then((r) => (r.ok ? r.json() : null)),
      ]);

      setFavorites(favRes || []);
      setNotifications(notifRes.notifications || []);
      setProspects(prospectRes.prospects || []);
      setReports(reportRes.reports || []);
      setPotw(potwRes?.potw || null);
    } catch (err) {
      console.error("Dashboard load error:", err);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-[#E94560]" />
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
        <PageTitle className="text-[#1A1A2E] dark:text-white mb-1">
          My Scout Desk
        </PageTitle>
        <p className="text-[#6C757D] dark:text-gray-400">
          Your personalized scouting command center
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <QuickStatItem
          icon={Heart}
          label="Watchlist"
          value={favorites.length}
          color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
        />
        <QuickStatItem
          icon={Bell}
          label="Unread Alerts"
          value={unreadCount}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <QuickStatItem
          icon={Star}
          label="Prospects"
          value={prospects.length > 0 ? "Top 5" : 0}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
        />
        <QuickStatItem
          icon={FileText}
          label="Reports"
          value={reports.length}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Watchlist */}
          <div className="rounded-lg border border-[#E9ECEF] dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E9ECEF] dark:border-gray-700 bg-[#F8F9FA] dark:bg-[#1e293b]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-[#1A1A2E] dark:text-white">
                  <Heart className="size-5 text-[#E94560]" />
                  My Watchlist
                </h3>
                <Link href="/watchlist">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
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
          <div className="rounded-lg border border-[#E9ECEF] dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E9ECEF] dark:border-gray-700 bg-[#F8F9FA] dark:bg-[#1e293b]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-[#1A1A2E] dark:text-white">
                  <Bell className="size-5 text-blue-500" />
                  Recent Activity
                  {unreadCount > 0 && (
                    <Badge className="bg-[#E94560] text-white text-xs h-5">
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
                <div className="divide-y divide-[#E9ECEF] dark:divide-gray-700">
                  {notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 flex items-start gap-3 hover:bg-[#F8F9FA] dark:hover:bg-[#0f172a] transition-colors ${
                        !notif.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">{getNotifIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1A2E] dark:text-white">
                          {notif.title}
                        </p>
                        <p className="text-xs text-[#6C757D] dark:text-gray-400">
                          {notif.message}
                        </p>
                        <p className="text-xs text-[#6C757D] dark:text-gray-500 mt-0.5">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="shrink-0 w-2 h-2 rounded-full bg-[#E94560] mt-1.5" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Prospects */}
          <div className="rounded-lg border border-[#E9ECEF] dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E9ECEF] dark:border-gray-700 bg-[#F8F9FA] dark:bg-[#1e293b]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-[#1A1A2E] dark:text-white">
                  <Crown className="size-5 text-amber-500" />
                  Top Prospects
                </h3>
                <Link href="/prospects">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
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
                      className="flex items-center gap-3 p-3 rounded-lg border border-[#E9ECEF] dark:border-gray-700 hover:border-[#0F3460] dark:hover:border-gray-500 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        {prospect.photoUrl ? (
                          <AvatarImage src={prospect.photoUrl} alt={prospect.pseudo} />
                        ) : null}
                        <AvatarFallback className="bg-[#1A1A2E] text-white text-xs">
                          {(prospect.pseudo?.[0] ?? "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#1A1A2E] dark:text-white truncate">
                            {prospect.pseudo}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-xs h-4 px-1 ${ROLE_COLORS[prospect.role] || ""}`}
                          >
                            {prospect.role}
                          </Badge>
                        </div>
                        <div className="text-xs text-[#6C757D] dark:text-gray-400">
                          {prospect.league} · {prospect.soloqStats?.currentRank || "Unranked"}
                        </div>
                      </div>
                      {prospect.prospectScore && (
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#E94560] tabular-nums">
                            {prospect.prospectScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-[#6C757D] dark:text-gray-400">score</div>
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
            <Card className="border-[#E9ECEF] dark:border-gray-700 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-[#0f172a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="size-5 text-amber-500" />
                  SoloQ POTW
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    {potw.player.photoUrl ? (
                      <AvatarImage src={potw.player.photoUrl} alt={potw.player.pseudo} />
                    ) : null}
                    <AvatarFallback className="bg-[#1A1A2E] text-white">
                      {(potw.player.pseudo?.[0] ?? "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link
                      href={`/players/${potw.player.id}`}
                      className="font-bold text-[#1A1A2E] dark:text-white hover:text-[#E94560] transition-colors"
                    >
                      {potw.player.pseudo}
                    </Link>
                    <div className="text-xs text-[#6C757D] dark:text-gray-400">
                      {potw.player.role} · {potw.player.soloqStats?.currentRank || "Unranked"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/60 dark:bg-[#1e293b]/60 rounded-lg p-2">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">
                      +{potw.lpGain}
                    </div>
                    <div className="text-xs text-[#6C757D] dark:text-gray-400">LP Gain</div>
                  </div>
                  <div className="bg-white/60 dark:bg-[#1e293b]/60 rounded-lg p-2">
                    <div className="text-lg font-bold text-[#1A1A2E] dark:text-white tabular-nums">
                      {potw.winrate}%
                    </div>
                    <div className="text-xs text-[#6C757D] dark:text-gray-400">Winrate</div>
                  </div>
                  <div className="bg-white/60 dark:bg-[#1e293b]/60 rounded-lg p-2">
                    <div className="text-lg font-bold text-[#1A1A2E] dark:text-white tabular-nums">
                      {potw.gamesPlayed}
                    </div>
                    <div className="text-xs text-[#6C757D] dark:text-gray-400">Games</div>
                  </div>
                </div>
                {potw.reason && (
                  <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-3 italic">
                    "{potw.reason}"
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Latest Reports */}
          <div className="rounded-lg border border-[#E9ECEF] dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E9ECEF] dark:border-gray-700 bg-[#F8F9FA] dark:bg-[#1e293b]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-[#1A1A2E] dark:text-white">
                  <FileText className="size-5 text-purple-500" />
                  Latest Reports
                </h3>
                <Link href="/reports">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
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
                <div className="divide-y divide-[#E9ECEF] dark:divide-gray-700">
                  {reports.slice(0, 5).map((report) => (
                    <Link
                      key={report.id}
                      href={`/reports`}
                      className="block px-4 py-3 hover:bg-[#F8F9FA] dark:hover:bg-[#0f172a] transition-colors"
                    >
                      <p className="text-sm font-medium text-[#1A1A2E] dark:text-white truncate">
                        {report.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#6C757D] dark:text-gray-400">
                          {report.player.pseudo}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-xs h-4 px-1 ${
                            report.verdict === "Must Sign"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : report.verdict === "Pass"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
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
          <Card className="border-[#E9ECEF] dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="size-5 text-[#0F3460] dark:text-gray-400" />
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
                { href: "/tierlists", icon: Star, label: "Tier Lists" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b] transition-colors group"
                >
                  <link.icon className="size-4 text-[#6C757D] dark:text-gray-400 group-hover:text-[#E94560] transition-colors" />
                  <span className="text-sm text-[#1A1A2E] dark:text-white group-hover:text-[#E94560] transition-colors">
                    {link.label}
                  </span>
                  <ArrowRight className="size-3 ml-auto text-[#E9ECEF] dark:text-gray-600 group-hover:text-[#E94560] transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

