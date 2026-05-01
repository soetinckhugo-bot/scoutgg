"use client";

import { Swords, Crown, Target, TrendingUp } from "lucide-react";

interface ProMatch {
  id: string;
  champion: string | null;
  kda: string | null;
  result: string | null;
  opponent: string | null;
  tournament: string | null;
  kpPercent: number | null;
}

interface ProInsightCardsProps {
  proMatches: ProMatch[];
}

function isWin(result: string | null): boolean {
  if (!result) return false;
  const r = result.toLowerCase();
  return r === "win" || r === "victory" || r === "won";
}

export default function ProInsightCards({ proMatches }: ProInsightCardsProps) {
  if (proMatches.length === 0) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center opacity-50"
          >
            <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
              —
            </span>
            <span className="text-2xl font-bold text-text-heading mt-2">—</span>
          </div>
        ))}
      </div>
    );
  }

  // Best KDA
  let bestKDA = 0;
  let bestKDAOpponent = "";
  proMatches.forEach((m) => {
    if (m.kda) {
      const parts = m.kda.split("/").map((n) => parseFloat(n.trim()));
      if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
        const [k, d, a] = parts;
        const kda = d === 0 ? k + a : (k + a) / d;
        if (kda > bestKDA) {
          bestKDA = kda;
          bestKDAOpponent = m.opponent || "";
        }
      }
    }
  });

  // Best KP%
  let bestKP = 0;
  let bestKPTournament = "";
  proMatches.forEach((m) => {
    if (m.kpPercent && m.kpPercent > bestKP) {
      bestKP = m.kpPercent;
      bestKPTournament = m.tournament || "";
    }
  });

  // Most Played Champion
  const champCounts: Record<string, { wins: number; games: number }> = {};
  proMatches.forEach((m) => {
    if (m.champion) {
      if (!champCounts[m.champion]) {
        champCounts[m.champion] = { wins: 0, games: 0 };
      }
      champCounts[m.champion].games++;
      if (isWin(m.result)) champCounts[m.champion].wins++;
    }
  });

  let favChamp = "";
  let favChampGames = 0;
  let favChampWins = 0;
  Object.entries(champCounts).forEach(([champ, record]) => {
    if (record.games > favChampGames) {
      favChamp = champ;
      favChampGames = record.games;
      favChampWins = record.wins;
    }
  });
  const favChampWR = favChampGames > 0 ? Math.round((favChampWins / favChampGames) * 100) : 0;

  // Best champion winrate (min 3 games)
  let bestWRChamp = "";
  let bestWR = 0;
  let bestWRGames = 0;
  Object.entries(champCounts).forEach(([champ, record]) => {
    if (record.games >= 3) {
      const wr = record.wins / record.games;
      if (wr > bestWR) {
        bestWR = wr;
        bestWRChamp = champ;
        bestWRGames = record.games;
      }
    }
  });

  const cards = [
    {
      icon: Swords,
      label: "Best KDA",
      value: bestKDA > 0 ? bestKDA.toFixed(2) : "—",
      sub: bestKDAOpponent || null,
    },
    {
      icon: Crown,
      label: "Most Played",
      value: favChamp || "—",
      sub: favChampGames > 0 ? `${favChampGames}G · ${favChampWR}% WR` : null,
    },
    {
      icon: Target,
      label: "Best KP%",
      value: bestKP > 0 ? `${(bestKP * 100).toFixed(0)}%` : "—",
      sub: bestKPTournament || null,
    },
    {
      icon: TrendingUp,
      label: "Best WR",
      value: bestWRChamp ? `${Math.round(bestWR * 100)}%` : "—",
      sub: bestWRChamp ? `${bestWRChamp} · ${bestWRGames}G` : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center"
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className="h-4 w-4 text-text-muted" />
            <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
              {card.label}
            </span>
          </div>
          <span className="text-2xl font-bold text-text-heading">{card.value}</span>
          {card.sub && (
            <span className="text-xs mt-1 font-medium text-text-muted truncate max-w-full">
              {card.sub}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
