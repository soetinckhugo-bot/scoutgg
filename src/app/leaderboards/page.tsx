"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Card kept for category header wrapper only
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  TrendingUp,
  Target,
  Swords,
  Eye,
  Zap,
  Crown,
  Medal,
  User,
  Loader2,
} from "lucide-react";
import { ROLE_COLORS } from "@/lib/constants";

interface Player {
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  currentTeam: string | null;
  league: string;
  photoUrl: string | null;
  prospectScore: number | null;
  soloqStats: {
    currentRank: string;
    peakLp: number;
    winrate: number;
    totalGames: number;
    championPool: string;
  } | null;
  proStats: {
    kda: number | null;
    dpm: number | null;
    cspm: number | null;
    gpm: number | null;
    kpPercent: number | null;
    visionScore: number | null;
    csdAt15: number | null;
    gdAt15: number | null;
    soloKills: number | null;
    poolSize: number | null;
    gamesPlayed: number | null;
  } | null;
}

interface LeaderboardCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  sortField: string;
  order: "asc" | "desc";
  minGames: number;
  formatValue: (player: Player) => string;
  getValue: (player: Player) => number;
  unit?: string;
}

const categories: LeaderboardCategory[] = [
  {
    id: "peakLp",
    label: "Top LP",
    icon: Trophy,
    sortField: "peakLp",
    order: "desc",
    minGames: 0,
    formatValue: (p) => `${p.soloqStats?.peakLp?.toLocaleString() ?? 0} LP`,
    getValue: (p) => p.soloqStats?.peakLp ?? 0,
    unit: "LP",
  },
  {
    id: "winrate",
    label: "SoloQ Win Rate",
    icon: TrendingUp,
    sortField: "winrate",
    order: "desc",
    minGames: 20,
    formatValue: (p) => `${((p.soloqStats?.winrate ?? 0) * 100).toFixed(1)}%`,
    getValue: (p) => p.soloqStats?.winrate ?? 0,
    unit: "%",
  },
  {
    id: "kda",
    label: "Best KDA",
    icon: Target,
    sortField: "kda",
    order: "desc",
    minGames: 5,
    formatValue: (p) => (p.proStats?.kda ?? 0).toFixed(2),
    getValue: (p) => p.proStats?.kda ?? 0,
  },
  {
    id: "dpm",
    label: "Highest DPM",
    icon: Swords,
    sortField: "dpm",
    order: "desc",
    minGames: 5,
    formatValue: (p) => `${Math.round(p.proStats?.dpm ?? 0)}`,
    getValue: (p) => p.proStats?.dpm ?? 0,
    unit: "dmg/min",
  },
  {
    id: "cspm",
    label: "Highest CSPM",
    icon: Zap,
    sortField: "cspm",
    order: "desc",
    minGames: 5,
    formatValue: (p) => (p.proStats?.cspm ?? 0).toFixed(1),
    getValue: (p) => p.proStats?.cspm ?? 0,
    unit: "cs/min",
  },
  {
    id: "kpPercent",
    label: "Kill Participation",
    icon: Crown,
    sortField: "kpPercent",
    order: "desc",
    minGames: 5,
    formatValue: (p) => `${((p.proStats?.kpPercent ?? 0) * 100).toFixed(1)}%`,
    getValue: (p) => p.proStats?.kpPercent ?? 0,
    unit: "%",
  },
  {
    id: "visionScore",
    label: "Vision Score",
    icon: Eye,
    sortField: "visionScore",
    order: "desc",
    minGames: 5,
    formatValue: (p) => (p.proStats?.visionScore ?? 0).toFixed(1),
    getValue: (p) => p.proStats?.visionScore ?? 0,
  },
  {
    id: "gdAt15",
    label: "Gold Diff @ 15",
    icon: TrendingUp,
    sortField: "gdAt15",
    order: "desc",
    minGames: 5,
    formatValue: (p) => `${Math.round(p.proStats?.gdAt15 ?? 0)}g`,
    getValue: (p) => p.proStats?.gdAt15 ?? 0,
    unit: "gold",
  },
  {
    id: "soloKills",
    label: "Solo Kills",
    icon: Swords,
    sortField: "soloKills",
    order: "desc",
    minGames: 5,
    formatValue: (p) => (p.proStats?.soloKills ?? 0).toFixed(1),
    getValue: (p) => p.proStats?.soloKills ?? 0,
  },
  {
    id: "poolSize",
    label: "Champion Pool",
    icon: Medal,
    sortField: "poolSize",
    order: "desc",
    minGames: 5,
    formatValue: (p) => `${p.proStats?.poolSize ?? 0} champs`,
    getValue: (p) => p.proStats?.poolSize ?? 0,
  },
  {
    id: "prospectScore",
    label: "Prospect Score",
    icon: Trophy,
    sortField: "prospectScore",
    order: "desc",
    minGames: 0,
    formatValue: (p) => (p.prospectScore ?? 0).toFixed(1),
    getValue: (p) => p.prospectScore ?? 0,
  },
];

const ROLES = ["ALL", "TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
        <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
        <Medal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
        <Medal className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[#F8F9FA] dark:bg-[#1e293b] flex items-center justify-center shrink-0">
      <span className="text-sm font-semibold text-[#6C757D] dark:text-gray-400 tabular-nums">
        {rank}
      </span>
    </div>
  );
}

function PlayerRow({
  player,
  rank,
  category,
}: {
  player: Player;
  rank: number;
  category: LeaderboardCategory;
}) {
  const value = category.getValue(player);
  const maxValue = 100;
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <Link
      href={`/players/${player.id}`}
      className="flex items-center gap-4 p-4 hover:bg-[#F8F9FA] dark:hover:bg-[#0f172a] transition-colors group"
    >
      <RankBadge rank={rank} />

      <Avatar className="h-10 w-10 shrink-0">
        {player.photoUrl ? (
          <AvatarImage src={player.photoUrl} alt={player.pseudo} />
        ) : null}
        <AvatarFallback className="bg-[#1A1A2E] text-white text-xs">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1A1A2E] dark:text-white truncate">
            {player.pseudo}
          </span>
          <Badge
            variant="secondary"
            className={`text-xs h-5 px-2 ${ROLE_COLORS[player.role] || "bg-gray-100 text-gray-800"}`}
          >
            {player.role}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6C757D] dark:text-gray-400">
          {player.currentTeam && <span>{player.currentTeam}</span>}
          {player.currentTeam && player.league && (
            <span className="text-[#E9ECEF] dark:text-gray-600">|</span>
          )}
          {player.league && <span>{player.league}</span>}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-lg font-bold text-[#1A1A2E] dark:text-white tabular-nums">
          {category.formatValue(player)}
        </div>
        {rank <= 10 && (
          <div className="w-24 h-1 bg-[#E9ECEF] dark:bg-gray-700 rounded-full mt-1 ml-auto overflow-hidden">
            <div
              className="h-full bg-[#E94560] rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}

export default function LeaderboardsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("peakLp");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const category = useMemo(
    () => categories.find((c) => c.id === activeCategory) || categories[0],
    [activeCategory]
  );

  useEffect(() => {
    async function fetchPlayers() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          sort: category.sortField,
          order: category.order,
          limit: "50",
        });
        if (roleFilter !== "ALL") {
          params.set("role", roleFilter);
        }
        if (category.minGames > 0) {
          params.set("minGames", String(category.minGames));
        }

        const res = await fetch(`/api/players?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPlayers(data.players || []);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, [category, roleFilter]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E] dark:text-white mb-2">
          Leaderboards
        </h1>
        <p className="text-[#6C757D] dark:text-gray-400">
          Global rankings across all metrics
        </p>
      </div>

      {/* Category Tabs */}
      <div className="mb-6 overflow-x-auto">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="data-[state=active]:bg-[#1A1A2E] data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-[#0f172a] text-xs h-8 px-3"
              >
                <cat.icon className="h-3 w-3 mr-1" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Role Filter */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-[#6C757D] dark:text-gray-400">Role:</span>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v || "ALL")}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r} className="text-xs">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leaderboard */}
      <div className="rounded-lg border border-[#E9ECEF] dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E9ECEF] dark:border-gray-700 bg-[#F8F9FA] dark:bg-[#1e293b]">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-[#1A1A2E] dark:text-white">
            <category.icon className="h-5 w-5 text-[#E94560]" />
            {category.label}
            {category.minGames > 0 && (
              <Badge
                variant="secondary"
                className="text-xs h-5 bg-[#F8F9FA] dark:bg-[#1e293b] text-[#6C757D] dark:text-gray-400"
              >
                min {category.minGames} games
              </Badge>
            )}
          </h3>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#E94560]" />
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-16 text-[#6C757D] dark:text-gray-400">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No players found for this category</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E9ECEF] dark:divide-gray-700">
              {players.map((player, index) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  rank={index + 1}
                  category={category}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

