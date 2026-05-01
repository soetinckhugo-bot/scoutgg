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
  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = d.getUTCFullYear().toString().slice(-2);
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
        <Swords className="h-10 w-10 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-body">
          Aucun match pro enregistré
        </p>
        <p className="text-xs text-text-muted text-text-muted mt-1">
          Les matchs seront importés depuis Gol.gg
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-surface-hover border border-border rounded-lg px-3 py-1.5">
          <Trophy className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-sm font-bold text-text-heading tabular-nums">
            {wins}W — {losses}L
          </span>
          <span className="text-xs text-text-muted tabular-nums">({winrate}% WR)</span>
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
                    : "bg-tier-s/20 text-tier-s border border-tier-s/30"
                  : "bg-surface-hover text-text-muted border border-border hover:text-text-heading"
              }`}
            >
              {f === "all" ? "All" : f === "win" ? "Wins" : "Losses"}
            </button>
          ))}
        </div>
      </div>

      {/* Match Cards grouped by date — style RFT */}
      <div className="space-y-4">
        {(() => {
          // Group matches by date
          const groups: Record<string, typeof filtered> = {};
          filtered.forEach((match) => {
            const dateKey = new Date(match.matchDate).toISOString().split("T")[0];
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(match);
          });

          return Object.entries(groups).map(([date, dayMatches]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text-heading">
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                {dayMatches[0]?.tournament && (
                  <span className="text-xs text-text-muted">
                    {formatTournamentShort(dayMatches[0].tournament)}
                  </span>
                )}
              </div>

              {/* Match cards for this date */}
              <div className="space-y-2">
                {dayMatches.map((match) => {
                  const items = parseItems(match.items);
                  const kdaParts = parseKda(match.kda);
                  const kdaValue = kdaParts.d === 0 ? kdaParts.k + kdaParts.a : (kdaParts.k + kdaParts.a) / kdaParts.d;
                  const won = isWin(match.result);

                  return (
                    <div
                      key={match.id}
                      className={`rounded-xl border p-3 transition-colors ${
                        won
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-red-500/5 border-red-500/20"
                      }`}
                    >
                      {/* Top row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Champion */}
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-border">
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

                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm ${won ? "text-emerald-400" : "text-red-400"}`}>
                                {won ? "Victory" : "Defeat"}
                              </span>
                              <span className="text-xs text-text-muted">
                                <Clock className="h-3 w-3 inline mr-0.5" />
                                {match.duration}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-text-body">
                              <span className={`font-mono font-bold ${kdaColor(kdaValue)}`}>
                                {match.kda}
                              </span>
                              <span className="text-text-muted">({kdaValue.toFixed(1)})</span>
                              <span className="text-text-muted">·</span>
                              <span>{match.cspm?.toFixed(1) ?? "—"} CSM</span>
                              <span className="text-text-muted">·</span>
                              <span>{match.dpm?.toFixed(0) ?? "—"} DPM</span>
                              {match.kpPercent !== null && (
                                <>
                                  <span className="text-text-muted">·</span>
                                  <span>{match.kpPercent.toFixed(0)}% KP</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Team vs Opponent */}
                        <div className="text-right">
                          <span className="text-xs font-semibold text-text-heading">{match.teamName}</span>
                          <span className="text-xs text-text-muted mx-1">vs</span>
                          <span className="text-xs text-text-subtle">{match.opponent}</span>
                        </div>
                      </div>

                      {/* Bottom row: runes + items */}
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
                        {/* Runes */}
                        <div className="flex items-center gap-1">
                          {match.keystoneRune && (
                            <div className="relative w-5 h-5">
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
                            <div className="relative w-4 h-4 opacity-70">
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
                              className="relative w-6 h-6 rounded overflow-hidden bg-background ring-1 ring-border"
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
                    </div>
                  );
                })}
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
