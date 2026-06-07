"use client";

import PlayerCard from "@/components/PlayerCard";

interface GridPlayer {
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  league: string;
  status: string;
  currentTeam: string | null;
  photoUrl: string | null;
  age?: number | null;
  dateOfBirth?: Date | string | null;
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

export default function PlayerGrid({ players }: { players: GridPlayer[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {players.map((player, index) => (
        <div
          key={player.id}
          className={`animate-fade-in-up opacity-0 stagger-${Math.min(index % 5 + 1, 5)}`}
        >
          <PlayerCard
            player={player}
            showStats
            showFavorite
            variant="default"
          />
        </div>
      ))}
    </div>
  );
}
