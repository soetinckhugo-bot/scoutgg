"use client";

import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { getRoleMetrics, isInvertedMetric } from "@/lib/radar-metrics";
import { getTierFromPercentile, calculatePercentile } from "@/lib/percentiles";
import { Swords } from "lucide-react";
import Image from "next/image";

interface PlayerDuelData {
  id: string;
  pseudo: string;
  role: string;
  photoUrl?: string | null;
  stats: Record<string, number | string | null>;
}

interface VsDuelCardProps {
  player1: PlayerDuelData;
  player2: PlayerDuelData;
  allPlayers?: Array<Record<string, unknown>>;
  datasetName?: string;
}

function getMetricValue(stats: Record<string, number | string | null>, key: string): number | null {
  const val = stats[key];
  if (val === null || val === undefined || val === "") return null;
  const num = typeof val === "string" ? parseFloat(val.replace(/[%]/g, "").replace(",", ".")) : val;
  return isNaN(num) ? null : num;
}

function compareMetric(
  key: string,
  val1: number | null,
  val2: number | null
): { winner: 1 | 2 | "tie"; diff: number; better: string } {
  if (val1 === null && val2 === null) return { winner: "tie", diff: 0, better: "—" };
  if (val1 === null) return { winner: 2, diff: 0, better: "N/A" };
  if (val2 === null) return { winner: 1, diff: 0, better: "N/A" };

  const inverted = isInvertedMetric(key);
  const diff = inverted ? val2 - val1 : val1 - val2;

  if (Math.abs(diff) < 0.001) return { winner: "tie", diff: 0, better: "=" };

  const winner: 1 | 2 = diff > 0 ? 1 : 2;
  const pct = inverted
    ? ((val2 - val1) / Math.max(val1, val2)) * 100
    : ((val1 - val2) / Math.max(val1, val2)) * 100;

  return {
    winner,
    diff: Math.abs(diff),
    better: `${Math.abs(pct).toFixed(1)}%`,
  };
}

export default function VsDuelCard({ player1, player2, allPlayers, datasetName }: VsDuelCardProps) {
  const roleMetrics = useMemo(() => getRoleMetrics(player1.role), [player1.role]);

  const comparisons = useMemo(() => {
    return roleMetrics.map((metric) => {
      const val1 = getMetricValue(player1.stats, metric.key);
      const val2 = getMetricValue(player2.stats, metric.key);
      const cmp = compareMetric(metric.key, val1, val2);

      // Calculate percentiles if allPlayers provided
      let pct1: number | null = null;
      let pct2: number | null = null;
      if (allPlayers && allPlayers.length > 0) {
        const r1 = calculatePercentile(val1, metric.key, player1.role, allPlayers, datasetName);
        const r2 = calculatePercentile(val2, metric.key, player2.role, allPlayers, datasetName);
        pct1 = r1?.percentile ?? null;
        pct2 = r2?.percentile ?? null;
      }

      return {
        metric,
        val1,
        val2,
        ...cmp,
        pct1,
        pct2,
      };
    });
  }, [roleMetrics, player1, player2, allPlayers, datasetName]);

  const score = useMemo(() => {
    let p1Wins = 0;
    let p2Wins = 0;
    comparisons.forEach((c) => {
      if (c.winner === 1) p1Wins++;
      if (c.winner === 2) p2Wins++;
    });
    return { p1Wins, p2Wins, total: comparisons.length };
  }, [comparisons]);

  const winProbability = useMemo(() => {
    if (score.total === 0) return 50;
    return Math.round((score.p1Wins / score.total) * 100);
  }, [score]);

  const radarData = useMemo(() => {
    return comparisons.map((c) => ({
      metric: c.metric.label,
      [player1.pseudo]: c.pct1 ?? 50,
      [player2.pseudo]: c.pct2 ?? 50,
      fullMark: 100,
    }));
  }, [comparisons, player1.pseudo, player2.pseudo]);

  const advantageText = useMemo(() => {
    if (winProbability >= 70) return `${player1.pseudo} is heavily favored`;
    if (winProbability >= 55) return `${player1.pseudo} has the edge`;
    if (winProbability >= 45) return "Evenly matched";
    if (winProbability >= 30) return `${player2.pseudo} has the edge`;
    return `${player2.pseudo} is heavily favored`;
  }, [winProbability, player1.pseudo, player2.pseudo]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Swords className="h-5 w-5 text-primary-accent" />
          <h2 className="text-lg font-bold text-text-heading">VS Duel Mode</h2>
        </div>
        <div className="text-sm text-text-body">
          <span className="tabular-nums">{score.p1Wins} — {score.p2Wins}</span>
        </div>
      </div>

      {/* Players */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          {player1.photoUrl ? (
            <Image src={player1.photoUrl} alt={player1.pseudo} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center text-text-heading font-bold">
              {player1.pseudo.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-bold text-text-heading">{player1.pseudo}</div>
            <div className="text-xs text-text-body">{player1.role}</div>
          </div>
        </div>

        <div className="text-2xl font-black text-primary-accent">VS</div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="text-right">
            <div className="font-bold text-text-heading">{player2.pseudo}</div>
            <div className="text-xs text-text-body">{player2.role}</div>
          </div>
          {player2.photoUrl ? (
            <Image src={player2.photoUrl} alt={player2.pseudo} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
              {player2.pseudo.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Win probability */}
      <div className="bg-card/5 rounded-xl p-4">
        <div className="text-xs text-text-body uppercase tracking-wider mb-2">
          Win Probability
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-primary-accent tabular-nums">{winProbability}%</span>
          <div className="flex-1 h-2 bg-card/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-accent rounded-full transition-all duration-300"
              style={{ width: `${winProbability}%` }}
            />
          </div>
          <span className="text-sm font-bold text-accent tabular-nums">{100 - winProbability}%</span>
        </div>
        <div className="text-xs text-text-subtle text-text-subtle mt-1 text-center">{advantageText}</div>
      </div>

      {/* Radar comparison */}
      {radarData.length > 0 && (
        <div className="w-full">
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="rgba(148, 163, 184, 0.15)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Radar
                name={player1.pseudo}
                dataKey={player1.pseudo}
                stroke="#E94560"
                strokeWidth={2}
                fill="#E94560"
                fillOpacity={0.15}
              />
              <Radar
                name={player2.pseudo}
                dataKey={player2.pseudo}
                stroke="#0F3460"
                strokeWidth={2}
                fill="#0F3460"
                fillOpacity={0.15}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats comparison table */}
      <div className="space-y-1">
        <div className="flex items-center gap-3 py-1 px-3 text-xs text-text-muted text-text-muted uppercase tracking-wider border-b border-white/5">
          <div className="w-24">Metric</div>
          <div className="flex-1 text-right">{player1.pseudo}</div>
          <div className="w-16 text-center">Diff</div>
          <div className="flex-1">{player2.pseudo}</div>
        </div>

        {comparisons.map((c) => {
          const tier1 = c.pct1 !== null ? getTierFromPercentile(c.pct1) : null;
          const tier2 = c.pct2 !== null ? getTierFromPercentile(c.pct2) : null;

          return (
            <div
              key={c.metric.key}
              className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${
                c.winner === 1
                  ? "bg-primary-accent/5"
                  : c.winner === 2
                  ? "bg-accent/5"
                  : ""
              }`}
            >
              <div className="w-24 text-sm text-text-subtle text-text-subtle truncate">{c.metric.label}</div>

              <div className="flex-1 text-right">
                <span
                  className="text-sm font-bold"
                  style={{ color: tier1?.color ?? "#E9ECEF" }}
                >
                  <span className="tabular-nums">{c.val1 !== null ? String(c.val1) : "—"}</span>
                </span>
                {c.pct1 !== null && (
                  <span className="text-xs text-text-muted ml-1">({c.pct1}th)</span>
                )}
              </div>

              <div className="w-16 text-center">
                <span
                  className={`text-xs font-bold ${
                    c.winner === 1
                      ? "text-primary-accent"
                      : c.winner === 2
                      ? "text-accent"
                      : "text-text-muted"
                  }`}
                >
                  {c.better}
                </span>
              </div>

              <div className="flex-1">
                <span
                  className="text-sm font-bold"
                  style={{ color: tier2?.color ?? "#E9ECEF" }}
                >
                  <span className="tabular-nums">{c.val2 !== null ? String(c.val2) : "—"}</span>
                </span>
                {c.pct2 !== null && (
                  <span className="text-xs text-text-muted ml-1">({c.pct2}th)</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
