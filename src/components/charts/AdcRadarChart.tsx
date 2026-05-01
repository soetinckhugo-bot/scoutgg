"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logger } from "@/lib/logger";

const ADC_METRICS = [
  { key: "kda", label: "KDA", format: (v: number) => v.toFixed(1) },
  { key: "cspm", label: "CS/m", format: (v: number) => v.toFixed(1) },
  { key: "dpm", label: "DMG/m", format: (v: number) => v.toFixed(0) },
  { key: "damagePercent", label: "DMG%", format: (v: number) => `${v}%` },
  { key: "goldPercent", label: "GOLD%", format: (v: number) => `${v}%` },
  { key: "kpPercent", label: "KP", format: (v: number) => `${v}%` },
  { key: "csdAt15", label: "CS@15", format: (v: number) => (v > 0 ? `+${v}` : `${v}`) },
  { key: "gdAt15", label: "GOLD@15", format: (v: number) => (v > 0 ? `+${v}` : `${v}`) },
] as const;

interface ProStats {
  kda: number | null;
  cspm: number | null;
  dpm: number | null;
  damagePercent: number | null;
  goldPercent: number | null;
  kpPercent: number | null;
  csdAt15: number | null;
  gdAt15: number | null;
}

interface PlayerData {
  id: string;
  pseudo: string;
  league: string;
  tier: string | null;
  proStats: ProStats;
}

interface AdcRadarChartProps {
  playerId: string;
}

type CompareMode = "league" | "tier" | "all";

function computePercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 50;
  const sorted = [...allValues].sort((a, b) => a - b);
  const idx = sorted.findIndex((v) => v >= value);
  if (idx === -1) return 100;
  return Math.round((idx / sorted.length) * 100);
}

function getRankColor(rank: number, total: number): string {
  const pct = total > 0 ? (rank / total) * 100 : 50;
  if (pct <= 10) return "text-yellow-400";
  if (pct <= 25) return "text-green-400";
  if (pct <= 50) return "text-blue-400";
  return "text-text-body";
}

function getRankBg(rank: number, total: number): string {
  const pct = total > 0 ? (rank / total) * 100 : 50;
  if (pct <= 10) return "bg-yellow-500/20 text-yellow-400";
  if (pct <= 25) return "bg-green-500/20 text-green-400";
  if (pct <= 50) return "bg-blue-500/20 text-blue-400";
  return "bg-gray-500/20 text-text-body";
}

export default function AdcRadarChart({ playerId }: AdcRadarChartProps) {
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [allAdcs, setAllAdcs] = useState<PlayerData[]>([]);
  const [compareMode, setCompareMode] = useState<CompareMode>("tier");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/players/${playerId}/prostats`);
        const data = await res.json();
        if (!data.proStats || !data.player) {
          setLoading(false);
          return;
        }

        setPlayer({
          id: playerId,
          pseudo: data.player.pseudo,
          league: data.player.league,
          tier: data.player.tier,
          proStats: data.proStats,
        });

        const allRes = await fetch(`/api/players?role=ADC&limit=100`);
        const allData = await allRes.json();
        const adcs = (allData.players || [])
          .filter((p: any) => p.id !== playerId && p.proStats)
          .map((p: any) => ({
            id: p.id,
            pseudo: p.pseudo,
            league: p.league,
            tier: p.tier,
            proStats: p.proStats,
          }));
        setAllAdcs(adcs);
      } catch (e) {
        logger.error("Failed to load ADC comparison", { error: e });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [playerId]);

  const comparisonGroup = useMemo(() => {
    if (!player) return [];
    switch (compareMode) {
      case "league":
        return allAdcs.filter((p) => p.league === player.league);
      case "tier":
        return player.tier
          ? allAdcs.filter((p) => p.tier === player.tier)
          : allAdcs.filter((p) => p.league === player.league);
      case "all":
        return allAdcs;
      default:
        return [];
    }
  }, [allAdcs, player, compareMode]);

  const metricsData = useMemo(() => {
    if (!player) return [];

    return ADC_METRICS.map((metric) => {
      const playerValue = player.proStats[metric.key] ?? 0;
      const allValues = comparisonGroup
        .map((p) => p.proStats[metric.key])
        .filter((v): v is number => v !== null && v !== undefined);

      const sorted = [...allValues, playerValue].sort((a, b) => a - b);
      const rank = sorted.findIndex((v) => v >= playerValue) + 1;
      const total = sorted.length;
      const pct = computePercentile(playerValue, allValues);

      const avgValue = allValues.length > 0
        ? allValues.reduce((a, b) => a + b, 0) / allValues.length
        : 0;

      return {
        metric: metric.label,
        key: metric.key,
        playerValue,
        avgValue,
        rank,
        total,
        pct,
        format: metric.format,
      };
    });
  }, [player, comparisonGroup]);

  const chartData = useMemo(() => {
    return metricsData.map((m) => ({
      metric: m.metric,
      [player?.pseudo || "Player"]: m.pct,
      avg: 50,
      fullMark: 100,
    }));
  }, [metricsData, player]);

  const compareLabel = useMemo(() => {
    if (!player) return "";
    switch (compareMode) {
      case "league":
        return `League: ${player.league}`;
      case "tier":
        return player.tier ? `Tier: ${player.tier}` : `League: ${player.league}`;
      case "all":
        return "All ADCs";
    }
  }, [compareMode, player]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-accent" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-8 text-text-body">
        No pro stats available for comparison.
      </div>
    );
  }

  const hasComparison = comparisonGroup.length > 0;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">
          {player.pseudo}&apos;s Performances
        </h3>
        <Select value={compareMode} onValueChange={(v) => setCompareMode(v as CompareMode)}>
          <SelectTrigger className="w-[200px] h-8 text-xs bg-card border-border">
            <SelectValue placeholder={compareLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tier">
              {player.tier ? `Tier: ${player.tier}` : `League: ${player.league}`}
            </SelectItem>
            <SelectItem value="league">League: {player.league}</SelectItem>
            <SelectItem value="all">All ADCs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Radar + Legend */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        <div className="w-full lg:w-3/4">
          <ResponsiveContainer width="100%" height={440}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="rgba(148, 163, 184, 0.15)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <Radar
                name={player.pseudo}
                dataKey={player.pseudo}
                stroke="#f59e0b"
                strokeWidth={2}
                fill="#f59e0b"
                fillOpacity={0.15}
              />
              {hasComparison && (
                <Radar
                  name={`${compareLabel} avg`}
                  dataKey="avg"
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="#64748b"
                  fillOpacity={0.05}
                />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Mini legend */}
        <div className="w-full lg:w-1/4 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-amber-400 font-medium">{player.pseudo}</span>
          </div>
          {hasComparison && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-slate-500 border-dashed" />
              <span className="text-slate-400">{compareLabel} avg</span>
            </div>
          )}
          <div className="pt-2 space-y-1">
            <div className="text-xs text-text-muted uppercase">Percentiles</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-yellow-400">Top 10%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-green-400">Top 25%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-blue-400">Top 50%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-text-body">Bottom 50%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      {!hasComparison && (
        <div className="text-center py-4 text-sm text-text-muted bg-card/5 rounded">
          Not enough players in {compareLabel} for comparison.
          <br />
          <span className="text-xs">Try &quot;All ADCs&quot; or a different group.</span>
        </div>
      )}
      <div className="space-y-1">
        {/* Column headers */}
        <div className="flex items-center gap-3 py-1 px-3 text-xs text-text-muted uppercase tracking-wider border-b border-border">
          <div className="w-10" />
          <div className="w-24" />
          <div className="flex-1 text-left">{player.pseudo}</div>
          <div className="w-24 text-right">{compareLabel} avg</div>
        </div>

        {metricsData.map((m) => (
          <div
            key={m.key}
            className="flex items-center gap-3 py-2 px-3 rounded hover:bg-card/5 transition-colors"
          >
            {/* Rank badge */}
            <div className={`w-10 h-6 rounded text-xs font-bold flex items-center justify-center tabular-nums ${hasComparison ? getRankBg(m.rank, m.total) : "bg-gray-500/20 text-text-body"}`}>
              {hasComparison ? `${m.rank}/${m.total}` : "—"}
            </div>

            {/* Metric name */}
            <span className="w-24 text-sm text-text-body">{m.metric}</span>

            {/* Player value */}
            <div className="flex-1">
              <span className={`text-sm font-bold tabular-nums ${hasComparison ? getRankColor(m.rank, m.total) : "text-text-heading"}`}>
                {m.format(m.playerValue)}
              </span>
            </div>

            {/* Avg value */}
            <div className="w-24 text-right">
              <span className="text-sm text-slate-400 tabular-nums">
                {hasComparison && m.avgValue > 0 ? m.format(m.avgValue) : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
