"use client";

import { useState } from "react";
import Link from "next/link";
import { PageTitle, SectionHeader } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Crown,
  Medal,
  Award,
} from "lucide-react";

interface LadderPlayer {
  rank: number;
  pseudo: string;
  league: string;
  role: string;
  lp: number;
  winrate: number;
  games: number;
  trend: "up" | "down" | "stable";
  peakLp: number;
}

const MOCK_LADDER: LadderPlayer[] = [
  { rank: 1, pseudo: "Faker", league: "LCK", role: "MID", lp: 1823, winrate: 0.62, games: 234, trend: "up", peakLp: 1850 },
  { rank: 2, pseudo: "Chovy", league: "LCK", role: "MID", lp: 1791, winrate: 0.61, games: 198, trend: "stable", peakLp: 1820 },
  { rank: 3, pseudo: "ShowMaker", league: "LCK", role: "MID", lp: 1756, winrate: 0.59, games: 212, trend: "up", peakLp: 1780 },
  { rank: 4, pseudo: "Caps", league: "LEC", role: "MID", lp: 1723, winrate: 0.58, games: 245, trend: "down", peakLp: 1760 },
  { rank: 5, pseudo: "Perkz", league: "LEC", role: "MID", lp: 1698, winrate: 0.57, games: 189, trend: "stable", peakLp: 1720 },
  { rank: 6, pseudo: "Jojopyun", league: "LCS", role: "MID", lp: 1675, winrate: 0.56, games: 267, trend: "up", peakLp: 1700 },
  { rank: 7, pseudo: "Vetheo", league: "LFL", role: "MID", lp: 1654, winrate: 0.58, games: 198, trend: "up", peakLp: 1680 },
  { rank: 8, pseudo: "Sertuss", league: "PRM", role: "MID", lp: 1621, winrate: 0.55, games: 223, trend: "down", peakLp: 1650 },
  { rank: 9, pseudo: "Nuc", league: "LEC", role: "MID", lp: 1598, winrate: 0.54, games: 201, trend: "stable", peakLp: 1620 },
  { rank: 10, pseudo: "Lars", league: "NLC", role: "MID", lp: 1576, winrate: 0.56, games: 178, trend: "up", peakLp: 1600 },
];

const ROLE_COLORS: Record<string, string> = {
  TOP: "bg-red-500/20 text-red-400 border-red-500/30",
  JUNGLE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  MID: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ADC: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  SUPPORT: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-400" />;
  return <Minus className="h-4 w-4 text-text-muted" />;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-300" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-text-muted tabular-nums w-5 text-center">{rank}</span>;
}

export default function SoloqPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const roles = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

  const filtered = MOCK_LADDER.filter((p) => {
    const matchesSearch = p.pseudo.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <PageTitle className="text-text-heading mb-1 flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary-accent" />
          SoloQ Ladder
        </PageTitle>
        <p className="text-text-body">
          Real-time ranked leaderboard across all linked accounts.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={roleFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter(null)}
            className={roleFilter === null ? "bg-primary-accent hover:bg-primary-accent/90" : ""}
          >
            All
          </Button>
          {roles.map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(role)}
              className={roleFilter === role ? "bg-primary-accent hover:bg-primary-accent/90" : ""}
            >
              {role}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold text-primary-accent tabular-nums">1,823</div>
          <div className="text-xs text-text-muted uppercase tracking-wider">Highest LP</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold text-text-heading tabular-nums">234</div>
          <div className="text-xs text-text-muted uppercase tracking-wider">Tracked Players</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">58.2%</div>
          <div className="text-xs text-text-muted uppercase tracking-wider">Avg Winrate</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-2xl font-bold text-amber-400 tabular-nums">12</div>
          <div className="text-xs text-text-muted uppercase tracking-wider">Challengers</div>
        </div>
      </div>

      {/* Ladder Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-surface-hover border-b border-border">
          <Trophy className="h-4 w-4 text-primary-accent" />
          <SectionHeader className="text-primary-accent">Rankings</SectionHeader>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wider">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">League</th>
                <th className="px-4 py-3 text-right">LP</th>
                <th className="px-4 py-3 text-right">Peak</th>
                <th className="px-4 py-3 text-right">Winrate</th>
                <th className="px-4 py-3 text-right">Games</th>
                <th className="px-4 py-3 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((player) => (
                <tr
                  key={player.rank}
                  className="hover:bg-surface-hover transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <RankBadge rank={player.rank} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/players/${player.pseudo.toLowerCase()}`}
                      className="font-semibold text-text-heading hover:text-primary-accent transition-colors"
                    >
                      {player.pseudo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-xs ${ROLE_COLORS[player.role] || ""}`}>
                      {player.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-body">{player.league}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-text-heading tabular-nums">{player.lp}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-text-muted tabular-nums">{player.peakLp}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold tabular-nums ${player.winrate >= 0.55 ? "text-emerald-400" : player.winrate >= 0.5 ? "text-text-heading" : "text-red-400"}`}>
                      {(player.winrate * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-text-muted tabular-nums">{player.games}</td>
                  <td className="px-4 py-3 text-center">
                    <TrendIcon trend={player.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-text-muted">
            No players found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
