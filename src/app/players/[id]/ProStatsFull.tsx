"use client";

import { TrendingUp, Eye, Trophy, Swords, Clock, Target, Coins, EyeIcon, BarChart3, Activity } from "lucide-react";
import { RANK_COLORS } from "@/lib/constants";
import { getTierFromLeague, type TierLevel } from "@/lib/scoring";

interface FullProStats {
  // Scores
  rawScore: number | null;
  globalScore: number | null;
  tierScore: number | null;
  tier: string | null;
  // Identification
  gamesPlayed: number | null;
  season: string | null;
  split: string | null;
  // Combat
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
  // Counter
  ctrPercent: number | null;
  // Early
  gdAt10: number | null;
  xpdAt10: number | null;
  csdAt10: number | null;
  gdAt15: number | null;
  xpdAt15: number | null;
  csdAt15: number | null;
  // Farming
  cspm: number | null;
  csm: number | null;
  csPercentAt15: number | null;
  // Damage
  dpm: number | null;
  damagePercent: number | null;
  dPercentAt15: number | null;
  tdpg: number | null;
  // Economy
  egpm: number | null;
  gpm: number | null;
  goldPercent: number | null;
  // Vision
  wpm: number | null;
  cwpm: number | null;
  wcpm: number | null;
  vwpm: number | null;
  vsPercent: number | null;
  vspm: number | null;
  // Objectives
  stl: number | null;
  // Averages
  avgKills: number | null;
  avgDeaths: number | null;
  avgAssists: number | null;
  avgWpm: number | null;
  avgWcpm: number | null;
  avgVwpm: number | null;
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
  TIER_4: "text-gray-400",
};

const TIER_LABELS: Record<TierLevel, string> = {
  TIER_1: "Tier 1 — Major",
  TIER_2: "Tier 2 — Premier",
  TIER_3: "Tier 3 — ERL Major",
  TIER_4: "Tier 4 — ERL Minor",
};

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

function ScoreCard({ label, score, color }: { label: string; score: number | null; color: string }) {
  if (score === null) return null;
  return (
    <div className="flex flex-col items-center p-3 bg-muted rounded-lg border border-border">
      <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-2xl font-bold ${color} tabular-nums`}>{score}</span>
      <span className="text-xs text-muted-foreground">/ 100</span>
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string | null; highlight?: boolean }) {
  if (value === null) return null;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? "text-primary" : "text-foreground"} tabular-nums`}>{value}</span>
    </div>
  );
}

function StatSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-2 bg-muted px-3 py-2 border-b border-border">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
      </div>
      <div className="bg-card p-3">
        {children}
      </div>
    </div>
  );
}

export default function ProStatsFull({ playerId, role, league, proStats }: ProStatsFullProps) {
  if (!proStats) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No pro stats available.
      </div>
    );
  }

  const tier = (proStats.tier || getTierFromLeague(league)) as TierLevel;
  const tierColor = TIER_COLORS[tier] || "text-muted-foreground";
  const tierLabel = TIER_LABELS[tier] || tier;

  return (
    <div className="space-y-4">
      {/* Scores Header */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreCard
          label="Score Global"
          score={proStats.globalScore}
          color="text-primary"
        />
        <ScoreCard
          label={`Score ${tierLabel}`}
          score={proStats.tierScore}
          color={tierColor}
        />
      </div>

      {/* Tier Badge */}
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="text-xs text-muted-foreground">Ligue:</span>
        <span className="text-xs font-semibold text-foreground">{league}</span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-xs text-muted-foreground">Tier:</span>
        <span className={`text-xs font-semibold ${tierColor}`}>{tierLabel}</span>
        {proStats.gamesPlayed && (
          <>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground tabular-nums">{proStats.gamesPlayed} games</span>
          </>
        )}
      </div>

      {/* Combat Stats */}
      <StatSection title="Combat" icon={Swords}>
        <StatRow label="KDA" value={formatNumber(proStats.kda, 2)} highlight />
        <StatRow label="Kills" value={formatNumber(proStats.k, 1)} />
        <StatRow label="Deaths" value={formatNumber(proStats.d, 1)} />
        <StatRow label="Assists" value={formatNumber(proStats.a, 1)} />
        <StatRow label="KP%" value={formatPercent(proStats.kpPercent)} />
        <StatRow label="KS%" value={formatPercent(proStats.ksPercent)} />
        <StatRow label="DTH%" value={formatPercent(proStats.dthPercent)} />
        <StatRow label="FB%" value={formatPercent(proStats.fbPercent)} />
        <StatRow label="FB Victim" value={formatPercent(proStats.fbVictim)} />
        <StatRow label="Solo Kills" value={formatNumber(proStats.soloKills, 1)} />
        <StatRow label="Penta Kills" value={formatNumber(proStats.pentaKills, 0)} />
        <StatRow label="CTR%" value={formatPercent(proStats.ctrPercent)} />
      </StatSection>

      {/* Early Game */}
      <StatSection title="Early Game" icon={Clock}>
        <StatRow label="GD@10" value={formatSigned(proStats.gdAt10)} />
        <StatRow label="XPD@10" value={formatSigned(proStats.xpdAt10)} />
        <StatRow label="CSD@10" value={formatSigned(proStats.csdAt10)} />
        <StatRow label="GD@15" value={formatSigned(proStats.gdAt15)} />
        <StatRow label="XPD@15" value={formatSigned(proStats.xpdAt15)} />
        <StatRow label="CSD@15" value={formatSigned(proStats.csdAt15)} />
        <StatRow label="D%@15" value={formatPercent(proStats.dPercentAt15)} />
        <StatRow label="CS%@15" value={formatPercent(proStats.csPercentAt15)} />
      </StatSection>

      {/* Farming */}
      <StatSection title="Farming" icon={Target}>
        <StatRow label="CSPM" value={formatNumber(proStats.cspm, 1)} />
        <StatRow label="CSM" value={formatNumber(proStats.csm, 1)} />
        <StatRow label="CS%@15" value={formatPercent(proStats.csPercentAt15)} />
      </StatSection>

      {/* Damage */}
      <StatSection title="Damage" icon={Swords}>
        <StatRow label="DPM" value={formatNumber(proStats.dpm, 0)} />
        <StatRow label="DMG%" value={formatPercent(proStats.damagePercent)} />
        <StatRow label="D%@15" value={formatPercent(proStats.dPercentAt15)} />
        <StatRow label="TDPG" value={formatNumber(proStats.tdpg, 1)} />
      </StatSection>

      {/* Economy */}
      <StatSection title="Economy" icon={Coins}>
        <StatRow label="EGPM" value={formatNumber(proStats.egpm, 0)} />
        <StatRow label="GPM" value={formatNumber(proStats.gpm, 0)} />
        <StatRow label="GOLD%" value={formatPercent(proStats.goldPercent)} />
      </StatSection>

      {/* Vision */}
      <StatSection title="Vision" icon={EyeIcon}>
        <StatRow label="WPM" value={formatNumber(proStats.wpm, 2)} />
        <StatRow label="CWPM" value={formatNumber(proStats.cwpm, 2)} />
        <StatRow label="WCPM" value={formatNumber(proStats.wcpm, 2)} />
        <StatRow label="VWPM" value={formatNumber(proStats.vwpm, 2)} />
        <StatRow label="VS%" value={formatPercent(proStats.vsPercent)} />
        <StatRow label="VSPM" value={formatNumber(proStats.vspm, 2)} />
      </StatSection>

      {/* Averages */}
      <StatSection title="Averages" icon={BarChart3}>
        <StatRow label="Avg Kills" value={formatNumber(proStats.avgKills, 1)} />
        <StatRow label="Avg Deaths" value={formatNumber(proStats.avgDeaths, 1)} />
        <StatRow label="Avg Assists" value={formatNumber(proStats.avgAssists, 1)} />
        <StatRow label="Avg WPM" value={formatNumber(proStats.avgWpm, 2)} />
        <StatRow label="Avg WCPM" value={formatNumber(proStats.avgWcpm, 2)} />
        <StatRow label="Avg VWPM" value={formatNumber(proStats.avgVwpm, 2)} />
      </StatSection>

      {/* Objectives */}
      <StatSection title="Objectives" icon={Trophy}>
        <StatRow label="Steals" value={formatNumber(proStats.stl, 1)} />
      </StatSection>
    </div>
  );
}
