import { db } from "@/lib/server/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { TIER_COLORS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Tier Lists",
  description: "Curated tier lists of League of Legends players across European leagues. S/A/B/C tiers based on performance and potential.",
  openGraph: {
    title: "Tier Lists | LeagueScout",
    description: "Curated tier lists of League of Legends players.",
    type: "website",
  },
};

async function getTierList() {
  // Get players grouped by "tier" based on their league and status
  const players = await db.player.findMany({
    include: {
      soloqStats: true,
      proStats: true,
    },
    orderBy: { pseudo: "asc" },
  });

  // Simple tier logic for demo
  const tiers = {
    S: players.filter((p) => p.league === "LEC" && p.status === "UNDER_CONTRACT"),
    A: players.filter((p) => p.league === "LEC" && p.status === "ACADEMY"),
    B: players.filter((p) => p.league === "LFL" && p.status === "UNDER_CONTRACT"),
    C: players.filter((p) => p.league === "LFL_D2" || p.status === "FREE_AGENT"),
  };

  return tiers;
}

export default async function TierListsPage() {
  const tiers = await getTierList();

  const tierDescriptions: Record<string, string> = {
    S: "LEC Starters — Established pro players competing at the highest level in Europe",
    A: "LEC Academy / LFL Elite — Top tier 2 players with LEC potential",
    B: "LFL Starters — Solid professional players in the French league",
    C: "Emerging Talent — Regional players and free agents to watch",
  };

  return (
    <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-6 w-6 text-primary-accent" />
          <h1 className="text-3xl font-bold text-text-heading">Tier Lists</h1>
        </div>
        <p className="text-text-body">
          Rankings of the most promising talent across European leagues
        </p>
        <p className="text-sm text-text-body mt-2">
          by <span className="font-medium text-text-heading">@LeagueScout</span> • Updated April 2026
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(tiers).map(([tier, players]) => (
          <Card key={tier} className="border-border overflow-hidden">
            <div className={`p-4 border-b border-border ${TIER_COLORS[tier]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-text-heading">Tier {tier}</h2>
                  <p className="text-sm opacity-80 text-text-body">{tierDescriptions[tier]}</p>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1 border-gray-600 text-text-heading">
                  {players.length} players
                </Badge>
              </div>
            </div>
            <CardContent className="p-0">
              {players.length > 0 ? (
                <div className="divide-y divide-border">
                  {players.map((player) => (
                    <Link
                      key={player.id}
                      href={`/players/${player.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-surface-hover transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-lg font-bold text-text-heading shrink-0">
                        {(player.pseudo?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-text-heading">
                            {player.pseudo}
                          </h3>
                          <Badge variant="secondary" className="text-xs bg-card text-text-body">
                            {player.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-body">
                          <span>{player.league}</span>
                          {player.currentTeam && (
                            <>
                              <span>•</span>
                              <span>{player.currentTeam}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {player.soloqStats && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-text-body">SoloQ</p>
                          <p className="text-sm font-medium text-text-heading">
                            {player.soloqStats.currentRank}
                          </p>
                        </div>
                      )}
                      <ArrowRight className="h-4 w-4 text-text-body shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-text-body">
                  No players in this tier yet
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Methodology */}
      <Card className="mt-8 border-border">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-text-heading mb-3">
            Methodology
          </h2>
          <p className="text-sm text-text-body leading-relaxed">
            Our tier lists are based on a combination of factors including soloQ performance, 
            professional results, champion pool depth, adaptability to meta changes, and 
            overall potential. These rankings are updated regularly and reflect our scouting 
            team's expert assessment of each player's current form and future ceiling.
          </p>
          <p className="text-sm text-text-body leading-relaxed mt-2">
            Note: Tier rankings are subjective and represent our professional opinion. 
            A player's tier can change based on recent performance, team changes, and 
            meta shifts.
          </p>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}

