"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { getTierFromLeague, type TierLevel } from "@/lib/scoring";

interface FullProStats {
  gamesPlayed: number | null;
  season: string | null;
  split: string | null;
  k: number | null;
  d: number | null;
  a: number | null;
  kda: number | null;
  kpPercent: number | null;
  ksPercent: number | null;
  dthPercent: number | null;
  fbPercent: number | null;
  fbVictim: number | null;
  soloKills: number | null;
  pentaKills: number | null;
  ctrPercent: number | null;
  gdAt10: number | null;
  xpdAt10: number | null;
  csdAt10: number | null;
  gdAt15: number | null;
  xpdAt15: number | null;
  csdAt15: number | null;
  cspm: number | null;
  csm: number | null;
  csPercentAt15: number | null;
  dpm: number | null;
  damagePercent: number | null;
  dPercentAt15: number | null;
  tdpg: number | null;
  egpm: number | null;
  gpm: number | null;
  goldPercent: number | null;
  wpm: number | null;
  cwpm: number | null;
  wcpm: number | null;
  vwpm: number | null;
  vsPercent: number | null;
  vspm: number | null;
  stl: number | null;
  avgKills: number | null;
  avgDeaths: number | null;
  avgAssists: number | null;
  avgWpm: number | null;
  avgWcpm: number | null;
  avgVwpm: number | null;
  winRate: number | null;
  rawScore: number | null;
  globalScore: number | null;
  tierScore: number | null;
  tier: string | null;
}

interface ProStatsFullProps {
  playerId: string;
  role: string;
  league: string;
  proStats: FullProStats | null;
}

const TIER_COLORS: Record<TierLevel, string> = {
  TIER_1: "text-yellow-400",
  TIER_2: "text-orange-400",
  TIER_3: "text-blue-400",
  TIER_4: "text-text-body",
};

const TIER_LABELS: Record<TierLevel, string> = {
  TIER_1: "Tier 1 — Major",
  TIER_2: "Tier 2 — Premier",
  TIER_3: "Tier 3 — ERL Major",
  TIER_4: "Tier 4 — ERL Minor",
};

// Percentile-based color system
function getScoreColor(value: number) {
  if (value >= 90) return { text: "text-blue-400", bg: "bg-blue-500", stroke: "#60A5FA", glow: "shadow-blue-500/20" };
  if (value >= 75) return { text: "text-green-400", bg: "bg-green-500", stroke: "#4ADE80", glow: "shadow-green-500/20" };
  if (value >= 60) return { text: "text-yellow-400", bg: "bg-yellow-500", stroke: "#FACC15", glow: "shadow-yellow-500/20" };
  if (value >= 50) return { text: "text-orange-400", bg: "bg-orange-500", stroke: "#FB923C", glow: "shadow-orange-500/20" };
  return { text: "text-red-400", bg: "bg-red-500", stroke: "#F87171", glow: "shadow-red-500/20" };
}

function formatNumber(val: number | null, decimals = 1): string | null {
  if (val === null || val === undefined) return null;
  return val.toFixed(decimals);
}

function formatPercent(val: number | null): string | null {
  if (val === null || val === undefined) return null;
  return `${(val * 100).toFixed(1)}%`;
}

function formatSigned(val: number | null): string | null {
  if (val === null || val === undefined) return null;
  return `${val > 0 ? "+" : ""}${val.toFixed(0)}`;
}

/* ---------- Modern Score Card ---------- */
function ScoreCard({
  label,
  score,
  sublabel,
}: {
  label: string;
  score: number | null;
  sublabel?: string;
}) {
  if (score === null) return null;

  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 26;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-3">
      <span className="text-[10px] text-text-muted uppercase tracking-widest mb-2 font-semibold">
        {label}
      </span>
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="26" fill="none" stroke="#1A1A2E" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="26"
            fill="none"
            stroke={colors.stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-bold ${colors.text} tabular-nums tracking-tight`}>
            {score.toFixed(1)}
          </span>
          <span className="text-[10px] text-text-muted mt-0.5">/ 100</span>
        </div>
      </div>
      {sublabel && (
        <span className={`text-[10px] mt-2 font-medium ${colors.text} uppercase tracking-wider`}>
          {sublabel}
        </span>
      )}
    </div>
  );
}

/* ---------- Stat Row ---------- */
function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
      <span className="text-xs text-text-body">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-text-heading" : "text-text-heading"} tabular-nums`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

/* ---------- Stat Section ---------- */
function StatSection({
  title,
  accentColor,
  children,
}: {
  title: string;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-surface-elevated/50">
      <div
        className="px-3 py-2 border-b border-border/50 text-center"
        style={{ backgroundColor: `${accentColor}08` }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: accentColor }}
        >
          {title}
        </span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/* ---------- Split Selector ---------- */
function SplitSelector({
  playerId,
  currentSeason,
  currentSplit,
  onSelect,
}: {
  playerId: string;
  currentSeason: string | null;
  currentSplit: string | null;
  onSelect: (season: string, split: string | null, isAll: boolean) => void;
}) {
  const [splits, setSplits] = useState<{ season: string; split: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/players/${playerId}/prostats/splits`)
      .then((r) => r.json())
      .then((data) => {
        setSplits(data.splits || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [playerId]);

  const seasons = Array.from(new Set(splits.map((s) => s.season)));

  const handleSelect = (season: string, split: string | null, isAll: boolean) => {
    onSelect(season, split, isAll);
    setOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading splits...
      </div>
    );
  }

  if (splits.length === 0) {
    return (
      <span className="text-xs text-text-muted">
        {currentSeason} {currentSplit ? `• ${currentSplit}` : ""}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-heading hover:border-border-hover transition-colors"
      >
        {currentSeason} {currentSplit ? `• ${currentSplit}` : ""}
        <ChevronDown className="h-3 w-3 text-text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-56 bg-surface-hover border border-border rounded-lg shadow-xl z-20 py-1 max-h-64 overflow-y-auto overflow-hidden">
            {seasons.map((season) => (
              <div key={season}>
                <button
                  onClick={() => handleSelect(season, null, true)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-text-heading hover:bg-border transition-colors flex items-center justify-between"
                >
                  <span>{season} — ALL</span>
                  {currentSeason === season && !currentSplit && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-accent" />
                  )}
                </button>
                {splits
                  .filter((s) => s.season === season)
                  .map((s) => (
                    <button
                      key={`${s.season}-${s.split}`}
                      onClick={() => handleSelect(s.season, s.split, false)}
                      className="w-full text-left px-5 py-1.5 text-xs text-text-body hover:bg-border hover:text-text-heading transition-colors flex items-center justify-between"
                    >
                      <span>• {s.split}</span>
                      {currentSeason === s.season && currentSplit === s.split && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-accent" />
                      )}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function ProStatsFull({
  playerId,
  role,
  league,
  proStats,
}: ProStatsFullProps) {
  const [displayStats, setDisplayStats] = useState<FullProStats | null>(proStats);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(proStats?.season || null);
  const [selectedSplit, setSelectedSplit] = useState<string | null>(proStats?.split || null);
  const [isAll, setIsAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const tier = (displayStats?.tier || getTierFromLeague(league)) as TierLevel;
  const tierColor = TIER_COLORS[tier] || "text-text-muted";
  const tierLabel = TIER_LABELS[tier] || tier;

  const handleSelectSplit = useCallback(
    async (season: string, split: string | null, all: boolean) => {
      setSelectedSeason(season);
      setSelectedSplit(split);
      setIsAll(all);
      setLoading(true);

      try {
        if (all) {
          const res = await fetch(`/api/players/${playerId}/prostats/all?year=${season}`);
          if (res.ok) {
            const data = await res.json();
            setDisplayStats(data);
          }
        } else if (split) {
          const res = await fetch(`/api/players/${playerId}/prostats?season=${season}&split=${split}`);
          if (res.ok) {
            const data = await res.json();
            setDisplayStats(data);
          }
        }
      } catch (err) {
        console.error("Failed to load split stats:", err);
      } finally {
        setLoading(false);
      }
    },
    [playerId]
  );

  // Reset when parent passes new proStats
  useEffect(() => {
    setDisplayStats(proStats);
    setSelectedSeason(proStats?.season || null);
    setSelectedSplit(proStats?.split || null);
    setIsAll(false);
  }, [proStats]);

  if (!displayStats) {
    return (
      <div className="py-12 text-center text-sm text-text-muted">
        No pro stats available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Split Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SplitSelector
          playerId={playerId}
          currentSeason={selectedSeason}
          currentSplit={isAll ? null : selectedSplit}
          onSelect={handleSelectSplit}
        />
        {displayStats.gamesPlayed && (
          <span className="text-xs text-text-muted tabular-nums">
            {isAll ? "Total" : ""} {displayStats.gamesPlayed} games
          </span>
        )}
      </div>

      {/* Compact scores + meta */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Global</span>
            <p className={`text-lg font-bold tabular-nums ${displayStats.globalScore != null ? getScoreColor(displayStats.globalScore).text : "text-text-muted"}`}>
              {displayStats.globalScore?.toFixed(1) ?? "—"}
            </p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">{tierLabel}</span>
            <p className={`text-lg font-bold tabular-nums ${displayStats.tierScore != null ? getScoreColor(displayStats.tierScore).text : "text-text-muted"}`}>
              {displayStats.tierScore?.toFixed(1) ?? "—"}
            </p>
          </div>
        </div>
        <span className="text-xs text-text-muted">{league} · {tierLabel}</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      )}

      {/* 3 Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FIGHT */}
        <StatSection title="Fight" accentColor="#FF2D55">
          <StatRow label="KDA" value={formatNumber(displayStats.kda, 1)} highlight />
          <StatRow label="K" value={formatNumber(displayStats.k, 1)} />
          <StatRow label="D" value={formatNumber(displayStats.d, 1)} />
          <StatRow label="A" value={formatNumber(displayStats.a, 1)} />
          <StatRow label="KP%" value={formatPercent(displayStats.kpPercent)} />
          <StatRow label="KS%" value={formatPercent(displayStats.ksPercent)} />
          <StatRow label="DTH%" value={formatPercent(displayStats.dthPercent)} />
          <StatRow label="FB%" value={formatPercent(displayStats.fbPercent)} />
          <StatRow label="FB Victim" value={formatPercent(displayStats.fbVictim)} />
          <StatRow label="Solo Kills" value={formatNumber(displayStats.soloKills, 1)} />
          <StatRow label="Penta Kills" value={formatNumber(displayStats.pentaKills, 0)} />
          <StatRow label="CTR%" value={formatPercent(displayStats.ctrPercent)} />
          <StatRow label="STL" value={formatNumber(displayStats.stl, 1)} />
        </StatSection>

        {/* VISION */}
        <StatSection title="Vision" accentColor="#0A84FF">
          <StatRow label="WPM" value={formatNumber(displayStats.wpm, 1)} />
          <StatRow label="CWPM" value={formatNumber(displayStats.cwpm, 1)} />
          <StatRow label="WCPM" value={formatNumber(displayStats.wcpm, 1)} />
          <StatRow label="VWPM" value={formatNumber(displayStats.vwpm, 1)} />
          <StatRow label="VS%" value={formatPercent(displayStats.vsPercent)} />
          <StatRow label="VSPM" value={formatNumber(displayStats.vspm, 1)} />
          <StatRow label="Avg WPM" value={formatNumber(displayStats.avgWpm, 1)} />
          <StatRow label="Avg WCPM" value={formatNumber(displayStats.avgWcpm, 1)} />
          <StatRow label="Avg VWPM" value={formatNumber(displayStats.avgVwpm, 1)} />
        </StatSection>

        {/* RESSOURCES */}
        <StatSection title="Ressources" accentColor="#30D158">
          <StatRow label="W%" value={formatPercent(displayStats.winRate)} />
          <StatRow label="Games" value={formatNumber(displayStats.gamesPlayed, 0)} />
          <StatRow label="CSPM" value={formatNumber(displayStats.cspm, 1)} />
          <StatRow label="CSM" value={formatNumber(displayStats.csm, 1)} />
          <StatRow label="CS%@15" value={formatPercent(displayStats.csPercentAt15)} />
          <StatRow label="DPM" value={formatNumber(displayStats.dpm, 1)} />
          <StatRow label="DMG%" value={formatPercent(displayStats.damagePercent)} />
          <StatRow label="D%@15" value={formatPercent(displayStats.dPercentAt15)} />
          <StatRow label="TDPG" value={formatNumber(displayStats.tdpg, 1)} />
          <StatRow label="EGPM" value={formatNumber(displayStats.egpm, 1)} />
          <StatRow label="GPM" value={formatNumber(displayStats.gpm, 1)} />
          <StatRow label="GOLD%" value={formatPercent(displayStats.goldPercent)} />
          <StatRow label="GD@10" value={formatSigned(displayStats.gdAt10)} />
          <StatRow label="XPD@10" value={formatSigned(displayStats.xpdAt10)} />
          <StatRow label="CSD@10" value={formatSigned(displayStats.csdAt10)} />
          <StatRow label="GD@15" value={formatSigned(displayStats.gdAt15)} />
          <StatRow label="XPD@15" value={formatSigned(displayStats.xpdAt15)} />
          <StatRow label="CSD@15" value={formatSigned(displayStats.csdAt15)} />
        </StatSection>
      </div>
    </div>
  );
}
