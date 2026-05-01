"use client";

import Image from "next/image";

interface ChampionPoolProps {
  championPool: string | null;
}

// Map special champion names to their DataDragon IDs
const CHAMPION_ID_MAP: Record<string, string> = {
  "Wukong": "MonkeyKing",
  "Nunu & Willump": "Nunu",
  "Renata Glasc": "Renata",
  "K'Sante": "KSante",
  "Kai'Sa": "Kaisa",
  "Kha'Zix": "Khazix",
  "Cho'Gath": "Chogath",
  "Vel'Koz": "Velkoz",
  "Rek'Sai": "RekSai",
  "LeBlanc": "Leblanc",
  "Dr. Mundo": "DrMundo",
  "Jarvan IV": "JarvanIV",
  "Lee Sin": "LeeSin",
  "Miss Fortune": "MissFortune",
  "Tahm Kench": "TahmKench",
  "Twisted Fate": "TwistedFate",
  "Xin Zhao": "XinZhao",
};

function parseChampionPool(pool: string): { name: string; games: number }[] {
  if (!pool) return [];
  return pool.split(", ").map((entry) => {
    const match = entry.match(/^(.+)\s+\((\d+)\)$/);
    if (match) {
      return { name: match[1].trim(), games: parseInt(match[2], 10) };
    }
    return { name: entry.trim(), games: 0 };
  });
}

function getChampionId(name: string): string {
  const mapped = CHAMPION_ID_MAP[name];
  if (mapped) return mapped;
  // Capitalize first letter, rest lowercase
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().replace(/[^a-zA-Z]/g, "");
}

export default function ChampionPool({ championPool }: ChampionPoolProps) {
  const champions = parseChampionPool(championPool || "");
  if (champions.length === 0) return null;

  const totalGames = champions.reduce((sum, c) => sum + c.games, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {champions.map((champ) => {
          const champId = getChampionId(champ.name);
          const winrate = totalGames > 0 ? Math.round((champ.games / totalGames) * 100) : 0;
          return (
            <div
              key={champ.name}
              className="flex items-center gap-2 bg-card rounded-lg px-3 py-2"
              title={`${champ.name}: ${champ.games} games (${winrate}% pick rate)`}
            >
              <Image
                src={`https://ddragon.leagueoflegends.com/cdn/15.8.1/img/champion/${champId}.png`}
                alt={champ.name}
                width={32}
                height={32}
                className="rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-text-heading">{champ.name}</span>
                <span className="text-xs text-text-body">{champ.games} games</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
