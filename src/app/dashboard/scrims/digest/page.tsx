"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Trophy,
  XCircle,
  Minus,
  TrendingUp,
  Swords,
  BarChart3,
  Target,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ROLE_COLORS } from "@/lib/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const ROLE_LABELS: Record<string, string> = {
  TOP: "TOP",
  JUNGLE: "JGL",
  MID: "MID",
  ADC: "ADC",
  SUPPORT: "SUP",
};

interface DigestData {
  summary: {
    total: number;
    wins: number;
    losses: number;
    draws: number;
    winrate: number;
  };
  weeklyTrend: Array<{
    label: string;
    wins: number;
    losses: number;
    draws: number;
    total: number;
  }>;
  topCompositions: Array<{
    comp: string;
    count: number;
    wins: number;
    winrate: number;
  }>;
  topEnemyCompositions: Array<{
    comp: string;
    count: number;
    wins: number;
    winrate: number;
  }>;
  roleWinrates: Array<{
    role: string;
    totalGames: number;
    winrate: number;
    topChampion: { champion: string; games: number; wins: number } | null;
  }>;
  recentScrims: Array<{
    id: string;
    date: string;
    opponent: string;
    result: string;
    allyComp: string[];
    enemyComp: string[];
  }>;
}

export default function ScrimDigestPage() {
  const [data, setData] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDigest();
  }, []);

  async function fetchDigest() {
    try {
      const res = await fetch("/api/scrims/digest");
      if (!res.ok) throw new Error("Failed");
      const digest = await res.json();
      setData(digest);
    } catch {
      toast.error("Failed to load scrim analytics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary-accent" />
      </div>
    );
  }

  if (!data || data.summary.total === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/scrims">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Scrims
          </Link>
        </Button>
        <Card className="border-border bg-surface-hover">
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-text-muted mb-4" />
            <h2 className="text-lg font-medium text-text-heading mb-1">No data yet</h2>
            <p className="text-sm text-text-muted mb-4">
              Log some scrims to see your analytics
            </p>
            <Button asChild className="bg-primary-accent hover:bg-primary-accent/90">
              <Link href="/dashboard/scrims/new">Log a scrim</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, weeklyTrend, topCompositions, topEnemyCompositions, roleWinrates, recentScrims } = data;

  const resultIcon: Record<string, React.ReactNode> = {
    WIN: <Trophy className="w-3.5 h-3.5 text-green-500" />,
    LOSS: <XCircle className="w-3.5 h-3.5 text-red-500" />,
    DRAW: <Minus className="w-3.5 h-3.5 text-yellow-500" />,
  };

  const resultColor: Record<string, string> = {
    WIN: "bg-green-500/10 text-green-500 border-green-500/20",
    LOSS: "bg-red-500/10 text-red-500 border-red-500/20",
    DRAW: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/scrims">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Scrims
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-heading">Scrim Digest</h1>
            <p className="text-sm text-text-muted">Analytics & performance insights</p>
          </div>
        </div>
        <Button asChild className="bg-primary-accent hover:bg-primary-accent/90">
          <Link href="/dashboard/scrims/new">
            <Swords className="w-4 h-4 mr-2" />
            New Scrim
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border bg-surface-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary-accent/15 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary-accent" />
              </div>
              <span className="text-xs text-text-muted">Winrate</span>
            </div>
            <div className="text-2xl font-bold text-text-heading">{summary.winrate}%</div>
            <Progress value={summary.winrate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className="border-border bg-surface-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-xs text-text-muted">Wins</span>
            </div>
            <div className="text-2xl font-bold text-green-500">{summary.wins}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-surface-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-xs text-text-muted">Losses</span>
            </div>
            <div className="text-2xl font-bold text-red-500">{summary.losses}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-surface-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-text-muted">Total</span>
            </div>
            <div className="text-2xl font-bold text-text-heading">{summary.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend Chart */}
      <Card className="border-border bg-surface-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-accent" />
            Weekly Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                <XAxis dataKey="label" tick={{ fill: "#A0AEC0", fontSize: 12 }} />
                <YAxis tick={{ fill: "#A0AEC0", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141621",
                    border: "1px solid #2A2D3A",
                    borderRadius: "8px",
                    color: "#E9ECEF",
                  }}
                />
                <Legend wrapperStyle={{ color: "#A0AEC0" }} />
                <Bar dataKey="wins" name="Wins" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="losses" name="Losses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="draws" name="Draws" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Role Winrates */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {roleWinrates.map((r) => (
          <Card key={r.role} className="border-border bg-surface-hover">
            <CardContent className="p-4 text-center">
              <Badge
                variant="outline"
                className={`text-[10px] font-bold tracking-wider mb-2 ${ROLE_COLORS[r.role.toUpperCase()]}`}
              >
                {ROLE_LABELS[r.role.toUpperCase()]}
              </Badge>
              <div className="text-2xl font-bold text-text-heading">{r.winrate}%</div>
              <div className="text-xs text-text-muted mt-1">{r.totalGames} games</div>
              {r.topChampion && (
                <div className="text-xs text-text-body mt-1.5">
                  Top: <span className="text-primary-accent font-medium">{r.topChampion.champion}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compositions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ally Comps */}
        <Card className="border-border bg-surface-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Top Compositions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {topCompositions.length === 0 ? (
              <p className="text-sm text-text-muted">No composition data yet</p>
            ) : (
              topCompositions.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-heading truncate">{c.comp}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">{c.count} games</span>
                      <span
                        className={`text-xs font-medium ${
                          c.winrate >= 60
                            ? "text-green-500"
                            : c.winrate >= 40
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        {c.winrate}% WR
                      </span>
                    </div>
                  </div>
                  <div className="w-16">
                    <Progress value={c.winrate} className="h-1.5" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Enemy Comps */}
        <Card className="border-border bg-surface-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Most Faced Enemy Compositions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {topEnemyCompositions.length === 0 ? (
              <p className="text-sm text-text-muted">No composition data yet</p>
            ) : (
              topEnemyCompositions.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-heading truncate">{c.comp}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">{c.count} games</span>
                      <span
                        className={`text-xs font-medium ${
                          c.winrate >= 60
                            ? "text-green-500"
                            : c.winrate >= 40
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        {c.winrate}% WR
                      </span>
                    </div>
                  </div>
                  <div className="w-16">
                    <Progress value={c.winrate} className="h-1.5" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Scrims */}
      <Card className="border-border bg-surface-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Scrims</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            {recentScrims.map((scrim) => (
              <div
                key={scrim.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-card transition-colors"
              >
                <Badge
                  variant="outline"
                  className={`${resultColor[scrim.result]} flex items-center gap-1 text-xs shrink-0`}
                >
                  {resultIcon[scrim.result]}
                  {scrim.result}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-heading">{scrim.opponent}</p>
                  <p className="text-xs text-text-muted">
                    {new Date(scrim.date).toLocaleDateString()}
                  </p>
                </div>
                {scrim.allyComp.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1">
                    {scrim.allyComp.map((champ, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[10px] h-5 px-1 bg-primary-accent/10 text-primary-accent border-primary-accent/20"
                      >
                        {champ}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
