import { db } from "@/lib/server/db";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
// Card kept only for podium cards (featured/clickable)
import { cache } from "react";
import type { Metadata } from "next";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Info,
} from "lucide-react";
import { ROLES } from "@/lib/constants";
import Flag from "@/components/Flag";

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

const getProspects = cache(async (searchParams: {
    role?: string;
    region?: string;
  }) => {
    const where: any = {
      isProspect: true,
      hasPlayedInMajorLeague: false,
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
  }
);

function TrendIndicator({ trend }: { trend: string | null }) {
  if (trend === "up")
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">
        <TrendingUp className="h-3 w-3" />
      </span>
    );
  if (trend === "down")
    return (
      <span className="inline-flex items-center gap-0.5 text-red-400 text-xs font-bold bg-red-500/10 px-2 py-1 rounded">
        <TrendingDown className="h-3 w-3" />
      </span>
    );
  if (trend === "new")
    return (
      <span className="inline-flex items-center gap-0.5 text-blue-400 text-xs font-bold bg-blue-500/10 px-2 py-1 rounded">
        <Sparkles className="h-3 w-3" /> NEW
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-text-body text-xs bg-surface-hover px-2 py-1 rounded">
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

  const rankBg = isFirst
    ? "bg-yellow-500/10 border-yellow-500/30"
    : isSecond
    ? "bg-slate-400/10 border-slate-400/30"
    : "bg-amber-500/10 border-amber-500/30";
  const rankText = isFirst
    ? "text-yellow-500"
    : isSecond
    ? "text-slate-400"
    : "text-amber-400";

  const score = player.prospectScore;
  const scoreDisplay = score != null ? `${Math.round(score)}/100` : "—";

  return (
    <Link href={`/players/${player.id}`} className="group block">
      <Card
        className={`border-2 ${rankBg} transition-all duration-200 group-hover:shadow-md h-full`}
      >
        <CardContent className="p-5 flex flex-col items-center text-center">
          {/* Rank number */}
          <div className={`text-2xl font-bold ${rankText} mb-2`}>
            #{rank}
          </div>

          {/* Photo */}
          <div className="mb-3">
            {player.prospectPhotoUrl || player.photoUrl ? (
              <Image
                src={player.prospectPhotoUrl || player.photoUrl}
                alt={player.pseudo}
                width={80}
                height={80}
                className="rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center text-2xl font-bold text-text-heading border-2 border-border">
                {(player.pseudo?.[0] ?? "?").toUpperCase()}
              </div>
            )}
          </div>

          {/* Flag + Name */}
          <div className="flex items-center gap-2 mb-1">
            <Flag code={player.nationality?.toLowerCase()} />
            <h3 className="font-bold text-text-heading text-base">
              {player.pseudo}
            </h3>
          </div>

          <p className="text-xs text-text-body mb-1">
            {player.realName || "—"}
          </p>

          {/* Age • Team • League */}
          <p className="text-xs text-text-muted mb-2">
            {player.age ? `${player.age} yo` : "—"}
            {" · "}
            {player.currentTeam || "Free agent"}
            {" · "}
            {player.league}
          </p>

          {/* Role + Score */}
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="secondary"
              className="text-xs bg-surface-hover text-text-body"
            >
              {player.role}
            </Badge>
            <span className="text-xs font-bold text-primary-accent tabular-nums">
              {scoreDisplay}
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
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-surface-hover ${
          index % 2 === 0 ? "bg-background/50" : ""
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
                  ? "text-text-body"
                  : "text-amber-400"
              }`}
            >
              {rank}
            </span>
          ) : (
            <span className="text-sm font-bold text-text-body tabular-nums">
              {rank}
            </span>
          )}
        </div>

        {/* Trend */}
        <div className="w-12 shrink-0">
          <TrendIndicator trend={player.prospectTrend} />
        </div>

        {/* Flag */}
        <span className="w-6 text-center shrink-0">
          <Flag code={player.nationality?.toLowerCase()} />
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
            <div className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center text-xs font-bold text-text-heading">
              {(player.pseudo?.[0] ?? "?").toUpperCase()}
            </div>
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-heading text-sm truncate">
              {player.pseudo}
            </span>
            <Badge
              variant="secondary"
              className="text-xs h-4 px-1 bg-surface-hover text-text-body border-0"
            >
              {player.role}
            </Badge>
          </div>
          <p className="text-xs text-text-body truncate">
            {player.realName || "—"} • {player.currentTeam || "No team"} •{" "}
            {player.league}
          </p>
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          {player.prospectScore != null ? (
            <>
              <span className="text-sm font-bold text-primary-accent tabular-nums">
                {Math.round(player.prospectScore)}
              </span>
              <span className="text-xs text-text-muted ml-0.5">/100</span>
            </>
          ) : (
            <span className="text-xs text-text-muted">—</span>
          )}
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
    <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Star className="h-6 w-6 text-primary-accent" />
          <h1 className="text-3xl font-bold text-text-heading tracking-tight">
            Top 30 Prospects
          </h1>
        </div>
        <p className="text-text-body text-sm">
          Season 1:{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <p className="text-text-muted text-xs mt-1 max-w-md mx-auto">
          Top prospects from regional leagues who haven't played in a major
          league yet, ranked by our scouting algorithm. Each prospect is scored
          out of <strong>100 points</strong> combining SoloQ peak, pro results,
          age potential, league level, overall performance, and scout evaluation.{" "}
          <Link href="/scoring" className="text-primary-accent hover:underline">
            Learn more →
          </Link>
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
                ? "bg-primary-accent text-text-heading border-0"
                : "border-border text-text-body hover:bg-surface-hover"
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
                  ? "bg-primary-accent text-text-heading border-0"
                  : "border-border text-text-body hover:bg-surface-hover"
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
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-3 px-4 py-3 bg-surface-hover border-b border-border text-xs font-semibold text-text-body uppercase">
          <div className="w-8 text-center">#</div>
          <div className="w-12"></div>
          <div className="w-6"></div>
          <div className="w-9"></div>
          <div className="flex-1">Player</div>
          <div className="text-right shrink-0 w-14">Score</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {rest.map((player, i) => (
            <ProspectRow key={player.id} player={player} index={i} />
          ))}
        </div>
      </div>

      {players.length === 0 && (
        <div className="text-center py-16">
          <Star className="h-8 w-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-body text-lg">
            No prospects found.
          </p>
        </div>
      )}
    </div>
    </div>
  );
}

