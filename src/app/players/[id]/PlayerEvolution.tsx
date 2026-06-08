"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SplitData {
  season: string;
  split: string | null;
  gamesPlayed: number | null;
  kda: number | null;
  dpm: number | null;
  cspm: number | null;
  gdAt15: number | null;
  kpPercent: number | null;
  vspm: number | null;
  tier: string | null;
}

interface StatHistoryData {
  week: number;
  year: number;
  peakLp: number;
  winrate: number;
  totalGames: number;
  kda: number | null;
  dpm: number | null;
  cspm: number | null;
  kpPercent: number | null;
  visionScore: number | null;
}

interface EvolutionData {
  splits: SplitData[];
  statHistory: StatHistoryData[];
}

export default function PlayerEvolution({ playerId }: { playerId: string }) {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvolution();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  async function fetchEvolution() {
    try {
      const res = await fetch(`/api/players/${playerId}/evolution`);
      if (!res.ok) throw new Error("Failed");
      const evolution = await res.json();
      setData(evolution);
    } catch {
      toast.error("Failed to load evolution data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-accent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-text-muted">
        Failed to load evolution data
      </div>
    );
  }

  const { splits, statHistory } = data;

  // Format splits for chart
  const splitChartData = splits.map((s) => ({
    label: `${s.season}${s.split ? ` ${s.split}` : ""}`,
    kda: s.kda ?? 0,
    dpm: s.dpm ?? 0,
    cspm: s.cspm ?? 0,
    gdAt15: s.gdAt15 ?? 0,
    gamesPlayed: s.gamesPlayed ?? 0,
  }));

  // Format stat history for chart
  const historyChartData = statHistory.map((h) => ({
    label: `W${h.week}`,
    peakLp: h.peakLp,
    winrate: h.winrate,
    totalGames: h.totalGames,
    kda: h.kda ?? 0,
  }));

  const hasSplits = splits.length > 0;
  const hasHistory = statHistory.length > 0;

  if (!hasSplits && !hasHistory) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 mx-auto text-text-muted mb-4" />
        <h3 className="text-lg font-medium text-text-heading mb-1">No evolution data</h3>
        <p className="text-sm text-text-muted">
          Historical data will appear here once available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pro Stats Splits */}
      {hasSplits && (
        <Card className="border-border bg-surface-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-accent" />
                Pro Stats Evolution
              </CardTitle>
              <div className="flex items-center gap-2">
                {splits.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] h-5">
                    {s.season} {s.split}
                    {s.tier && <span className="text-text-muted ml-1">({s.tier})</span>}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {/* KDA + DPM */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={splitChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                  <XAxis dataKey="label" tick={{ fill: "#A0AEC0", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#A0AEC0", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141621",
                      border: "1px solid #2A2D3A",
                      borderRadius: "8px",
                      color: "#E9ECEF",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#A0AEC0" }} />
                  <Line type="monotone" dataKey="kda" name="KDA" stroke="#E94560" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="dpm" name="DPM" stroke="#0F3460" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* CSPM + GD@15 */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={splitChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                  <XAxis dataKey="label" tick={{ fill: "#A0AEC0", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#A0AEC0", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141621",
                      border: "1px solid #2A2D3A",
                      borderRadius: "8px",
                      color: "#E9ECEF",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#A0AEC0" }} />
                  <Line type="monotone" dataKey="cspm" name="CSPM" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="gdAt15" name="GD@15" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SoloQ History */}
      {hasHistory && (
        <Card className="border-border bg-surface-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              SoloQ History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {/* LP + Winrate */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                  <XAxis dataKey="label" tick={{ fill: "#A0AEC0", fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fill: "#A0AEC0", fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#A0AEC0", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141621",
                      border: "1px solid #2A2D3A",
                      borderRadius: "8px",
                      color: "#E9ECEF",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#A0AEC0" }} />
                  <Line yAxisId="left" type="monotone" dataKey="peakLp" name="Peak LP" stroke="#E94560" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="winrate" name="Winrate %" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Games played */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                  <XAxis dataKey="label" tick={{ fill: "#A0AEC0", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#A0AEC0", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141621",
                      border: "1px solid #2A2D3A",
                      borderRadius: "8px",
                      color: "#E9ECEF",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#A0AEC0" }} />
                  <Line type="monotone" dataKey="totalGames" name="Total Games" stroke="#0F3460" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
