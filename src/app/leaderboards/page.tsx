"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Trophy,
  TrendingUp,
  Target,
  Swords,
  Eye,
  Zap,
  Crown,
  Medal,
  User,
  Loader2,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Globe,
  Flag,
  Calendar,
} from "lucide-react";
import ScoutIcon from "@/components/ScoutIcon";
import { ROLE_COLORS } from "@/lib/constants";

interface Player {
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  nationality: string | null;
  age: number | null;
  currentTeam: string | null;
  league: string;
  tier: string | null;
  photoUrl: string | null;
  proStats: {
    gamesPlayed: number | null;
    winRate: number | null;
    kda: number | null;
    dpm: number | null;
    cspm: number | null;
    gdAt15: number | null;
    soloKills: number | null;
    damagePercent: number | null;
    vsPercent: number | null;
    globalScore: number | null;
    tierScore: number | null;
  } | null;
}

interface MetricConfig {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  format: (p: Player) => string;
  getValue: (p: Player) => number;
  unit?: string;
  minGames: number;
}

const METRICS: MetricConfig[] = [
  {
    id: "globalScore",
    label: "Score Global",
    shortLabel: "Global",
    icon: Globe,
    format: (p) => (p.proStats?.globalScore ?? 0).toFixed(1),
    getValue: (p) => p.proStats?.globalScore ?? 0,
    minGames: 5,
  },
  {
    id: "tierScore",
    label: "Score Tier",
    shortLabel: "Tier",
    icon: Trophy,
    format: (p) => (p.proStats?.tierScore ?? 0).toFixed(1),
    getValue: (p) => p.proStats?.tierScore ?? 0,
    minGames: 5,
  },
  {
    id: "dpm",
    label: "DPM",
    shortLabel: "DPM",
    icon: Swords,
    format: (p) => `${Math.round(p.proStats?.dpm ?? 0)}`,
    getValue: (p) => p.proStats?.dpm ?? 0,
    unit: "dmg/min",
    minGames: 5,
  },
  {
    id: "kda",
    label: "KDA",
    shortLabel: "KDA",
    icon: Target,
    format: (p) => (p.proStats?.kda ?? 0).toFixed(2),
    getValue: (p) => p.proStats?.kda ?? 0,
    minGames: 5,
  },
  {
    id: "soloKills",
    label: "Solo Kills",
    shortLabel: "SoloK",
    icon: Zap,
    format: (p) => (p.proStats?.soloKills ?? 0).toFixed(1),
    getValue: (p) => p.proStats?.soloKills ?? 0,
    minGames: 5,
  },
  {
    id: "damagePercent",
    label: "DMG%",
    shortLabel: "DMG%",
    icon: BarChart3,
    format: (p) => `${((p.proStats?.damagePercent ?? 0) * 100).toFixed(1)}%`,
    getValue: (p) => p.proStats?.damagePercent ?? 0,
    unit: "%",
    minGames: 5,
  },
  {
    id: "vsPercent",
    label: "VS%",
    shortLabel: "VS%",
    icon: Eye,
    format: (p) => `${((p.proStats?.vsPercent ?? 0) * 100).toFixed(1)}%`,
    getValue: (p) => p.proStats?.vsPercent ?? 0,
    unit: "%",
    minGames: 5,
  },
  {
    id: "cspm",
    label: "CSPM",
    shortLabel: "CSPM",
    icon: Crown,
    format: (p) => (p.proStats?.cspm ?? 0).toFixed(1),
    getValue: (p) => p.proStats?.cspm ?? 0,
    unit: "cs/min",
    minGames: 5,
  },
  {
    id: "gdAt15",
    label: "GD@15",
    shortLabel: "GD@15",
    icon: TrendingUp,
    format: (p) => `${Math.round(p.proStats?.gdAt15 ?? 0)}g`,
    getValue: (p) => p.proStats?.gdAt15 ?? 0,
    unit: "gold",
    minGames: 5,
  },
];

const ROLES = ["ALL", "TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
const SPLITS = ["ALL", "Winter", "Spring", "Summer"];
const SEASONS = ["2026"];
import { LEAGUES } from "@/lib/constants";
const LEAGUE_OPTIONS = ["ALL", ...LEAGUES];
const TIERS = ["ALL", "1", "2", "3", "4"];
const NATIONALITIES = ["ALL", "KR", "CN", "FR", "DE", "ES", "DK", "PL", "GB", "TR", "VN", "BR", "JP", "TW", "US", "CA"];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-yellow-900/30 flex items-center justify-center shrink-0">
        <ScoutIcon icon={Trophy} size="md" variant="gold" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
        <ScoutIcon icon={Medal} size="md" variant="default" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-900/30 flex items-center justify-center shrink-0">
        <ScoutIcon icon={Medal} size="md" variant="warning" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center shrink-0">
      <span className="text-sm font-semibold text-text-body tabular-nums">{rank}</span>
    </div>
  );
}

function ScoreColor(value: number) {
  if (value >= 90) return "text-blue-400";
  if (value >= 75) return "text-green-400";
  if (value >= 60) return "text-yellow-400";
  if (value >= 50) return "text-orange-400";
  return "text-red-400";
}

export default function LeaderboardsPage() {
  const [season, setSeason] = useState("2026");
  const [split, setSplit] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [leagueFilter, setLeagueFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [nationalityFilter, setNationalityFilter] = useState("ALL");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [metric, setMetric] = useState("globalScore");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const activeMetric = useMemo(
    () => METRICS.find((m) => m.id === metric) || METRICS[0],
    [metric]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        season,
        split,
        metric,
        order: "desc",
        limit: String(limit),
        page: String(page),
      });
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (leagueFilter !== "ALL") params.set("league", leagueFilter);
      if (tierFilter !== "ALL") params.set("tier", tierFilter);
      if (nationalityFilter !== "ALL") params.set("nationality", nationalityFilter);
      if (ageMin) params.set("ageMin", ageMin);
      if (ageMax) params.set("ageMax", ageMax);

      const res = await fetch(`/api/leaderboard?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPlayers(data.players || []);
      setTotal(data.total || 0);
    } catch (err) {
      logger.error("Leaderboard fetch error", { err });
      setPlayers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [season, split, metric, roleFilter, leagueFilter, tierFilter, nationalityFilter, ageMin, ageMax, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-switch metric when tier filter changes
  useEffect(() => {
    if (tierFilter !== "ALL" && metric === "globalScore") {
      setMetric("tierScore");
    } else if (tierFilter === "ALL" && metric === "tierScore") {
      setMetric("globalScore");
    }
  }, [tierFilter, metric]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [season, split, metric, roleFilter, leagueFilter, tierFilter, nationalityFilter, ageMin, ageMax]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-heading mb-2">Leaderboards</h1>
          <p className="text-text-body">Leaderboards by metric — Season 2026</p>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Season */}
              <div>
                <label className="text-xs text-text-muted mb-1 block flex items-center gap-1">
                  <ScoutIcon icon={Calendar} size="xs" variant="muted" /> Season
                </label>
                <Select value={season} onValueChange={(v) => { if (v) setSeason(v); }}>
                  <SelectTrigger className="h-8 text-xs bg-surface-hover border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEASONS.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Split */}
              <div>
                <label className="text-xs text-text-muted mb-1 block flex items-center gap-1">
                  <ScoutIcon icon={Target} size="xs" variant="muted" /> Split
                </label>
                <Select value={split} onValueChange={(v) => { if (v) setSplit(v); }}>
                  <SelectTrigger className="h-8 text-xs bg-surface-hover border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPLITS.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* League */}
              <div>
                <label className="text-xs text-text-muted mb-1 block flex items-center gap-1">
                  <ScoutIcon icon={Flag} size="xs" variant="muted" /> League
                </label>
                <Select value={leagueFilter} onValueChange={(v) => { if (v) setLeagueFilter(v); }}>
                  <SelectTrigger className="h-8 text-xs bg-surface-hover border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAGUE_OPTIONS.map((l) => (
                      <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tier */}
              <div>
                <label className="text-xs text-text-muted mb-1 block flex items-center gap-1">
                  <ScoutIcon icon={TrendingUp} size="xs" variant="muted" /> Tier
                </label>
                <Select value={tierFilter} onValueChange={(v) => { if (v) setTierFilter(v); }}>
                  <SelectTrigger className="h-8 text-xs bg-surface-hover border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nationality */}
              <div>
                <label className="text-xs text-text-muted mb-1 block flex items-center gap-1">
                  <ScoutIcon icon={Globe} size="xs" variant="muted" /> Nationality
                </label>
                <Select value={nationalityFilter} onValueChange={(v) => { if (v) setNationalityFilter(v); }}>
                  <SelectTrigger className="h-8 text-xs bg-surface-hover border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NATIONALITIES.map((n) => (
                      <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Age range */}
              <div>
                <label className="text-xs text-text-muted mb-1 block">Age</label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={ageMin}
                    onChange={(e) => setAgeMin(e.target.value)}
                    className="h-8 text-xs bg-surface-hover border-border"
                  />
                  <span className="text-text-muted">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={ageMax}
                    onChange={(e) => setAgeMax(e.target.value)}
                    className="h-8 text-xs bg-surface-hover border-border"
                  />
                </div>
              </div>
            </div>

            {/* Role filter */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-muted">Role:</span>
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`text-xs h-7 px-3 rounded-full transition-colors ${
                    roleFilter === r
                      ? "bg-primary-accent text-text-heading"
                      : "bg-surface-hover text-text-body hover:bg-border"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Metric Tabs */}
        <div className="mb-6 overflow-x-auto">
          <Tabs value={metric} onValueChange={setMetric}>
            <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
              {METRICS.map((m) => (
                <TabsTrigger
                  key={m.id}
                  value={m.id}
                  className="data-[state=active]:bg-card data-[state=active]:text-primary-accent data-[state=active]:border-primary-accent data-[state=active]:border text-xs h-8 px-3 border border-transparent"
                >
                  <m.icon className="h-3 w-3 mr-1" />
                  {m.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          {/* Table Header */}
          <div className="px-4 py-3 border-b border-border bg-surface-hover flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-text-heading">
              <activeMetric.icon className="h-5 w-5 text-primary-accent" />
              {activeMetric.label}
              {activeMetric.minGames > 0 && (
                <Badge variant="secondary" className="text-xs h-5 bg-surface-hover text-text-body">
                  min {activeMetric.minGames} games
                </Badge>
              )}
            </h3>
            <span className="text-xs text-text-muted">{total} players</span>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {/* Header row */}
            <div className="grid grid-cols-[40px_1fr_100px_80px_80px_100px] gap-2 px-4 py-2 border-b border-border text-xs text-text-muted uppercase tracking-wider min-w-[600px]">
              <span>#</span>
              <span>Player</span>
              <span className="text-right">Team</span>
              <span className="text-right">League</span>
              <span className="text-right">Games</span>
              <span className="text-right">{activeMetric.label}</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary-accent" />
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-16 text-text-body">
                <ScoutIcon icon={Trophy} size="xl" variant="muted" />
                <p>No players found for these filters</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {players.map((player, index) => {
                  const rank = (page - 1) * limit + index + 1;
                  const value = activeMetric.getValue(player);
                  const games = player.proStats?.gamesPlayed ?? 0;
                  const winRate = player.proStats?.winRate ?? 0;
                  return (
                    <Link
                      key={player.id}
                      href={`/players/${player.id}`}
                      className="grid grid-cols-[40px_1fr_100px_80px_80px_100px] gap-2 px-4 py-3 hover:bg-background transition-colors items-center group min-w-[600px]"
                    >
                      <span className="text-sm font-semibold text-text-body tabular-nums">{rank}</span>

                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0">
                          {player.photoUrl ? (
                            <AvatarImage src={player.photoUrl} alt={player.pseudo} />
                          ) : null}
                          <AvatarFallback className="bg-surface-elevated text-text-heading text-xs">
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-heading truncate text-sm">{player.pseudo}</span>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] h-4 px-1.5 ${ROLE_COLORS[player.role] || "bg-surface-hover text-text-heading"}`}
                            >
                              {player.role}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-text-muted truncate">
                            {player.nationality} {player.age ? `· ${player.age} yrs` : ""}
                          </div>
                        </div>
                      </div>

                      <span className="text-right text-sm text-text-body truncate">
                        {player.currentTeam || "—"}
                      </span>

                      <span className="text-right text-sm text-text-body">{player.league}</span>

                      <div className="text-right text-sm text-text-body">
                        <span className="tabular-nums">{games}</span>
                        {winRate > 0 && (
                          <span className="text-[10px] text-text-muted block">
                            {Math.round(winRate * 100)}% W
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-lg font-bold tabular-nums ${ScoreColor(
                            metric === "globalScore" || metric === "tierScore" ? value : 75
                          )}`}
                        >
                          {activeMetric.format(player)}
                        </span>
                        {activeMetric.unit && (
                          <span className="text-[10px] text-text-muted ml-1">{activeMetric.unit}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 text-xs text-text-body hover:text-text-heading disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-xs text-text-muted">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 text-xs text-text-body hover:text-text-heading disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
