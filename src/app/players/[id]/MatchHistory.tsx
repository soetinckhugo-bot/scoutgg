"use client";

import { useState, useEffect } from "react";
import { Loader2, Swords, Clock, Filter } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { getChampionIconUrl } from "@/lib/game-assets";

interface Match {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  championName: string;
  teamPosition: string;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  win: boolean;
  cs: number;
  cspm: number;
  goldEarned: number;
  gpm: number;
  damageDealt: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDateShort(timestamp: number): string {
  const d = new Date(timestamp);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

function kdaColor(kda: number): string {
  if (kda >= 5) return "text-yellow-400";
  if (kda >= 3) return "text-emerald-400";
  if (kda >= 1.5) return "text-blue-400";
  return "text-red-400";
}

export default function MatchHistory({ playerId }: { playerId: string }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "win" | "loss">("all");

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch(`/api/players/${playerId}/matches`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load matches");
          return;
        }
        setMatches(data.matches || []);
      } catch (err) {
        setError("Failed to load match history");
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [playerId]);

  const filtered = matches.filter((m) => {
    if (filter === "win") return m.win;
    if (filter === "loss") return !m.win;
    return true;
  });

  const wins = matches.filter((m) => m.win).length;
  const avgKda = matches.length > 0 ? matches.reduce((sum, m) => sum + m.kda, 0) / matches.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#E94560]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Swords className="h-10 w-10 text-[#E9ECEF] dark:text-gray-700 mx-auto mb-2" />
        <p className="text-sm text-[#6C757D] dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8">
        <Swords className="h-10 w-10 text-[#E9ECEF] dark:text-gray-700 mx-auto mb-2" />
        <p className="text-sm text-[#6C757D] dark:text-gray-400">
          No recent ranked matches found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-[#1A1D29] border border-[#2A2D3A] rounded-lg px-3 py-1.5">
          <span className="text-sm font-bold text-[#E9ECEF] tabular-nums">
            {wins}W — {matches.length - wins}L
          </span>
          <span className="text-xs text-[#6C757D] tabular-nums">
            ({Math.round((wins / matches.length) * 100)}% WR)
          </span>
          <span className="text-xs text-[#6C757D] ml-2">
            Avg KDA: <span className={`${kdaColor(avgKda)} tabular-nums`}>{avgKda.toFixed(2)}</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {(["all", "win", "loss"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === f
                  ? f === "win"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : f === "loss"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30"
                  : "bg-[#1A1D29] text-[#6C757D] border border-[#2A2D3A] hover:text-[#E9ECEF]"
              }`}
            >
              {f === "all" ? "All" : f === "win" ? "Wins" : "Losses"}
            </button>
          ))}
        </div>
      </div>

      {/* Matches table — same style as ProMatches */}
      <div className="overflow-x-auto rounded-lg border border-[#2A2D3A]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#141621] text-[#6C757D] text-xs uppercase tracking-wider border-b border-[#2A2D3A]">
              <th className="text-left py-2 px-2 font-semibold">Champion</th>
              <th className="text-left py-2 px-2 font-semibold">Result</th>
              <th className="text-left py-2 px-2 font-semibold">Duration</th>
              <th className="text-left py-2 px-2 font-semibold">KDA</th>
              <th className="text-left py-2 px-2 font-semibold">CSM</th>
              <th className="text-left py-2 px-2 font-semibold">Gold</th>
              <th className="text-left py-2 px-2 font-semibold">DMG</th>
              <th className="text-left py-2 px-2 font-semibold">Vision</th>
              <th className="text-left py-2 px-2 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((match) => {
              const kdaValue = match.kda;

              return (
                <tr
                  key={match.matchId}
                  className="bg-[#1A1F2E] hover:bg-[#1E2435] transition-colors border-b border-[#232838] last:border-b-0"
                >
                  {/* Champion */}
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 ring-1 ring-[#2A2D3A]">
                        <Image
                          src={getChampionIconUrl(match.championName)}
                          alt={match.championName}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                      <span className="font-semibold text-[#E9ECEF] text-xs whitespace-nowrap">
                        {match.championName}
                      </span>
                    </div>
                  </td>

                  {/* Result */}
                  <td className="py-2 px-2">
                    <span className={`font-bold text-xs ${match.win ? "text-emerald-400" : "text-red-400"}`}>
                      {match.win ? "Victory" : "Defeat"}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <div className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 text-[#6C757D]" />
                      {formatDuration(match.gameDuration)}
                    </div>
                  </td>

                  {/* KDA */}
                  <td className="py-2 px-2">
                    <span className={`font-mono font-bold text-xs ${kdaColor(kdaValue)} tabular-nums`}>
                      {match.kills}/{match.deaths}/{match.assists}
                    </span>
                    <span className="text-xs text-[#6C757D] ml-1 tabular-nums">
                      {kdaValue.toFixed(1)}
                    </span>
                  </td>

                  {/* CSM */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium tabular-nums">{match.cs}</span>
                      <span className="text-xs text-[#6C757D] tabular-nums">{match.cspm.toFixed(1)}/m</span>
                    </div>
                  </td>

                  {/* Gold */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium tabular-nums">{(match.goldEarned / 1000).toFixed(1)}k</span>
                      <span className="text-xs text-[#6C757D] tabular-nums">{match.gpm.toFixed(0)}/m</span>
                    </div>
                  </td>

                  {/* DMG */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <span className="font-medium tabular-nums">{(match.damageDealt / 1000).toFixed(1)}k</span>
                  </td>

                  {/* Vision */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <span className="font-medium tabular-nums">{match.visionScore}</span>
                  </td>

                  {/* Date */}
                  <td className="py-2 px-2 text-[#ADB5BD] whitespace-nowrap">
                    {formatDateShort(match.gameCreation)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
