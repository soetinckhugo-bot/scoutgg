"use client";

import { useState } from "react";
import Image from "next/image";
import { Swords, Trophy, Clock, Filter } from "lucide-react";
import {
  getChampionIconUrl,
  getItemIconUrl,
  getKeystoneRuneIconUrl,
  getSecondaryRuneIconUrl,
} from "@/lib/game-assets";

interface ProMatch {
  id: string;
  matchDate: Date;
  champion: string;
  result: string;
  duration: string;
  kda: string;
  cs: number | null;
  cspm: number | null;
  gold: number | null;
  gpm: number | null;
  damage: number | null;
  dpm: number | null;
  damagePercent: number | null;
  kpPercent: number | null;
  visionScore: number | null;
  teamName: string;
  opponent: string;
  tournament: string;
  gameVersion: string | null;
  patch: string | null;
  items: string | null;
  summoner1: string | null;
  summoner2: string | null;
  keystoneRune: string | null;
  secondaryRune: string | null;
  side: string | null;
}

interface ProMatchHistoryProps {
  matches: ProMatch[];
}

function parseItems(itemsJson: string | null): string[] {
  if (!itemsJson) return [];
  try {
    const parsed = JSON.parse(itemsJson);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return itemsJson.split(",").map((s) => s.trim());
  }
  return [];
}

function formatDateShort(date: Date): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

function formatTournamentShort(name: string): string {
  // "Road Of Legends 2026 Spring Split" → "ROL 2026 SPRING"
  return name
    .replace(/Road Of Legends/gi, "ROL")
    .replace(/Spring Split/gi, "SPRING")
    .replace(/Summer Split/gi, "SUMMER")
    .replace(/Winter Split/gi, "WINTER");
}

function parseKda(kda: string): { k: number; d: number; a: number } {
  const parts = kda.split("/").map(Number);
  return { k: parts[0] || 0, d: parts[1] || 0, a: parts[2] || 0 };
}

function kdaColor(kda: number): string {
  if (kda >= 5) return "text-yellow-400";
  if (kda >= 3) return "text-emerald-400";
  if (kda >= 1.5) return "text-blue-400";
  return "text-red-400";
}

function isWin(result: string): boolean {
  return result === "WIN" || result === "win" || result === "Victory";
}

export default function ProMatchHistory({ matches }: ProMatchHistoryProps) {
  const [filter, setFilter] = useState<"all" | "win" | "loss">("all");

  const filtered = matches.filter((m) => {
    if (filter === "win") return isWin(m.result);
    if (filter === "loss") return !isWin(m.result);
    return true;
  });

  const wins = matches.filter((m) => isWin(m.result)).length;
  const losses = matches.filter((m) => !isWin(m.result)).length;
  const winrate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Swords className="h-10 w-10 text-[#E9ECEF] dark:text-gray-700 mx-auto mb-2" />
        <p className="text-sm text-[#6C757D] dark:text-gray-400">
          Aucun match pro enregistré
        </p>
        <p className="text-xs text-[#6C757D] dark:text-gray-500 mt-1">
          Les matchs seront importés depuis Gol.gg
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-[#1A1D29] border border-[#2A2D3A] rounded-lg px-3 py-1.5">
          <Trophy className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-sm font-bold text-[#E9ECEF] tabular-nums">
            {wins}W — {losses}L
          </span>
          <span className="text-xs text-[#6C757D] tabular-nums">({winrate}% WR)</span>
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

      {/* Matches table — LCK style, compact */}
      <div className="overflow-x-auto rounded-lg border border-[#2A2D3A]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#141621] text-[#6C757D] text-xs uppercase tracking-wider border-b border-[#2A2D3A]">
              <th className="text-left py-2 px-2 font-semibold">Champion</th>
              <th className="text-left py-2 px-2 font-semibold">Result</th>
              <th className="text-left py-2 px-2 font-semibold">Duration</th>
              <th className="text-left py-2 px-2 font-semibold">KDA</th>
              <th className="text-left py-2 px-2 font-semibold">CSM</th>
              <th className="text-left py-2 px-2 font-semibold">DPM</th>
              <th className="text-left py-2 px-2 font-semibold">KP%</th>
              <th className="text-left py-2 px-2 font-semibold">Build</th>
              <th className="text-left py-2 px-2 font-semibold">Date</th>
              <th className="text-left py-2 px-2 font-semibold">Game</th>
              <th className="text-left py-2 px-2 font-semibold">Tournament</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((match) => {
              const items = parseItems(match.items);
              const kdaParts = parseKda(match.kda);
              const kdaValue = kdaParts.d === 0 ? kdaParts.k + kdaParts.a : (kdaParts.k + kdaParts.a) / kdaParts.d;
              const won = isWin(match.result);

              return (
                <tr
                  key={match.id}
                  className="bg-[#1A1F2E] hover:bg-[#1E2435] transition-colors border-b border-[#232838] last:border-b-0"
                >
                  {/* Champion */}
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 ring-1 ring-[#2A2D3A]">
                        <Image
                          src={getChampionIconUrl(match.champion)}
                          alt={match.champion}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                      <span className="font-semibold text-[#E9ECEF] text-xs whitespace-nowrap">
                        {match.champion}
                      </span>
                    </div>
                  </td>

                  {/* Result */}
                  <td className="py-2 px-2">
                    <span className={`font-bold text-xs ${won ? "text-emerald-400" : "text-red-400"}`}>
                      {won ? "Victory" : "Defeat"}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <div className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 text-[#6C757D]" />
                      {match.duration}
                    </div>
                  </td>

                  {/* KDA */}
                  <td className="py-2 px-2">
                    <span className={`font-mono font-bold text-xs ${kdaColor(kdaValue)} tabular-nums`}>
                      {match.kda}
                    </span>
                    <span className="text-xs text-[#6C757D] ml-1 tabular-nums">
                      {kdaValue.toFixed(1)}
                    </span>
                  </td>

                  {/* CSM */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <span className="font-medium tabular-nums">{match.cspm?.toFixed(1) ?? "—"}</span>
                  </td>

                  {/* DPM */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <span className="font-medium tabular-nums">{match.dpm?.toFixed(0) ?? "—"}</span>
                  </td>

                  {/* KP% — white, no color coding */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <span className="font-medium tabular-nums">
                      {match.kpPercent !== null && match.kpPercent !== undefined
                        ? `${match.kpPercent.toFixed(1)}%`
                        : "—"}
                    </span>
                  </td>

                  {/* Build = Runes + Items */}
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      {/* Runes */}
                      <div className="flex items-center gap-0.5">
                        {match.keystoneRune && (
                          <div className="relative w-4 h-4">
                            <Image
                              src={getKeystoneRuneIconUrl(Number(match.keystoneRune))}
                              alt="keystone"
                              fill
                              className="object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        {match.secondaryRune && (
                          <div className="relative w-3.5 h-3.5 opacity-60">
                            <Image
                              src={getSecondaryRuneIconUrl(Number(match.secondaryRune))}
                              alt="secondary"
                              fill
                              className="object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </div>
                      {/* Items */}
                      <div className="flex items-center gap-px">
                        {items.slice(0, 6).map((itemId, i) => (
                          <div
                            key={i}
                            className="relative w-5 h-5 rounded overflow-hidden bg-[#0D1117] ring-1 ring-[#2A2D3A]"
                          >
                            {itemId && itemId !== "0" ? (
                              <Image
                                src={getItemIconUrl(itemId)}
                                alt={`item-${i}`}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Date — short, no icon */}
                  <td className="py-2 px-2 text-[#ADB5BD] whitespace-nowrap">
                    {formatDateShort(match.matchDate)}
                  </td>

                  {/* Game */}
                  <td className="py-2 px-2 whitespace-nowrap">
                    <span className="text-[#E9ECEF] font-semibold text-xs">{match.teamName}</span>
                    <span className="mx-0.5 text-[#6C757D] text-xs">vs</span>
                    <span className="text-[#ADB5BD] text-xs">{match.opponent}</span>
                  </td>

                  {/* Tournament — short */}
                  <td className="py-1.5 px-2 text-[#6C757D] whitespace-nowrap text-xs">
                    {formatTournamentShort(match.tournament)}
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
