import { db } from "@/lib/server/db";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
// Card kept only for podium cards (featured/clickable)
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Trophy,
  Medal,
  Award,
} from "lucide-react";
import { ROLES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Prospects",
  description: "Discover the next generation of League of Legends talent. Top prospects from European Regional Leagues ranked by our scouting algorithm.",
  openGraph: {
    title: "Top Prospects | LeagueScout",
    description: "Discover the next generation of League of Legends talent.",
    type: "website",
  },
};

const MAJOR_LEAGUES = ["LEC", "LCS", "LCK", "LPL"];
const MAX_AGE = 20;
const PROSPECT_LIMIT = 30;

const REGIONS = [
  { value: "FR", label: "France", flag: "🇫🇷" },
  { value: "DE", label: "Germany", flag: "🇩🇪" },
  { value: "ES", label: "Spain", flag: "🇪🇸" },
  { value: "PL", label: "Poland", flag: "🇵🇱" },
  { value: "DK", label: "Denmark", flag: "🇩🇰" },
  { value: "SE", label: "Sweden", flag: "🇸🇪" },
  { value: "KR", label: "Korea", flag: "🇰🇷" },
  { value: "CN", label: "China", flag: "🇨🇳" },
  { value: "HR", label: "Croatia", flag: "🇭🇷" },
  { value: "NO", label: "Norway", flag: "🇳🇴" },
  { value: "NL", label: "Netherlands", flag: "🇳🇱" },
  { value: "UZ", label: "Uzbekistan", flag: "🇺🇿" },
  { value: "BG", label: "Bulgaria", flag: "🇧🇬" },
];

function getFlag(nationality: string): string {
  const region = REGIONS.find((r) => r.value === nationality);
  return region?.flag || "🏳️";
}

const getProspects = unstable_cache(
  async (searchParams: {
    role?: string;
    region?: string;
  }) => {
    const where: any = {
      isProspect: true,
      age: { lte: MAX_AGE },
      NOT: { league: { in: MAJOR_LEAGUES } },
    };

    if (searchParams.role) where.role = searchParams.role;
    if (searchParams.region) where.nationality = searchParams.region;

    const players = await db.player.findMany({
      where,
      include: {
        soloqStats: true,
        proStats: true,
        prospectMetrics: true,
      },
      orderBy: { prospectScore: "desc" },
      take: PROSPECT_LIMIT,
    });

    const ranked = players.map((p, i) => ({
      ...p,
      displayRank: p.prospectRank ?? i + 1,
    }));

    return ranked;
  },
  ["prospects"],
  { revalidate: 300 }
);

function TrendIndicator({ trend }: { trend: string | null }) {
  if (trend === "up")
    return (
      <span className="inline-flex items-center gap-0.5 text-green-600 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
        <TrendingUp className="h-3 w-3" />
      </span>
    );
  if (trend === "down")
    return (
      <span className="inline-flex items-center gap-0.5 text-red-500 text-xs font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
        <TrendingDown className="h-3 w-3" />
      </span>
    );
  if (trend === "new")
    return (
      <span className="inline-flex items-center gap-0.5 text-blue-600 text-xs font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
        <Sparkles className="h-3 w-3" /> NEW
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-gray-400 text-xs bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
      <Minus className="h-3 w-3" />
    </span>
  );
}

function PodiumCard({
  player,
  rank,
}: {
  player: any;
  rank: number;
}) {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  const RankIcon = isFirst ? Trophy : isSecond ? Medal : Award;
  const rankColor = isFirst
    ? "text-yellow-500"
    : isSecond
    ? "text-gray-400"
    : "text-amber-600";
  const rankBg = isFirst
    ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
    : isSecond
    ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
    : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800";

  return (
    <Link href={`/players/${player.id}`} className="group block">
      <Card
        className={`border-2 ${rankBg} transition-all duration-200 group-hover:shadow-md h-full`}
      >
        <CardContent className="p-5 flex flex-col items-center text-center">
          {/* Rank */}
          <div className={`mb-3 ${rankColor}`}>
            <RankIcon className="h-8 w-8" />
          </div>

          {/* Photo */}
          <div className="mb-3">
            {player.prospectPhotoUrl || player.photoUrl ? (
              <Image
                src={player.prospectPhotoUrl || player.photoUrl}
                alt={player.pseudo}
                width={80}
                height={80}
                className="rounded-full object-cover border-2 border-[#E9ECEF] dark:border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#1A1A2E] flex items-center justify-center text-2xl font-bold text-white border-2 border-[#E9ECEF] dark:border-gray-700">
                {(player.pseudo?.[0] ?? "?").toUpperCase()}
              </div>
            )}
          </div>

          {/* Flag + Name */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getFlag(player.nationality)}</span>
            <h3 className="font-bold text-[#1A1A2E] dark:text-white text-base">
              {player.pseudo}
            </h3>
          </div>

          <p className="text-xs text-[#6C757D] dark:text-gray-400 mb-2">
            {player.realName || "—"}
          </p>

          {/* Role + Score */}
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="secondary"
              className="text-xs bg-[#F8F9FA] dark:bg-[#1e293b] text-[#6C757D] dark:text-gray-400"
            >
              {player.role}
            </Badge>
            <span className="text-xs font-bold text-[#E94560] tabular-nums">
              {player.prospectScore?.toFixed(0)}/100
            </span>
          </div>

          {/* Trend */}
          <TrendIndicator trend={player.prospectTrend} />
        </CardContent>
      </Card>
    </Link>
  );
}

function ProspectRow({
  player,
  index,
}: {
  player: any;
  index: number;
}) {
  const rank = player.displayRank;

  return (
    <Link href={`/players/${player.id}`}>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b] ${
          index % 2 === 0 ? "bg-white dark:bg-[#0f172a]/50" : ""
        }`}
      >
        {/* Rank */}
        <div className="w-8 text-center shrink-0">
          {rank <= 3 ? (
            <span
              className={`text-sm font-bold ${
                rank === 1
                  ? "text-yellow-500"
                  : rank === 2
                  ? "text-gray-400"
                  : "text-amber-600"
              }`}
            >
              {rank}
            </span>
          ) : (
            <span className="text-sm font-bold text-[#6C757D] dark:text-gray-400 tabular-nums">
              {rank}
            </span>
          )}
        </div>

        {/* Trend */}
        <div className="w-12 shrink-0">
          <TrendIndicator trend={player.prospectTrend} />
        </div>

        {/* Flag */}
        <span className="text-base w-6 text-center shrink-0">
          {getFlag(player.nationality)}
        </span>

        {/* Photo */}
        <div className="shrink-0">
          {player.prospectPhotoUrl || player.photoUrl ? (
            <Image
              src={player.prospectPhotoUrl || player.photoUrl}
              alt={player.pseudo}
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#F8F9FA] dark:bg-[#1e293b] flex items-center justify-center text-xs font-bold text-[#1A1A2E] dark:text-white">
              {(player.pseudo?.[0] ?? "?").toUpperCase()}
            </div>
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1A1A2E] dark:text-white text-sm truncate">
              {player.pseudo}
            </span>
            <Badge
              variant="secondary"
              className="text-xs h-4 px-1 bg-[#F8F9FA] dark:bg-[#1e293b] text-[#6C757D] dark:text-gray-400 border-0"
            >
              {player.role}
            </Badge>
          </div>
          <p className="text-xs text-[#6C757D] dark:text-gray-400 truncate">
            {player.realName || "—"} • {player.currentTeam || "No team"} •{" "}
            {player.league}
          </p>
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          <span className="text-sm font-bold text-[#E94560] tabular-nums">
            {player.prospectScore?.toFixed(0)}
          </span>
          <span className="text-xs text-[#6C757D] dark:text-gray-500 ml-0.5">
            /100
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function ProspectsPage(props: {
  searchParams: Promise<{
    role?: string;
    region?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const players = await getProspects(searchParams);

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Star className="h-6 w-6 text-[#E94560] fill-[#E94560]" />
          <h1 className="text-3xl font-bold text-[#1A1A2E] dark:text-white tracking-tight">
            Top 30 Prospects
          </h1>
        </div>
        <p className="text-[#6C757D] dark:text-gray-400 text-sm">
          Season 1:{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <p className="text-[#6C757D] dark:text-gray-500 text-xs mt-1 max-w-md mx-auto">
          The most promising players under 20 who have never played in a major
          league. Scored out of 100 by the LeagueScout team.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <Link href="/prospects">
          <Badge
            variant={
              !searchParams.role && !searchParams.region ? "default" : "outline"
            }
            className={`cursor-pointer text-xs ${
              !searchParams.role && !searchParams.region
                ? "bg-[#E94560] text-white border-0"
                : "border-[#E9ECEF] dark:border-gray-700 text-[#6C757D] dark:text-gray-400 hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b]"
            }`}
          >
            All
          </Badge>
        </Link>
        {ROLES.map((role) => (
          <Link key={role} href={`/prospects?role=${role}`}>
            <Badge
              variant={searchParams.role === role ? "default" : "outline"}
              className={`cursor-pointer text-xs ${
                searchParams.role === role
                  ? "bg-[#E94560] text-white border-0"
                  : "border-[#E9ECEF] dark:border-gray-700 text-[#6C757D] dark:text-gray-400 hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b]"
              }`}
            >
              {role}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Podium */}
      {top3.length > 0 && !searchParams.role && !searchParams.region && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
          {top3.map((player, i) => (
            <PodiumCard key={player.id} player={player} rank={i + 1} />
          ))}
        </div>
      )}

      {/* List */}
      <div className="rounded-lg border border-[#E9ECEF] dark:border-gray-700 overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#F8F9FA] dark:bg-[#1e293b] border-b border-[#E9ECEF] dark:border-gray-700 text-xs font-semibold text-[#6C757D] dark:text-gray-400 uppercase">
          <div className="w-8 text-center">#</div>
          <div className="w-12"></div>
          <div className="w-6"></div>
          <div className="w-9"></div>
          <div className="flex-1">Player</div>
          <div className="text-right shrink-0 w-14">Score</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#E9ECEF] dark:divide-gray-800">
          {rest.map((player, i) => (
            <ProspectRow key={player.id} player={player} index={i} />
          ))}
        </div>
      </div>

      {players.length === 0 && (
        <div className="text-center py-16">
          <Star className="h-12 w-12 text-[#E9ECEF] dark:text-gray-700 mx-auto mb-4" />
          <p className="text-[#6C757D] dark:text-gray-400 text-lg">
            No prospects found.
          </p>
        </div>
      )}
    </div>
  );
}

