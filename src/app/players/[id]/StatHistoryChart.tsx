"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface HistoryPoint {
  week: number;
  year: number;
  peakLp: number;
  winrate: number;
  totalGames: number;
  label: string;
  winratePct: number;
}

export default function StatHistoryChart({ playerId }: { playerId: string }) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<"peakLp" | "winrate">("peakLp");

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`/api/players/${playerId}/history`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const formatted = (data.history || []).map((h: any) => ({
          ...h,
          label: `W${h.week}`,
          winratePct: Math.round(h.winrate * 100) / 100,
        }));
        setHistory(formatted);
      } catch {
        toast.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [playerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-accent" />
      </div>
    );
  }

  if (history.length < 2) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="h-10 w-10 text-text-heading mx-auto mb-2" />
        <p className="text-sm text-text-muted">
          Not enough data yet. Stats history builds up over time as sync runs.
        </p>
      </div>
    );
  }

  const color = metric === "peakLp" ? "#E94560" : "#0F3460";
  const label = metric === "peakLp" ? "Peak LP" : "Winrate";
  const formatter =
    metric === "peakLp" ? (v: number) => `${v} LP` : (v: number) => `${v}%`;

  const dataKey = metric === "peakLp" ? "peakLp" : "winratePct";

  // Compute summary stats based on selected metric
  const summaryValues = history.map((h) =>
    metric === "peakLp" ? h.peakLp : h.winratePct
  );
  const min = Math.min(...summaryValues);
  const max = Math.max(...summaryValues);
  const first = summaryValues[0];
  const last = summaryValues[summaryValues.length - 1];
  const change = last - first;

  return (
    <div className="space-y-4">
      {/* Metric Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMetric("peakLp")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            metric === "peakLp"
              ? "bg-primary-accent text-text-heading"
              : "bg-surface-elevated text-text-muted hover:bg-surface-hover"
          }`}
        >
          Peak LP
        </button>
        <button
          onClick={() => setMetric("winrate")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            metric === "winrate"
              ? "bg-accent text-text-heading"
              : "bg-surface-elevated text-text-muted hover:bg-surface-hover"
          }`}
        >
          Winrate
        </button>
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-card px-3 py-2 border-b border-border flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {label} Over Time
          </span>
        </div>
        <div className="bg-surface-elevated p-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2A2D3A"
                opacity={0.5}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#6C757D" }}
                axisLine={{ stroke: "#2A2D3A" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6C757D" }}
                axisLine={{ stroke: "#2A2D3A" }}
                tickFormatter={formatter}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141621",
                  border: "1px solid #2A2D3A",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#E9ECEF",
                }}
                itemStyle={{ color: "#E9ECEF" }}
                labelStyle={{ color: "#6C757D" }}
                formatter={(value: any) => [formatter(value as number), label]}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-card px-3 py-2 border-b border-border flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Summary
          </span>
        </div>
        <div className="bg-surface-elevated grid grid-cols-3 divide-x divide-[#232838]">
          {/* Total Change */}
          <div className="px-3 py-3 text-center">
            <div
              className={`text-lg font-bold ${
                change >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              <span className="tabular-nums">
              {change >= 0 ? "+" : ""}
              {metric === "peakLp"
                ? `${change} LP`
                : `${change.toFixed(2)}%`}
              </span>
            </div>
            <div className="text-xs text-text-muted uppercase">
              Total Change
            </div>
          </div>
          {/* Peak */}
          <div className="px-3 py-3 text-center">
            <div className="text-lg font-bold text-text-heading tabular-nums">
              {metric === "peakLp"
                ? `${max} LP`
                : `${max.toFixed(2)}%`}
            </div>
            <div className="text-xs text-text-muted uppercase">
              Peak {label}
            </div>
          </div>
          {/* Weeks Tracked */}
          <div className="px-3 py-3 text-center">
            <div className="text-lg font-bold text-text-heading tabular-nums">
              {history.length}
            </div>
            <div className="text-xs text-text-muted uppercase">
              Weeks Tracked
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
