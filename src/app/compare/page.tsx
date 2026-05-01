import { db } from "@/lib/server/db";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_COLORS, STATUS_COLORS } from "@/lib/constants";
import { formatStatus } from "@/lib/utils";
import { ArrowLeft, ExternalLink, Swords } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import RoleRadarChart from "@/components/charts/RoleRadarChart";
import PlayerSelector from "./PlayerSelector";
import { SectionHeader, DataValue, DataLabel } from "@/components/ui/typography";

export const metadata: Metadata = {
  title: "Compare",
  description: "Head-to-head comparison of League of Legends players. Compare stats, performance metrics, and scouting profiles.",
  openGraph: {
    title: "Player Comparison | LeagueScout",
    description: "Head-to-head comparison of League of Legends players.",
    type: "website",
  },
};

interface ComparePageProps {
  searchParams: Promise<{ players?: string }>;
}

async function getPlayersByIds(ids: string[]) {
  const players = await db.player.findMany({
    where: { id: { in: ids } },
    include: { soloqStats: true, proStats: true },
  });
  const orderMap = new Map(ids.map((id, i) => [id, i]));
  return players.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
}

// Colors: Left = blue tint, Right = red tint
const LEFT_TINT = {
  border: "border-blue-500/30",
  bg: "bg-blue-500/5",
  bar: "bg-blue-500",
  barBg: "bg-blue-500/10",
  text: "text-blue-400",
};
const RIGHT_TINT = {
  border: "border-red-500/30",
  bg: "bg-red-500/5",
  bar: "bg-red-500",
  barBg: "bg-red-500/10",
  text: "text-red-400",
};
const TINTS = [LEFT_TINT, RIGHT_TINT];

function StatRow({
  label,
  leftValue,
  rightValue,
  format = (v: number | null) => (v === null ? "—" : String(v)),
  higherIsBetter = true,
}: {
  label: string;
  leftValue: number | null;
  rightValue: number | null;
  format?: (v: number | null) => string;
  higherIsBetter?: boolean;
}) {
  const lv = leftValue === null || leftValue === undefined ? null : Number(leftValue);
  const rv = rightValue === null || rightValue === undefined ? null : Number(rightValue);

  let winner: "left" | "right" | "tie" | null = null;
  if (lv !== null && rv !== null) {
    if (lv === rv) winner = "tie";
    else if (higherIsBetter) winner = lv > rv ? "left" : "right";
    else winner = lv < rv ? "left" : "right";
  }

  const max = Math.max(Math.abs(lv ?? 0), Math.abs(rv ?? 0), 1);
  const leftPct = lv !== null ? (Math.abs(lv) / max) * 100 : 0;
  const rightPct = rv !== null ? (Math.abs(rv) / max) * 100 : 0;

  const leftWins = winner === "left";
  const rightWins = winner === "right";

  return (
    <div className="py-2 border-b border-border last:border-b-0">
      <div className="grid grid-cols-[1fr_40px_1fr] sm:grid-cols-[1fr_60px_1fr] gap-2 sm:gap-4 items-center">
        {/* Left value */}
        <div className="text-left">
          <DataValue highlight={leftWins} className={leftWins ? "text-blue-400" : "text-text-muted"}>
            {format(lv)}
          </DataValue>
        </div>
        {/* Label */}
        <div className="text-center">
          <DataLabel>{label}</DataLabel>
        </div>
        {/* Right value */}
        <div className="text-right">
          <DataValue highlight={rightWins} className={rightWins ? "text-red-400" : "text-text-muted"}>
            {format(rv)}
          </DataValue>
        </div>
      </div>
      {/* Center bars */}
      <div className="flex flex-col gap-1 mt-1.5 px-0">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden flex justify-end">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${Math.min(leftPct, 100)}%` }}
          />
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-red-500 transition-all"
            style={{ width: `${Math.min(rightPct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function CompareSectionHeader({ title }: { title: string }) {
  return (
    <div className="border-l-2 border-text-muted pl-3 mb-2">
      <SectionHeader>{title}</SectionHeader>
    </div>
  );
}

function PlayerHeader({
  player,
  side,
}: {
  player: Awaited<ReturnType<typeof getPlayersByIds>>[number];
  side: "left" | "right";
}) {
  const tint = side === "left" ? LEFT_TINT : RIGHT_TINT;
  const alignClass = side === "left" ? "items-start text-left" : "items-end text-right";

  return (
    <div className={`flex flex-col ${alignClass} p-3 rounded-xl border ${tint.border} ${tint.bg}`}>
      <div className="flex items-center gap-3">
        {player.photoUrl ? (
          <Image
            src={player.photoUrl}
            alt={player.pseudo}
            width={56}
            height={56}
            className="rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="w-[56px] h-[56px] rounded-full bg-muted flex items-center justify-center text-xl font-bold text-text-subtle ring-2 ring-border">
            {(player.pseudo?.[0] ?? "?").toUpperCase()}
          </div>
        )}
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-text-heading">{player.pseudo}</h2>
          {player.realName && <p className="text-xs text-text-muted">{player.realName}</p>}
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`text-xs h-5 px-2 ${ROLE_COLORS[player.role] || "bg-surface-hover"}`}>
              {player.role}
            </Badge>
            <Badge className={`text-xs h-5 px-2 ${STATUS_COLORS[player.status] || "bg-surface-hover"}`}>
              {formatStatus(player.status)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, left, right }: { label: string; left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_50px_1fr] sm:grid-cols-[1fr_80px_1fr] gap-2 sm:gap-4 items-center py-2 border-b border-border last:border-b-0">
      <div className="text-left text-sm text-text-subtle">{left}</div>
      <div className="text-center text-xs text-text-muted uppercase tracking-wider">{label}</div>
      <div className="text-right text-sm text-text-subtle">{right}</div>
    </div>
  );
}

function PlayerLinks({ player }: { player: Awaited<ReturnType<typeof getPlayersByIds>>[number] }) {
  const links = [
    { url: player.opggUrl, label: "op.gg" },
    { url: player.golggUrl, label: "Gol.gg" },
    { url: player.lolprosUrl, label: "LoLPros" },
    { url: player.leaguepediaUrl, label: "Leaguepedia" },
  ].filter((l) => l.url);

  if (links.length === 0) return <span className="text-sm text-text-muted">—</span>;

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-heading transition-colors"
        >
          {link.label}
          <ExternalLink className="h-3 w-3" />
        </a>
      ))}
    </div>
  );
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { players } = await searchParams;

  if (!players) {
    return (
      <div className="min-h-screen bg-background">
        <PlayerSelector />
      </div>
    );
  }

  const ids = players.split(",").filter(Boolean);
  if (ids.length !== 2) {
    notFound();
  }

  const playersData = await getPlayersByIds(ids);
  if (playersData.length !== 2) {
    notFound();
  }

  const [p1, p2] = playersData;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-heading mb-1">Compare Players</h1>
            <p className="text-sm text-text-muted">Head-to-head comparison</p>
          </div>
          <Link href="/players">
            <Button
              variant="outline"
              size="sm"
              className="border-border text-text-subtle hover:bg-surface-hover hover:text-text-heading"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Change Players
            </Button>
          </Link>
        </div>

        {/* Player Headers */}
        <div className="grid grid-cols-[1fr_40px_1fr] sm:grid-cols-[1fr_60px_1fr] gap-2 sm:gap-4 mb-6">
          <PlayerHeader player={p1} side="left" />
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted border border-border flex items-center justify-center">
              <Swords className="h-3 w-3 sm:h-4 sm:w-4 text-text-muted" />
            </div>
          </div>
          <PlayerHeader player={p2} side="right" />
        </div>

        {/* Head to Head Info */}
        <div className="bg-card border border-border rounded-xl p-3 mb-6">
          <CompareSectionHeader title="Head to Head" />
          <InfoRow
            label="Country"
            left={p1.nationality || "—"}
            right={p2.nationality || "—"}
          />
          <InfoRow
            label="Age"
            left={p1.age !== null && p1.age !== undefined ? p1.age : "—"}
            right={p2.age !== null && p2.age !== undefined ? p2.age : "—"}
          />
          <InfoRow label="Role" left={p1.role} right={p2.role} />
          <InfoRow
            label="Team"
            left={p1.currentTeam || "—"}
            right={p2.currentTeam || "—"}
          />
          <InfoRow label="League" left={p1.league} right={p2.league} />
        </div>

        {/* SoloQ Stats */}
        <div className="bg-card border border-border rounded-xl p-3 mb-6">
          <CompareSectionHeader title="SoloQ Stats" />
          <StatRow
            label="Peak LP"
            leftValue={p1.soloqStats?.peakLp ?? null}
            rightValue={p2.soloqStats?.peakLp ?? null}
          />
          <StatRow
            label="Winrate"
            leftValue={p1.soloqStats?.winrate ?? null}
            rightValue={p2.soloqStats?.winrate ?? null}
            format={(v) => (v === null ? "—" : `${(Number(v) * 100).toFixed(1)}%`)}
          />
          <StatRow
            label="Total Games"
            leftValue={p1.soloqStats?.totalGames ?? null}
            rightValue={p2.soloqStats?.totalGames ?? null}
          />
        </div>

        {/* Pro Stats */}
        <div className="bg-card border border-border rounded-xl p-3 mb-6">
          <CompareSectionHeader title="Pro Stats" />
          <StatRow
            label="KDA"
            leftValue={p1.proStats?.kda ?? null}
            rightValue={p2.proStats?.kda ?? null}
            format={(v) => (v === null ? "—" : Number(v).toFixed(2))}
          />
          <StatRow
            label="CSD@15"
            leftValue={p1.proStats?.csdAt15 ?? null}
            rightValue={p2.proStats?.csdAt15 ?? null}
            format={(v) => (v === null ? "—" : `${Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(1)}`)}
          />
          <StatRow
            label="GD@15"
            leftValue={p1.proStats?.gdAt15 ?? null}
            rightValue={p2.proStats?.gdAt15 ?? null}
            format={(v) => (v === null ? "—" : `${Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(0)}`)}
          />
          <StatRow
            label="XPD@15"
            leftValue={p1.proStats?.xpdAt15 ?? null}
            rightValue={p2.proStats?.xpdAt15 ?? null}
            format={(v) => (v === null ? "—" : `${Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(0)}`)}
          />
          <StatRow
            label="DPM"
            leftValue={p1.proStats?.dpm ?? null}
            rightValue={p2.proStats?.dpm ?? null}
            format={(v) => (v === null ? "—" : Number(v).toFixed(0))}
          />
          <StatRow
            label="KP%"
            leftValue={p1.proStats?.kpPercent ?? null}
            rightValue={p2.proStats?.kpPercent ?? null}
            format={(v) => (v === null ? "—" : `${(Number(v) * 100).toFixed(1)}%`)}
          />
          <StatRow
            label="Vision Score"
            leftValue={p1.proStats?.visionScore ?? null}
            rightValue={p2.proStats?.visionScore ?? null}
            format={(v) => (v === null ? "—" : Number(v).toFixed(1))}
          />
          <StatRow
            label="Games Played"
            leftValue={p1.proStats?.gamesPlayed ?? null}
            rightValue={p2.proStats?.gamesPlayed ?? null}
          />
        </div>

        {/* Links */}
        <div className="bg-card border border-border rounded-xl p-3 mb-6">
          <CompareSectionHeader title="Links" />
          <div className="grid grid-cols-2 gap-4">
            <div className="text-left py-2">
              <PlayerLinks player={p1} />
            </div>
            <div className="text-right py-2">
              <PlayerLinks player={p2} />
            </div>
          </div>
        </div>

        {/* Radar Charts */}
        <div className="bg-card border border-border rounded-xl p-3 mb-6">
          <CompareSectionHeader title="General" />
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div>
              <h3 className="text-sm font-bold text-text-heading text-center mb-3">
                {p1.pseudo} — {p1.role}
              </h3>
              <RoleRadarChart role={p1.role} proStats={p1.proStats} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-heading text-center mb-3">
                {p2.pseudo} — {p2.role}
              </h3>
              <RoleRadarChart role={p2.role} proStats={p2.proStats} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
