"use client";

import PlayerCard from "@/components/PlayerCard";

export default function PlayerGrid({ players }: { players: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {players.map((player: any, index: number) => (
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

