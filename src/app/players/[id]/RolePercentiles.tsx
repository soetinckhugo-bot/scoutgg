"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { BarChart3, Loader2, Users, Trophy } from "lucide-react";

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

const TIER_COLORS = {
  S: "#F59E0B",
  A: "#EAB308",
  B: "#F97316",
  C: "#EF4444",
  D: "#6B7280",
};

const TIER_LABELS = {
  S: "Elite",
  A: "Excellent",
  B: "Good",
  C: "Average",
  D: "Weak",
};

const CATEGORY_MAP: Record<string, string> = {
  Games: "General", "W%": "General", "Penta Kills": "General",
  KDA: "Combat", KP: "Combat", "KS%": "Combat", "DTH%": "Combat",
  "FB%": "Combat", "FB Victim": "Combat", "Solo Kills": "Combat",
  K: "Combat", D: "Combat", A: "Combat", STL: "Combat", "CTR%": "Combat",
  GD10: "Early Game", XPD10: "Early Game", CSD10: "Early Game",
  GD15: "Early Game", XPD15: "Early Game", CSD15: "Early Game",
  "CS%P15": "Early Game", "D%P15": "Early Game",
  CSPM: "Farming", CSM: "Farming",
  DPM: "Damage", "DMG%": "Damage", TDPG: "Damage",
  EGPM: "Economy", GPM: "Economy", "GOLD%": "Economy",
  WPM: "Vision", CWPM: "Vision", WCPM: "Vision", VWPM: "Vision",
  "VS%": "Vision", VSPM: "Vision",
  "Avg kills": "Averages", "Avg deaths": "Averages", "Avg assists": "Averages",
  "Avg WPM": "Averages", "Avg WCPM": "Averages", "Avg VWPM": "Averages",
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
        <span className="text-xs text-[#ADB5BD] uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6C757D] tabular-nums">
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
      <div className="h-1.5 bg-[#232838] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
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
      General: [],
      Combat: [],
      "Early Game": [],
      Farming: [],
      Damage: [],
      Economy: [],
      Vision: [],
      Averages: [],
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
        <Loader2 className="h-6 w-6 animate-spin text-[#6C757D]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-sm text-[#6C757D]">
        {error || "No percentile data available"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-[#6C757D]" />
          <span className="text-xs font-semibold text-[#6C757D] uppercase tracking-wider">
            Percentiles — {data.player.role}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Comparison toggle */}
          <div className="flex items-center bg-[#141621] rounded-lg border border-[#2A2D3A] overflow-hidden">
            <button
              onClick={handleLeagueMode}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors ${
                comparisonMode === "league"
                  ? "bg-[#2A2D3A] text-white"
                  : "text-[#6C757D] hover:text-[#ADB5BD]"
              }`}
            >
              <Trophy className="h-3 w-3" />
              League
            </button>
            <button
              onClick={handleTierMode}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors ${
                comparisonMode === "tier"
                  ? "bg-[#2A2D3A] text-white"
                  : "text-[#6C757D] hover:text-[#ADB5BD]"
              }`}
            >
              <Users className="h-3 w-3" />
              Tier
            </button>
          </div>
          <span className="text-xs text-[#6C757D]">
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
            <span className="text-xs text-[#6C757D]">
              {tier} ({TIER_LABELS[tier as keyof typeof TIER_LABELS]})
            </span>
          </div>
        ))}
      </div>

      {/* Categories */}
      {Object.entries(categories).map(([category, items]) => {
        if (items.length === 0) return null;
        return (
          <div key={category} className="rounded-lg border border-[#2A2D3A] overflow-hidden">
            <div className="bg-[#141621] px-3 py-2 border-b border-[#2A2D3A]">
              <span className="text-xs font-semibold text-[#6C757D] uppercase tracking-wider">
                {category}
              </span>
            </div>
            <div className="bg-[#1A1F2E] p-3 space-y-1">
              {items.map(({ key, label, result }) => (
                <PercentileBar key={key} label={label} result={result} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(RolePercentiles);
