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
        <Loader2 className="h-6 w-6 animate-spin text-primary-accent" />
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
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-card px-3 py-2 border-b border-border flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-text-muted" />
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Similar Players
        </span>
        <span className="ml-auto text-xs text-text-muted">
          {similar.length} found
        </span>
      </div>

      {/* Table Header */}
      <div className="bg-surface-elevated border-b border-border grid grid-cols-12 gap-2 px-3 py-2">
        <div className="col-span-5 text-xs text-text-muted uppercase tracking-wider">
          Player
        </div>
        <div className="col-span-2 text-xs text-text-muted uppercase tracking-wider text-center">
          Role
        </div>
        <div className="col-span-2 text-xs text-text-muted uppercase tracking-wider text-center">
          Rank / LP
        </div>
        <div className="col-span-3 text-xs text-text-muted uppercase tracking-wider text-right">
          Match
        </div>
      </div>

      {/* Rows */}
      <div className="bg-surface-elevated">
        {similar.map((player) => (
          <Link
            key={player.id}
            href={`/players/${player.id}`}
            className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors items-center"
          >
            {/* Player */}
            <div className="col-span-5 flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 shrink-0">
                {player.photoUrl ? (
                  <AvatarImage src={player.photoUrl} alt={player.pseudo} />
                ) : null}
                <AvatarFallback className="bg-card text-text-muted text-xs">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-heading truncate">
                  {player.pseudo}
                </div>
                <div className="text-xs text-text-muted truncate">
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
                  <div className="text-xs font-semibold text-text-heading tabular-nums">
                    {player.soloqStats.currentRank}
                  </div>
                  <div className="text-xs text-text-muted tabular-nums">
                    {player.soloqStats.peakLp} LP
                  </div>
                </div>
              ) : (
                <span className="text-xs text-text-muted">—</span>
              )}
            </div>

            {/* Match */}
            <div className="col-span-3 text-right">
              <div className="text-xs font-bold text-primary-accent tabular-nums">
                {player.similarity}%
              </div>
              <div className="text-xs text-text-muted uppercase">match</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
