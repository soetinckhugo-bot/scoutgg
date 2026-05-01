"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { BarChart3, Loader2, Users, Trophy, Swords, Eye, Coins } from "lucide-react";
import ScoutIcon from "@/components/ScoutIcon";

interface PercentileResult {
  percentile: number;
  rank: number;
  total: number;
  tier: "S" | "A" | "B" | "C" | "D";
  color: string;
}

interface PercentilesData {
  player: {
    id: string;
    pseudo: string;
    role: string;
    league: string;
    tier?: string;
  };
  comparisonMode: string;
  sampleSize: number;
  percentiles: Record<string, PercentileResult | null>;
}

// New colors: Elite=Blue, Excellent=Green, Good=Yellow, Average=Orange, Weak=Red
const TIER_COLORS = {
  S: "#3B82F6",
  A: "#22C55E",
  B: "#EAB308",
  C: "#F97316",
  D: "#EF4444",
};

const TIER_LABELS = {
  S: "Elite",
  A: "Excellent",
  B: "Good",
  C: "Average",
  D: "Weak",
};

// 3 categories: Fight, Vision, Ressources
const CATEGORY_MAP: Record<string, string> = {
  // Fight
  KDA: "Fight",
  KP: "Fight",
  "KS%": "Fight",
  "DTH%": "Fight",
  "FB%": "Fight",
  "FB Victim": "Fight",
  "Solo Kills": "Fight",
  K: "Fight",
  D: "Fight",
  A: "Fight",
  STL: "Fight",
  "CTR%": "Fight",
  // Vision
  WPM: "Vision",
  CWPM: "Vision",
  WCPM: "Vision",
  VWPM: "Vision",
  "VS%": "Vision",
  VSPM: "Vision",
  "Avg WPM": "Vision",
  "Avg WCPM": "Vision",
  "Avg VWPM": "Vision",
  // Ressources
  Games: "Ressources",
  "W%": "Ressources",
  GD10: "Ressources",
  XPD10: "Ressources",
  CSD10: "Ressources",
  GD15: "Ressources",
  XPD15: "Ressources",
  CSD15: "Ressources",
  "CS%P15": "Ressources",
  "D%P15": "Ressources",
  CSPM: "Ressources",
  CSM: "Ressources",
  DPM: "Ressources",
  "DMG%": "Ressources",
  TDPG: "Ressources",
  EGPM: "Ressources",
  GPM: "Ressources",
  "GOLD%": "Ressources",
  "Avg kills": "Ressources",
  "Avg deaths": "Ressources",
  "Avg assists": "Ressources",
  "Penta Kills": "Ressources",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Fight: Swords,
  Vision: Eye,
  Ressources: Coins,
};

interface PercentileBarProps {
  label: string;
  result: PercentileResult;
}

const PercentileBar = memo(function PercentileBar({ label, result }: PercentileBarProps) {
  const width = `${result.percentile}%`;
  const color = TIER_COLORS[result.tier];

  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-subtle uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted tabular-nums">
            #{result.rank}/{result.total}
          </span>
          <span
            className="text-xs font-bold px-2 py-1 rounded tabular-nums"
            style={{ color, backgroundColor: `${color}15` }}
          >
            {result.percentile}
          </span>
          <span
            className="text-xs font-bold px-1 py-1 rounded"
            style={{ color, backgroundColor: `${color}15` }}
          >
            {result.tier}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width, backgroundColor: color }}
        />
      </div>
    </div>
  );
});

interface RolePercentilesProps {
  playerId: string;
}

function RolePercentiles({ playerId }: RolePercentilesProps) {
  const [data, setData] = useState<PercentilesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState<"league" | "tier">("league");

  useEffect(() => {
    async function fetchPercentiles() {
      setLoading(true);
      try {
        const res = await fetch(`/api/players/${playerId}/percentiles?comparison=${comparisonMode}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError("Failed to load percentiles");
      } finally {
        setLoading(false);
      }
    }

    fetchPercentiles();
  }, [playerId, comparisonMode]);

  const handleLeagueMode = useCallback(() => setComparisonMode("league"), []);
  const handleTierMode = useCallback(() => setComparisonMode("tier"), []);

  const categories = useMemo(() => {
    if (!data) return {};

    const cats: Record<string, { key: string; label: string; result: PercentileResult }[]> = {
      Fight: [],
      Vision: [],
      Ressources: [],
    };

    for (const [key, result] of Object.entries(data.percentiles)) {
      if (!result) continue;
      const cat = CATEGORY_MAP[key] || "Other";
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push({ key, label: key, result });
    }

    return cats;
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-sm text-text-muted">
        {error || "No percentile data available"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ScoutIcon icon={BarChart3} size="sm" variant="muted" />
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Percentiles — {data.player.role}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Comparison toggle */}
          <div className="flex items-center bg-card rounded-lg border border-border overflow-hidden">
            <button
              onClick={handleLeagueMode}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors ${
                comparisonMode === "league"
                  ? "bg-border text-text-heading"
                  : "text-text-muted hover:text-text-subtle"
              }`}
            >
              <ScoutIcon icon={Trophy} size="xs" variant="muted" />
              League
            </button>
            <button
              onClick={handleTierMode}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors ${
                comparisonMode === "tier"
                  ? "bg-border text-text-heading"
                  : "text-text-muted hover:text-text-subtle"
              }`}
            >
              <ScoutIcon icon={Users} size="xs" variant="muted" />
              Tier
            </button>
          </div>
          <span className="text-xs text-text-muted">
            vs {data.sampleSize} {data.player.role.toLowerCase()}s in{" "}
            {data.comparisonMode === "tier" ? data.player.tier || "same tier" : data.player.league}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(TIER_COLORS).map(([tier, color]) => (
          <div key={tier} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-text-muted">
              {tier} ({TIER_LABELS[tier as keyof typeof TIER_LABELS]})
            </span>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(categories).map(([category, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={category} className="rounded-lg border border-border overflow-hidden">
              <div
                className="px-3 py-2 border-b border-border flex items-center gap-2"
                style={{ backgroundColor: "#141621" }}
              >
                {(() => {
                  const Icon = CATEGORY_ICONS[category];
                  return Icon ? <Icon className="h-3.5 w-3.5 text-text-muted" /> : null;
                })()}
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  {category}
                </span>
              </div>
              <div className="bg-surface-elevated p-3 space-y-1">
                {items.map(({ key, label, result }) => (
                  <PercentileBar key={key} label={label} result={result} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(RolePercentiles);
