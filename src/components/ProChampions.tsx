"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Swords, Trophy } from "lucide-react";
import { getChampionIconUrl } from "@/lib/game-assets";

interface ProMatch {
  id: string;
  champion: string;
  result: string;
  kda: string;
  cspm: number | null;
  dpm: number | null;
  kpPercent: number | null;
  teamName: string;
  opponent: string;
}

interface ProChampionsProps {
  matches: ProMatch[];
}

interface ChampionAggregate {
  champion: string;
  games: number;
  wins: number;
  kdaSum: number;
  kdaCount: number;
  kpSum: number;
  kpCount: number;
  dpmSum: number;
  dpmCount: number;
  csmSum: number;
  csmCount: number;
}

function parseKda(kda: string): number {
  const parts = kda.split("/").map(Number);
  const k = parts[0] || 0;
  const d = parts[1] || 0;
  const a = parts[2] || 0;
  return d === 0 ? k + a : (k + a) / d;
}

function isWin(result: string): boolean {
  return result === "WIN" || result === "win" || result === "Victory";
}

export default function ProChampions({ matches }: ProChampionsProps) {
  const champions = useMemo(() => {
    const map = new Map<string, ChampionAggregate>();

    for (const match of matches) {
      const existing = map.get(match.champion);
      const kda = parseKda(match.kda);

      if (existing) {
        existing.games += 1;
        existing.wins += isWin(match.result) ? 1 : 0;
        existing.kdaSum += kda;
        existing.kdaCount += 1;
        if (match.kpPercent !== null) {
          existing.kpSum += match.kpPercent;
          existing.kpCount += 1;
        }
        if (match.dpm !== null) {
          existing.dpmSum += match.dpm;
          existing.dpmCount += 1;
        }
        if (match.cspm !== null) {
          existing.csmSum += match.cspm;
          existing.csmCount += 1;
        }
      } else {
        map.set(match.champion, {
          champion: match.champion,
          games: 1,
          wins: isWin(match.result) ? 1 : 0,
          kdaSum: kda,
          kdaCount: 1,
          kpSum: match.kpPercent ?? 0,
          kpCount: match.kpPercent !== null ? 1 : 0,
          dpmSum: match.dpm ?? 0,
          dpmCount: match.dpm !== null ? 1 : 0,
          csmSum: match.cspm ?? 0,
          csmCount: match.cspm !== null ? 1 : 0,
        });
      }
    }

    return Array.from(map.values())
      .map((c) => ({
        champion: c.champion,
        games: c.games,
        wins: c.wins,
        kda: c.kdaCount > 0 ? c.kdaSum / c.kdaCount : 0,
        kp: c.kpCount > 0 ? c.kpSum / c.kpCount : 0,
        dpm: c.dpmCount > 0 ? c.dpmSum / c.dpmCount : 0,
        csm: c.csmCount > 0 ? c.csmSum / c.csmCount : 0,
      }))
      .sort((a, b) => b.games - a.games);
  }, [matches]);

  const totalGames = champions.reduce((sum, c) => sum + c.games, 0);
  const totalWins = champions.reduce((sum, c) => sum + c.wins, 0);

  if (champions.length === 0) {
    return (
      <div className="text-center py-8">
        <Swords className="h-10 w-10 text-[#E9ECEF] dark:text-gray-700 mx-auto mb-2" />
        <p className="text-sm text-[#6C757D] dark:text-gray-400">
          No pro champion data available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-[#1A1D29] border border-[#2A2D3A] rounded-lg px-3 py-1.5">
          <Trophy className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-sm font-bold text-[#E9ECEF]">
            {totalWins}W — {totalGames - totalWins}L
          </span>
          <span className="text-xs text-[#6C757D]">
            ({Math.round((totalWins / totalGames) * 100)}% WR)
          </span>
          <span className="text-xs text-[#6C757D] ml-2">
            {champions.length} champions
          </span>
        </div>
      </div>

      {/* Champions table — compact style */}
      <div className="overflow-x-auto rounded-lg border border-[#2A2D3A]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#141621] text-[#6C757D] text-xs uppercase tracking-wider border-b border-[#2A2D3A]">
              <th className="text-left py-2 px-2 font-semibold">Champion</th>
              <th className="text-left py-2 px-2 font-semibold">Games</th>
              <th className="text-left py-2 px-2 font-semibold">Win%</th>
              <th className="text-left py-2 px-2 font-semibold">KDA</th>
              <th className="text-left py-2 px-2 font-semibold">KP%</th>
              <th className="text-left py-2 px-2 font-semibold">DPM</th>
              <th className="text-left py-2 px-2 font-semibold">CSM</th>
            </tr>
          </thead>
          <tbody>
            {champions.map((champ) => {
              const winrate = champ.games > 0 ? (champ.wins / champ.games) * 100 : 0;

              return (
                <tr
                  key={champ.champion}
                  className="bg-[#1A1F2E] hover:bg-[#1E2435] transition-colors border-b border-[#232838] last:border-b-0"
                >
                  {/* Champion */}
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 ring-1 ring-[#2A2D3A]">
                        <Image
                          src={getChampionIconUrl(champ.champion)}
                          alt={champ.champion}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                      <span className="font-semibold text-[#E9ECEF] text-xs whitespace-nowrap">
                        {champ.champion}
                      </span>
                    </div>
                  </td>

                  {/* Games */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <span className="font-medium">{champ.games}</span>
                  </td>

                  {/* Win% */}
                  <td className="py-2 px-2">
                    <span className={`font-semibold text-xs ${
                      winrate >= 60 ? "text-emerald-400" :
                      winrate >= 40 ? "text-blue-400" :
                      "text-red-400"
                    }`}>
                      {winrate.toFixed(0)}%
                    </span>
                  </td>

                  {/* KDA */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <span className="font-medium">{champ.kda.toFixed(1)}</span>
                  </td>

                  {/* KP% */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <span className="font-medium">{champ.kp.toFixed(1)}%</span>
                  </td>

                  {/* DPM */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <span className="font-medium">{champ.dpm.toFixed(0)}</span>
                  </td>

                  {/* CSM */}
                  <td className="py-2 px-2 text-[#ADB5BD]">
                    <span className="font-medium">{champ.csm.toFixed(1)}</span>
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
