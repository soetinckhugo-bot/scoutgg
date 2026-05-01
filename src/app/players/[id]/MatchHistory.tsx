"use client";

import { useState, useEffect } from "react";
import { Loader2, Swords, Clock, Filter } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  getChampionIconUrl,
  getItemIconUrl,
  getKeystoneRuneIconUrl,
  getSecondaryRuneIconUrl,
  getSummonerSpellIconUrlById,
} from "@/lib/game-assets";

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
  items: number[];
  keystoneRune: number | null;
  secondaryRune: number | null;
  summoner1Id: number;
  summoner2Id: number;
  opponentChampion: string | null;
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
        <Loader2 className="h-8 w-8 animate-spin text-primary-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Swords className="h-10 w-10 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-body">{error}</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8">
        <Swords className="h-10 w-10 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-body">
          No recent ranked matches found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-surface-hover border border-border rounded-lg px-3 py-1.5">
          <span className="text-sm font-bold text-text-heading tabular-nums">
            {wins}W — {matches.length - wins}L
          </span>
          <span className="text-xs text-text-muted tabular-nums">
            ({Math.round((wins / matches.length) * 100)}% WR)
          </span>
          <span className="text-xs text-text-muted ml-2">
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
                    : "bg-tier-s/20 text-tier-s border border-tier-s/30"
                  : "bg-surface-hover text-text-muted border border-border hover:text-text-heading"
              }`}
            >
              {f === "all" ? "All" : f === "win" ? "Wins" : "Losses"}
            </button>
          ))}
        </div>
      </div>

      {/* Match Cards — style Tryouts */}
      <div className="space-y-3">
        {filtered.map((match) => (
          <div
            key={match.matchId}
            className={`rounded-xl border p-3 transition-colors ${
              match.win
                ? "bg-blue-500/5 border-blue-500/20"
                : "bg-red-500/5 border-red-500/20"
            }`}
          >
            {/* Top row: champion + result + kda + opponent */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Champion icon */}
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-border">
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

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${match.win ? "text-blue-400" : "text-red-400"}`}>
                      {match.win ? "Victory" : "Defeat"}
                    </span>
                    <span className="text-xs text-text-muted">
                      <Clock className="h-3 w-3 inline mr-0.5" />
                      {formatDuration(match.gameDuration)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-xs text-text-body">
                    <span className={`font-mono font-bold ${kdaColor(match.kda)}`}>
                      {match.kills}/{match.deaths}/{match.assists}
                    </span>
                    <span className="text-text-muted">({match.kda.toFixed(1)})</span>
                    <span className="text-text-muted mx-1">·</span>
                    <span>{match.cs} CS</span>
                    <span className="text-text-muted">({match.cspm.toFixed(1)}/m)</span>
                    <span className="text-text-muted mx-1">·</span>
                    <span>{(match.goldEarned / 1000).toFixed(1)}k gold</span>
                  </div>
                </div>
              </div>

              {/* VS opponent */}
              {match.opponentChampion && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">VS</span>
                  <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 ring-1 ring-border">
                    <Image
                      src={getChampionIconUrl(match.opponentChampion)}
                      alt={match.opponentChampion}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom row: runes + summoner spells + items */}
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
              {/* Summoner Spells */}
              <div className="flex items-center gap-0.5">
                {[match.summoner1Id, match.summoner2Id].map((spellId, i) => (
                  <div key={i} className="relative w-5 h-5 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={getSummonerSpellIconUrlById(spellId)}
                      alt={`spell-${i}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Runes */}
              <div className="flex items-center gap-1">
                {match.keystoneRune && (
                  <div className="relative w-5 h-5">
                    <Image
                      src={getKeystoneRuneIconUrl(match.keystoneRune)}
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
                      src={getSecondaryRuneIconUrl(match.secondaryRune)}
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
                {match.items.map((itemId, i) => (
                  <div
                    key={i}
                    className="relative w-6 h-6 rounded overflow-hidden bg-background ring-1 ring-border"
                  >
                    {itemId && itemId > 0 ? (
                      <Image
                        src={getItemIconUrl(String(itemId))}
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

              {/* Date */}
              <span className="text-xs text-text-muted ml-auto">
                {formatDateShort(match.gameCreation)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
