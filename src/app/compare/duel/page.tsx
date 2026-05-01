import { Suspense } from "react";
import { db } from "@/lib/server/db";
import { notFound } from "next/navigation";
import VsDuelCard from "@/components/VsDuelCard";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VS Duel | LeagueScout",
  description: "Side-by-side visual duel comparison of League of Legends players. Stats, radars, and scouting metrics in a head-to-head card layout.",
};

interface DuelPageProps {
  searchParams: Promise<{
    p1?: string;
    p2?: string;
  }>;
}

async function DuelContent({ searchParams }: DuelPageProps) {
  const { p1, p2 } = await searchParams;

  if (!p1 || !p2) {
    return (
      <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-text-heading mb-4">VS Duel Mode</h1>
        <p className="text-text-body">
          Select two players to compare. Add <code>?p1=ID1&p2=ID2</code> to the URL.
        </p>
      </div>
      </div>
    );
  }

  const [player1Data, player2Data, allPlayers] = await Promise.all([
    db.player.findUnique({
      where: { id: p1 },
      include: { proStats: true },
    }),
    db.player.findUnique({
      where: { id: p2 },
      include: { proStats: true },
    }),
    db.player.findMany({
      where: { proStats: { isNot: null } },
      include: { proStats: true },
    }),
  ]);

  if (!player1Data || !player2Data) {
    notFound();
  }

  // Convert proStats to flat stats record
  const stats1 = player1Data.proStats
    ? (Object.fromEntries(
        Object.entries(player1Data.proStats).filter(([k]) => k !== "id" && k !== "playerId")
      ) as Record<string, number | string | null>)
    : {};

  const stats2 = player2Data.proStats
    ? (Object.fromEntries(
        Object.entries(player2Data.proStats).filter(([k]) => k !== "id" && k !== "playerId")
      ) as Record<string, number | string | null>)
    : {};

  const duelPlayer1 = {
    id: player1Data.id,
    pseudo: player1Data.pseudo,
    role: player1Data.role,
    photoUrl: player1Data.photoUrl,
    stats: stats1,
  };

  const duelPlayer2 = {
    id: player2Data.id,
    pseudo: player2Data.pseudo,
    role: player2Data.role,
    photoUrl: player2Data.photoUrl,
    stats: stats2,
  };

  // Convert allPlayers to plain objects for percentile calc
  const allPlayersPlain = allPlayers.map((p) => ({
    id: p.id,
    pseudo: p.pseudo,
    role: p.role,
    ...(p.proStats
      ? Object.fromEntries(Object.entries(p.proStats).filter(([k]) => k !== "id" && k !== "playerId"))
      : {}),
  }));

  return (
    <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-4xl px-4 py-8">
      <VsDuelCard
        player1={duelPlayer1}
        player2={duelPlayer2}
        allPlayers={allPlayersPlain}
      />
    </div>
    </div>
  );
}

export default function DuelPage(props: DuelPageProps) {
  return (
    <div className="min-h-screen bg-background">
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary-accent" />
        </div>
      }
    >
      <DuelContent {...props} />
    </Suspense>
    </div>
  );
}
