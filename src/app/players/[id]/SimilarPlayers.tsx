"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, User, Zap, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { ROLE_COLORS } from "@/lib/constants";

interface SimilarPlayer {
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  league: string;
  currentTeam: string | null;
  photoUrl: string | null;
  similarity: number;
  soloqStats: {
    currentRank: string;
    peakLp: number;
  } | null;
}

export default function SimilarPlayers({ playerId }: { playerId: string }) {
  const [similar, setSimilar] = useState<SimilarPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSimilar() {
      try {
        const res = await fetch(`/api/players/${playerId}/similar`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setSimilar(data.similar || []);
      } catch {
        toast.error("Failed to load similar players");
      } finally {
        setLoading(false);
      }
    }

    fetchSimilar();
  }, [playerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#E94560]" />
      </div>
    );
  }

  if (similar.length === 0) {
    return (
      <EmptyState
        icon={Zap}
        title="Not enough data"
        description="Similar player comparisons will appear here once more scouting data is available."
        action={{ label: "Browse players", href: "/players" }}
        className="py-8"
      />
    );
  }

  return (
    <div className="rounded-lg border border-[#2A2D3A] overflow-hidden">
      {/* Header */}
      <div className="bg-[#141621] px-3 py-2 border-b border-[#2A2D3A] flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-[#6C757D]" />
        <span className="text-xs font-semibold text-[#6C757D] uppercase tracking-wider">
          Similar Players
        </span>
        <span className="ml-auto text-xs text-[#6C757D]">
          {similar.length} found
        </span>
      </div>

      {/* Table Header */}
      <div className="bg-[#1A1F2E] border-b border-[#232838] grid grid-cols-12 gap-2 px-3 py-2">
        <div className="col-span-5 text-xs text-[#6C757D] uppercase tracking-wider">
          Player
        </div>
        <div className="col-span-2 text-xs text-[#6C757D] uppercase tracking-wider text-center">
          Role
        </div>
        <div className="col-span-2 text-xs text-[#6C757D] uppercase tracking-wider text-center">
          Rank / LP
        </div>
        <div className="col-span-3 text-xs text-[#6C757D] uppercase tracking-wider text-right">
          Match
        </div>
      </div>

      {/* Rows */}
      <div className="bg-[#1A1F2E]">
        {similar.map((player) => (
          <Link
            key={player.id}
            href={`/players/${player.id}`}
            className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-[#232838] last:border-b-0 hover:bg-[#1E2435] transition-colors items-center"
          >
            {/* Player */}
            <div className="col-span-5 flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 shrink-0">
                {player.photoUrl ? (
                  <AvatarImage src={player.photoUrl} alt={player.pseudo} />
                ) : null}
                <AvatarFallback className="bg-[#141621] text-[#6C757D] text-xs">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#E9ECEF] truncate">
                  {player.pseudo}
                </div>
                <div className="text-xs text-[#6C757D] truncate">
                  {player.currentTeam || player.league}
                </div>
              </div>
            </div>

            {/* Role */}
            <div className="col-span-2 flex justify-center">
              <Badge
                variant="secondary"
                className={`text-xs h-4 px-2 ${ROLE_COLORS[player.role] || ""}`}
              >
                {player.role}
              </Badge>
            </div>

            {/* Rank / LP */}
            <div className="col-span-2 text-center">
              {player.soloqStats ? (
                <div>
                  <div className="text-xs font-semibold text-[#E9ECEF] tabular-nums">
                    {player.soloqStats.currentRank}
                  </div>
                  <div className="text-xs text-[#6C757D] tabular-nums">
                    {player.soloqStats.peakLp} LP
                  </div>
                </div>
              ) : (
                <span className="text-xs text-[#6C757D]">—</span>
              )}
            </div>

            {/* Match */}
            <div className="col-span-3 text-right">
              <div className="text-xs font-bold text-[#E94560] tabular-nums">
                {player.similarity}%
              </div>
              <div className="text-xs text-[#6C757D] uppercase">match</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
