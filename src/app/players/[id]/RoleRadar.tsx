"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Loader2, Users, Trophy } from "lucide-react";
import RadarChart from "./RadarChart";

interface RadarMetric {
  metric: string;
  percentile: number;
  tier: "S" | "A" | "B" | "C" | "D";
  value: number;
}

interface RadarData {
  player: {
    id: string;
    pseudo: string;
    role: string;
    league: string;
    tier?: string;
  };
  comparisonMode: string;
  sampleSize: number;
  metrics: RadarMetric[];
}

interface RoleRadarProps {
  playerId: string;
}

function RoleRadar({ playerId }: RoleRadarProps) {
  const [data, setData] = useState<RadarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState<"league" | "tier">("league");

  useEffect(() => {
    async function fetchRadar() {
      setLoading(true);
      try {
        const res = await fetch(`/api/players/${playerId}/radar?comparison=${comparisonMode}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError("Failed to load radar data");
      } finally {
        setLoading(false);
      }
    }

    fetchRadar();
  }, [playerId, comparisonMode]);

  const handleLeagueMode = useCallback(() => setComparisonMode("league"), []);
  const handleTierMode = useCallback(() => setComparisonMode("tier"), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data || data.metrics.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        {error || "No radar data available. Import stats first."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {data.player.pseudo} — {data.player.role} in{" "}
          {data.comparisonMode === "tier" ? data.player.tier || "same tier" : data.player.league}
        </span>
        <div className="flex items-center gap-2">
          {/* Comparison toggle */}
          <div className="flex items-center bg-muted rounded-lg border border-border overflow-hidden">
            <button
              onClick={handleLeagueMode}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors ${
                comparisonMode === "league"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-muted-foreground"
              }`}
            >
              <Trophy className="h-3 w-3" />
              League
            </button>
            <button
              onClick={handleTierMode}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors ${
                comparisonMode === "tier"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-muted-foreground"
              }`}
            >
              <Users className="h-3 w-3" />
              Tier
            </button>
          </div>
          <span className="text-xs text-muted-foreground">vs {data.sampleSize} players</span>
        </div>
      </div>
      <RadarChart
        metrics={data.metrics}
        playerName={data.player.pseudo}
        role={data.player.role}
      />
    </div>
  );
}

export default memo(RoleRadar);
