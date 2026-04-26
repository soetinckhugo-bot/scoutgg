"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ROLE_COLORS, STATUS_COLORS } from "@/lib/constants";
import { formatStatus } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";
import Avatar from "./Avatar";
import { Caption } from "@/components/ui/typography";

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
}

interface PlayerCardProps {
  player: Player;
  showStats?: boolean;
  showFavorite?: boolean;
  variant?: "default" | "compact";
  compareMode?: boolean;
  isSelected?: boolean;
  onToggleCompare?: () => void;
}

export default function PlayerCard({
  player,
  showFavorite = true,
  variant = "default",
  compareMode = false,
  isSelected = false,
  onToggleCompare,
}: PlayerCardProps) {
  if (variant === "compact") {
    return (
      <Link href={`/players/${player.id}`}>
        <div className="rounded-xl border border-[#2A2D3A] bg-[#141621] hover:border-[#3A3D4A] hover:bg-[#1A1D29] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevation-3 cursor-pointer p-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={player.photoUrl}
              alt={player.pseudo}
              fallback={player.pseudo}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground truncate text-sm">
                {player.pseudo}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs h-4 px-1 ${ROLE_COLORS[player.role] || ""}`}>
                  {player.role}
                </Badge>
                <Caption className="text-[#6C757D]">{player.league}</Caption>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="relative">
      <Link href={`/players/${player.id}`}>
        <div className="rounded-xl border border-[#2A2D3A] bg-[#141621] hover:border-[#3A3D4A] hover:bg-[#1A1D29] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer p-4">
          <div className="flex items-start gap-3">
            <Avatar
              src={player.photoUrl}
              alt={player.pseudo}
              fallback={player.pseudo}
              size="xl"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-foreground truncate text-sm">
                  {player.pseudo}
                </h3>
                <Badge className={`text-xs h-4 px-1 ${ROLE_COLORS[player.role] || ""}`}>
                  {player.role}
                </Badge>
              </div>
              {player.realName && (
                <p className="text-xs text-[#6C757D]">{player.realName}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge className={`text-xs h-4 px-1 ${STATUS_COLORS[player.status] || ""}`}>
                  {formatStatus(player.status)}
                </Badge>
                <Caption className="text-[#6C757D]">{player.league}</Caption>
                {player.currentTeam && (
                  <Caption className="text-[#6C757D]">• {player.currentTeam}</Caption>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
      {compareMode && onToggleCompare && (
        <label className="absolute top-2 left-2 z-10 flex items-center gap-1 cursor-pointer bg-[#0f1117]/90 backdrop-blur rounded px-2 py-1 border border-[#2A2D3A] hover:bg-[#1A1D29] transition-colors">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.preventDefault();
              onToggleCompare();
            }}
            className="h-3 w-3 rounded border-[#2A2D3A] bg-[#141621] text-[#E94560] focus:ring-[#E94560]"
          />
          <span className="text-xs font-medium text-[#ADB5BD]">Compare</span>
        </label>
      )}
      {showFavorite && (
        <div className="absolute top-2 right-2">
          <FavoriteButton playerId={player.id} variant="small" />
        </div>
      )}
    </div>
  );
}
