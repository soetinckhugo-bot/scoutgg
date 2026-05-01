"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  FileText,
  Heart,
  UserCog,
  Crown,
  Star,
  TrendingUp,
  ImageOff,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface DataCompleteness {
  totals: {
    players: number;
    reports: number;
    favorites: number;
    users: number;
    prospects: number;
    featured: number;
    recentPlayers: number;
  };
  byLeague: Array<{ league: string; count: number }>;
  byRole: Array<{ role: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  completeness: {
    withoutImage: number;
    withoutBio: number;
    withoutRealName: number;
    withoutNationality: number;
    withoutAge: number;
    withoutTeam: number;
    withProStats: number;
    withSoloqStats: number;
    withoutProStats: number;
    withoutSoloqStats: number;
  };
  proStatsByLeague: Array<{
    league: string;
    count: number;
    avgGlobalScore: number | null;
    avgTierScore: number | null;
    avgKda: number | null;
    avgDpm: number | null;
    totalGames: number | null;
  }>;
  missingFieldsByLeague: Array<{
    league: string;
    total: number;
    missingCSD: number;
    missingGD: number;
    missingVision: number;
    missingKP: number;
    missingFB: number;
    missingSoloKills: number;
    lowGames: number;
  }>;
  soloqCompleteness: {
    total: number;
    missingRank: number;
    missingPeakLp: number;
    missingWinrate: number;
    missingGames: number;
  };
}

const ROLE_COLORS: Record<string, string> = {
  TOP: "#EF4444",
  JUNGLE: "#10B981",
  MID: "#8B5CF6",
  ADC: "#F59E0B",
  SUPPORT: "#06B6D4",
};

const STATUS_COLORS: Record<string, string> = {
  SCOUTING: "#6C757D",
  FREE_AGENT: "#10B981",
  UNDER_CONTRACT: "#0F3460",
  ACADEMY: "#8B5CF6",
  SUBSTITUTE: "#F59E0B",
  RETIRED: "#EF4444",
};

const PIE_COLORS = ["#E94560", "#0F3460", "#FFC107", "#1E7E34", "#6C757D", "#8B5CF6", "#06B6D4", "#F59E0B"];

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtext,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">{title}</p>
            <p className="text-2xl font-bold text-text-heading mt-1">{value.toLocaleString()}</p>
            {subtext && <p className="text-xs text-text-muted mt-1">{subtext}</p>}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompletenessBar({
  label,
  filled,
  total,
  color = "bg-primary-accent",
}: {
  label: string;
  filled: number;
  total: number;
  color?: string;
}) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-body">{label}</span>
        <span className="text-text-heading font-medium">
          {filled} / {total} ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DataCompletenessPage() {
  const [data, setData] = useState<DataCompleteness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/data-completeness")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load data completeness");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-primary-accent" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          icon={AlertCircle}
          title="Failed to load data"
          description="Could not fetch data completeness metrics."
          actionButton={{ label: "Retry", onClick: () => window.location.reload() }}
        />
      </div>
    );
  }

  const t = data.totals;
  const c = data.completeness;
  const totalPlayers = t.players;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-heading flex items-center gap-2">
            <BarChart3 className="size-6 text-primary-accent" />
            Data Completeness Dashboard
          </h1>
          <p className="text-text-body mt-1">
            Overview of data quality and coverage across the platform
          </p>
        </div>
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4 mr-1" />
            Back to Admin
          </Button>
        </Link>
      </div>

      {/* Totals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        <StatCard title="Players" value={t.players} icon={Users} color="bg-primary-accent/20 text-primary-accent" subtext={`+${t.recentPlayers} last 30d`} />
        <StatCard title="Reports" value={t.reports} icon={FileText} color="bg-purple-500/20 text-purple-400" />
        <StatCard title="Favorites" value={t.favorites} icon={Heart} color="bg-red-500/20 text-red-400" />
        <StatCard title="Users" value={t.users} icon={UserCog} color="bg-blue-500/20 text-blue-400" />
        <StatCard title="Prospects" value={t.prospects} icon={Crown} color="bg-amber-500/20 text-amber-400" />
        <StatCard title="Featured" value={t.featured} icon={Star} color="bg-emerald-500/20 text-emerald-400" />
        <StatCard title="With Pro Stats" value={c.withProStats} icon={TrendingUp} color="bg-cyan-500/20 text-cyan-400" subtext={`${Math.round((c.withProStats / totalPlayers) * 100)}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Players by League */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="size-4 text-primary-accent" />
              Players by League
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.byLeague.sort((a, b) => b.count - a.count)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                <XAxis dataKey="league" tick={{ fill: "#A0AEC0", fontSize: 12 }} />
                <YAxis tick={{ fill: "#A0AEC0", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141621",
                    border: "1px solid #2A2D3A",
                    borderRadius: "8px",
                    color: "#E9ECEF",
                  }}
                />
                <Bar dataKey="count" fill="#E94560" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Players by Role */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-primary-accent" />
              Players by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.byRole}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="role"
                >
                  {data.byRole.map((entry) => (
                    <Cell key={entry.role} fill={ROLE_COLORS[entry.role] || "#6C757D"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141621",
                    border: "1px solid #2A2D3A",
                    borderRadius: "8px",
                    color: "#E9ECEF",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {data.byRole.map((r) => (
                <div key={r.role} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ROLE_COLORS[r.role] || "#6C757D" }}
                  />
                  <span className="text-text-body">{r.role}</span>
                  <Badge variant="secondary" className="text-xs h-4">{r.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Profile Completeness */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Profile Completeness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CompletenessBar
              label="Photo"
              filled={totalPlayers - c.withoutImage}
              total={totalPlayers}
              color="bg-emerald-500"
            />
            <CompletenessBar
              label="Real Name"
              filled={totalPlayers - c.withoutRealName}
              total={totalPlayers}
              color="bg-blue-500"
            />
            <CompletenessBar
              label="Nationality"
              filled={totalPlayers - c.withoutNationality}
              total={totalPlayers}
              color="bg-purple-500"
            />
            <CompletenessBar
              label="Age"
              filled={totalPlayers - c.withoutAge}
              total={totalPlayers}
              color="bg-amber-500"
            />
            <CompletenessBar
              label="Bio"
              filled={totalPlayers - c.withoutBio}
              total={totalPlayers}
              color="bg-cyan-500"
            />
            <CompletenessBar
              label="Team"
              filled={totalPlayers - c.withoutTeam}
              total={totalPlayers}
              color="bg-primary-accent"
            />
          </CardContent>
        </Card>

        {/* Stats Coverage */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-blue-400" />
              Stats Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CompletenessBar
              label="Pro Stats"
              filled={c.withProStats}
              total={totalPlayers}
              color="bg-primary-accent"
            />
            <CompletenessBar
              label="SoloQ Stats"
              filled={c.withSoloqStats}
              total={totalPlayers}
              color="bg-emerald-500"
            />
            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium text-text-heading mb-3">SoloQ Field Coverage</p>
              <CompletenessBar
                label="Rank"
                filled={data.soloqCompleteness.total - data.soloqCompleteness.missingRank}
                total={data.soloqCompleteness.total}
                color="bg-blue-500"
              />
              <CompletenessBar
                label="Peak LP"
                filled={data.soloqCompleteness.total - data.soloqCompleteness.missingPeakLp}
                total={data.soloqCompleteness.total}
                color="bg-purple-500"
              />
              <CompletenessBar
                label="Winrate"
                filled={data.soloqCompleteness.total - data.soloqCompleteness.missingWinrate}
                total={data.soloqCompleteness.total}
                color="bg-amber-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Fields by League */}
      <Card className="border-border mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-400" />
            Missing Pro Stats by League
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-text-muted font-medium">League</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">Total</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">No CSD@15</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">No GD@15</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">No Vision</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">No KP%</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">No FB</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">No Solo Kills</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">&lt;5 Games</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.missingFieldsByLeague
                  .sort((a, b) => b.total - a.total)
                  .map((row) => (
                    <tr key={row.league} className="hover:bg-surface-hover">
                      <td className="py-2 px-3 text-text-heading font-medium">{row.league}</td>
                      <td className="py-2 px-3 text-right text-text-body">{row.total}</td>
                      <td className="py-2 px-3 text-right">
                        <span className={row.missingCSD > 0 ? "text-amber-400" : "text-emerald-400"}>
                          {row.missingCSD}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={row.missingGD > 0 ? "text-amber-400" : "text-emerald-400"}>
                          {row.missingGD}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={row.missingVision > 0 ? "text-amber-400" : "text-emerald-400"}>
                          {row.missingVision}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={row.missingKP > 0 ? "text-amber-400" : "text-emerald-400"}>
                          {row.missingKP}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={row.missingFB > 0 ? "text-amber-400" : "text-emerald-400"}>
                          {row.missingFB}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={row.missingSoloKills > 0 ? "text-amber-400" : "text-emerald-400"}>
                          {row.missingSoloKills}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={row.lowGames > 0 ? "text-red-400" : "text-emerald-400"}>
                          {row.lowGames}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pro Stats Averages by League */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="size-4 text-primary-accent" />
            Pro Stats Quality by League
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-text-muted font-medium">League</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">Players</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">Total Games</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">Avg Global</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">Avg Tier</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">Avg KDA</th>
                  <th className="text-right py-2 px-3 text-text-muted font-medium">Avg DPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.proStatsByLeague
                  .sort((a, b) => (b.avgGlobalScore ?? 0) - (a.avgGlobalScore ?? 0))
                  .map((row) => (
                    <tr key={row.league} className="hover:bg-surface-hover">
                      <td className="py-2 px-3 text-text-heading font-medium">{row.league}</td>
                      <td className="py-2 px-3 text-right text-text-body">{row.count}</td>
                      <td className="py-2 px-3 text-right text-text-body">{row.totalGames ?? 0}</td>
                      <td className="py-2 px-3 text-right text-primary-accent font-medium">
                        {row.avgGlobalScore?.toFixed(1) ?? "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-text-body">
                        {row.avgTierScore?.toFixed(1) ?? "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-text-body">
                        {row.avgKda?.toFixed(2) ?? "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-text-body">
                        {row.avgDpm?.toFixed(0) ?? "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
