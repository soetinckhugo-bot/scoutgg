"use client";

import { TrendingUp, Eye, Trophy } from "lucide-react";
import { RANK_COLORS } from "@/lib/constants";
import SyncStatsButton from "./SyncStatsButton";
import RoleRadarChart from "@/components/charts/RoleRadarChart";
import AdcRadarChart from "@/components/charts/AdcRadarChart";

interface SoloqStats {
  currentRank: string;
  peakLp: number;
  winrate: number;
  totalGames: number;
  lastUpdated: Date;
}

interface ProStats {
  kda: number | null;
  csdAt15: number | null;
  gdAt15: number | null;
  xpdAt15: number | null;
  cspm: number | null;
  gpm: number | null;
  dpm: number | null;
  kpPercent: number | null;
  visionScore: number | null;
  wpm: number | null;
  wcpm: number | null;
  fbParticipation: number | null;
  fbVictim: number | null;
  deathsUnder15: number | null;
  damagePercent: number | null;
  goldPercent: number | null;
  soloKills: number | null;
  proximityJungle: number | null;
  gamesPlayed: number | null;
}

interface PlayerStatsProps {
  playerId: string;
  role: string;
  soloqStats: SoloqStats | null;
  proStats: ProStats | null;
}

function getRankColorClass(rankStr: string | null): string {
  if (!rankStr) return "text-[#E9ECEF]";
  const tier = rankStr.split(" ")[0].toUpperCase();
  return RANK_COLORS[tier] || "text-[#E9ECEF]";
}

export default function PlayerStats({ playerId, role, soloqStats, proStats }: PlayerStatsProps) {
  const proStatsRows = [
    { label: "KDA", value: proStats?.kda?.toFixed(1) },
    { label: "CSD@15", value: proStats?.csdAt15 !== null ? `${proStats!.csdAt15! > 0 ? "+" : ""}${proStats!.csdAt15}` : null },
    { label: "GD@15", value: proStats?.gdAt15 !== null ? `${proStats!.gdAt15! > 0 ? "+" : ""}${proStats!.gdAt15}` : null },
    { label: "XPD@15", value: proStats?.xpdAt15 !== null ? `${proStats!.xpdAt15! > 0 ? "+" : ""}${proStats!.xpdAt15}` : null },
    { label: "CS/m", value: proStats?.cspm?.toFixed(1) },
    { label: "DMG/m", value: proStats?.dpm?.toFixed(0) },
    { label: "KP%", value: proStats?.kpPercent !== null ? `${(proStats!.kpPercent! * 100).toFixed(1)}%` : null },
    { label: "DMG%", value: proStats?.damagePercent !== null ? `${(proStats!.damagePercent! * 100).toFixed(1)}%` : null },
    { label: "GOLD%", value: proStats?.goldPercent !== null ? `${(proStats!.goldPercent! * 100).toFixed(1)}%` : null },
    { label: "Vision", value: proStats?.visionScore?.toFixed(1) },
    { label: "WPM", value: proStats?.wpm?.toFixed(1) },
    { label: "WCPM", value: proStats?.wcpm?.toFixed(1) },
    { label: "FB Part", value: proStats?.fbParticipation !== null ? `${(proStats!.fbParticipation! * 100).toFixed(0)}%` : null },
    { label: "FB Victim", value: proStats?.fbVictim !== null ? `${(proStats!.fbVictim! * 100).toFixed(0)}%` : null },
    { label: "Deaths <15", value: proStats?.deathsUnder15?.toFixed(1) },
    { label: "Solo Kills", value: proStats?.soloKills?.toFixed(1) },
    { label: "Prox JG%", value: proStats?.proximityJungle !== null ? `${(proStats!.proximityJungle! * 100).toFixed(0)}%` : null },
  ].filter((r) => r.value !== null && r.value !== undefined) as { label: string; value: string }[];

  // Split pro stats into 2 columns
  const mid = Math.ceil(proStatsRows.length / 2);
  const leftRows = proStatsRows.slice(0, mid);
  const rightRows = proStatsRows.slice(mid);

  return (
    <div className="space-y-4">
      {/* SoloQ Stats — compact card style */}
      <div className="rounded-lg border border-[#2A2D3A] overflow-hidden">
        <div className="flex items-center justify-between bg-[#141621] px-3 py-2 border-b border-[#2A2D3A]">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-[#6C757D]" />
            <span className="text-xs font-semibold text-[#6C757D] uppercase tracking-wider">SoloQ Stats</span>
          </div>
          <SyncStatsButton playerId={playerId} />
        </div>
        {soloqStats ? (
          <div className="bg-[#1A1F2E] p-3">
            <div className="flex items-center gap-4 mb-3">
              <div>
                <div className={`text-lg font-bold ${getRankColorClass(soloqStats.currentRank)} tabular-nums`}>
                  {soloqStats.currentRank}
                </div>
                <div className="text-xs text-[#6C757D] tabular-nums">{soloqStats.peakLp} LP peak</div>
              </div>
              <div className="flex-1" />
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  soloqStats.winrate >= 0.60 ? "text-emerald-400" :
                  soloqStats.winrate >= 0.50 ? "text-blue-400" :
                  "text-red-400"
                } tabular-nums`}>
                  {(soloqStats.winrate * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-[#6C757D]">Winrate</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-[#E9ECEF] tabular-nums">{soloqStats.totalGames}</div>
                <div className="text-xs text-[#6C757D]">Games</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-[#6C757D]">
            No SoloQ stats available. Click Sync to fetch from Riot API.
          </div>
        )}
      </div>

      {/* Pro Stats — 2 columns compact */}
      <div className="rounded-lg border border-[#2A2D3A] overflow-hidden">
        <div className="flex items-center justify-between bg-[#141621] px-3 py-2 border-b border-[#2A2D3A]">
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-[#6C757D]" />
            <span className="text-xs font-semibold text-[#6C757D] uppercase tracking-wider">Pro Stats</span>
          </div>
          {proStats?.gamesPlayed && (
            <span className="text-xs text-[#6C757D] tabular-nums">{proStats.gamesPlayed} games</span>
          )}
        </div>
        {proStatsRows.length > 0 ? (
          <div className="bg-[#1A1F2E] p-3">
            <div className="grid grid-cols-2 gap-x-6">
              {/* Left column */}
              <div className="space-y-1">
                {leftRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1 border-b border-[#232838] last:border-b-0">
                    <span className="text-xs text-[#6C757D] uppercase">{row.label}</span>
                    <span className="text-xs font-semibold text-[#E9ECEF] tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>
              {/* Right column */}
              <div className="space-y-1">
                {rightRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1 border-b border-[#232838] last:border-b-0">
                    <span className="text-xs text-[#6C757D] uppercase">{row.label}</span>
                    <span className="text-xs font-semibold text-[#E9ECEF] tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-[#6C757D]">
            No pro stats available.
          </div>
        )}
      </div>

      {/* Radar Chart */}
      <div className="rounded-lg border border-[#2A2D3A] overflow-hidden">
        <div className="bg-[#141621] px-3 py-2 border-b border-[#2A2D3A]">
          <div className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-[#6C757D]" />
            <span className="text-xs font-semibold text-[#6C757D] uppercase tracking-wider">
              {role === "ADC" ? "ADC Comparison" : `Role Analysis — ${role}`}
            </span>
          </div>
        </div>
        <div className="bg-[#1A1F2E] p-4">
          {role === "ADC" ? (
            <AdcRadarChart playerId={playerId} />
          ) : (
            <RoleRadarChart role={role} proStats={proStats} />
          )}
        </div>
      </div>
    </div>
  );
}
