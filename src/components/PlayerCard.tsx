"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ROLE_COLORS, STATUS_COLORS } from "@/lib/constants";
import { formatStatus } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";
import Avatar from "./Avatar";
import { Caption } from "@/components/ui/typography";
import { TrendingUp, Trophy, Users, ClipboardList, Loader2 } from "lucide-react";
import Flag from "@/components/Flag";
import ScoutIcon from "./ScoutIcon";
import { useState } from "react";
import { toast } from "sonner";

interface Player {
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  league: string;
  status: string;
  currentTeam: string | null;
  photoUrl: string | null;
  age?: number | null;
  nationality?: string | null;
  tier?: string | null;
  soloqStats?: {
    currentRank?: string | null;
    peakLp?: number | null;
    winrate?: number | null;
    totalGames?: number | null;
  } | null;
  proStats?: {
    kda?: number | null;
    dpm?: number | null;
    gamesPlayed?: number | null;
    globalScore?: number | null;
    tierScore?: number | null;
    winRate?: number | null;
  } | null;
}

interface PlayerCardProps {
  player: Player;
  showStats?: boolean;
  showFavorite?: boolean;
  variant?: "default" | "compact";
  compareMode?: boolean;
  isSelected?: boolean;
  onToggleCompare?: () => void;
  showScouting?: boolean;
}

function getScoreColor(value: number) {
  if (value >= 90) return "text-tier-s";
  if (value >= 75) return "text-tier-a";
  if (value >= 60) return "text-tier-b";
  if (value >= 50) return "text-tier-c";
  return "text-tier-d";
}

function getWinrateColor(winRate: number): string {
  const pct = winRate * 100;
  if (pct >= 60) return "text-tier-a";
  if (pct >= 40) return "text-tier-b";
  return "text-tier-d";
}

function getTierLabel(player: Player): string | null {
  if (player.tier) return `Tier ${player.tier}`;
  return null;
}

function AddToBoardButton({ playerId }: { playerId: string }) {
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch("/api/scouting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, status: "discovery" }),
      });
      if (res.status === 409) {
        toast.info("Player already on your scouting board");
      } else if (!res.ok) {
        throw new Error();
      } else {
        toast.success("Added to Scouting Pipeline");
      }
    } catch {
      toast.error("Failed to add to board");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="p-1.5 rounded-lg bg-background/90 backdrop-blur border border-border hover:bg-surface-hover hover:border-primary-accent/50 transition-colors disabled:opacity-50"
      title="Add to Scouting Pipeline"
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin text-text-muted" />
      ) : (
        <ClipboardList className="size-3.5 text-text-muted hover:text-primary-accent" />
      )}
    </button>
  );
}

export default function PlayerCard({
  player,
  showStats = true,
  showFavorite = true,
  variant = "default",
  compareMode = false,
  isSelected = false,
  onToggleCompare,
  showScouting = true,
}: PlayerCardProps) {
  if (variant === "compact") {
    return (
      <Link href={`/players/${player.id}`} className="block h-full">
        <div className="rounded-xl border border-border bg-card hover:border-primary-accent/50 hover:bg-surface-hover transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer p-4 group h-full">
          <div className="flex items-center gap-3">
            <Avatar
              src={player.photoUrl}
              alt={player.pseudo}
              fallback={player.pseudo}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-text-heading truncate text-sm group-hover:text-primary-accent transition-colors">
                {player.pseudo}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs h-4 px-1 ${ROLE_COLORS[player.role] || ""}`}>
                  {player.role}
                </Badge>
                <Caption className="text-text-muted">{player.league}</Caption>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  const hasPro = player.proStats && (player.proStats.globalScore != null || player.proStats.tierScore != null || player.proStats.winRate != null);
  const globalScore = player.proStats?.globalScore ?? null;
  const tierScore = player.proStats?.tierScore ?? null;
  const tierLabel = getTierLabel(player);

  return (
    <div className="relative">
      <Link href={`/players/${player.id}`}>
        <div className="rounded-xl border border-border bg-card hover:border-primary-accent/50 hover:bg-surface-hover transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer p-4 group">
          <div className="flex items-start gap-3">
            <Avatar
              src={player.photoUrl}
              alt={player.pseudo}
              fallback={player.pseudo}
              size="xl"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-text-heading truncate text-sm group-hover:text-primary-accent transition-colors">
                  {player.pseudo}
                </h3>
                <Badge className={`text-xs h-4 px-1 ${ROLE_COLORS[player.role] || ""}`}>
                  {player.role}
                </Badge>
                {player.nationality && (
                  <Flag code={player.nationality} />
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {player.realName && (
                  <span className="text-xs text-text-muted">{player.realName}</span>
                )}
                {player.age && (
                  <span className="text-xs text-text-muted">· {player.age} yo</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge className={`text-xs h-4 px-1 ${STATUS_COLORS[player.status] || ""}`}>
                  {formatStatus(player.status)}
                </Badge>
                <Caption className="text-text-muted">{player.league}</Caption>
                {player.currentTeam && (
                  <Caption className="text-text-muted">• {player.currentTeam}</Caption>
                )}
              </div>

              {/* Meta: tier */}
              <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-text-muted">
                {tierLabel && (
                  <span>{tierLabel}</span>
                )}
              </div>

              {/* Stats row — always show 3 slots */}
              {showStats && (
                <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <ScoutIcon icon={Trophy} size="xs" variant="accent" />
                      <span className="text-[10px] uppercase tracking-wider text-text-muted">Global</span>
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${globalScore != null ? getScoreColor(globalScore) : "text-text-muted"}`}>
                      {globalScore != null ? globalScore.toFixed(1) : "—"}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <ScoutIcon icon={Users} size="xs" variant="accent" />
                      <span className="text-[10px] uppercase tracking-wider text-text-muted">Tier</span>
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${tierScore != null ? getScoreColor(tierScore) : "text-text-muted"}`}>
                      {tierScore != null ? tierScore.toFixed(1) : "—"}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <ScoutIcon icon={TrendingUp} size="xs" variant="success" />
                      <span className="text-[10px] uppercase tracking-wider text-text-muted">WR</span>
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${player.proStats?.winRate != null ? getWinrateColor(player.proStats.winRate) : "text-text-muted"}`}>
                      {player.proStats?.winRate != null ? `${(player.proStats.winRate * 100).toFixed(1)}%` : "—"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
      {compareMode && onToggleCompare && (
        <label className="absolute top-2 left-2 z-10 flex items-center gap-1 cursor-pointer bg-background/90 backdrop-blur rounded px-2 py-1 border border-border hover:bg-surface-hover transition-colors">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.preventDefault();
              onToggleCompare();
            }}
            className="h-3 w-3 rounded border-border bg-card text-primary-accent focus:ring-primary-accent"
          />
          <span className="text-xs font-medium text-text-subtle">Compare</span>
        </label>
      )}
      {showFavorite && (
        <div className="absolute top-2 right-2">
          <FavoriteButton playerId={player.id} variant="small" />
        </div>
      )}
      {showScouting && (
        <div className="absolute top-2 right-10">
          <AddToBoardButton playerId={player.id} />
        </div>
      )}
    </div>
  );
}
