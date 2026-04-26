import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { computeProspectScore } from "@/lib/prospect-scoring";

const MAJOR_LEAGUES = ["LEC", "LCS", "LCK", "LPL"];
const MAX_AGE = 22;
const PROSPECT_LIMIT = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const role = searchParams.get("role") || undefined;
  const maxAge = searchParams.get("maxAge")
    ? parseInt(searchParams.get("maxAge")!, 10)
    : MAX_AGE;
  const region = searchParams.get("region") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    PROSPECT_LIMIT,
    parseInt(searchParams.get("limit") || "30", 10)
  );
  const skip = (page - 1) * limit;

  const where: any = {
    isProspect: true,
    age: { lte: maxAge },
    NOT: { league: { in: MAJOR_LEAGUES } },
  };

  if (role) where.role = role;
  if (region) where.nationality = region;

  const [players, totalCount] = await Promise.all([
    db.player.findMany({
      where,
      include: {
        soloqStats: true,
        proStats: true,
        prospectMetrics: true,
      },
      orderBy: { prospectScore: "desc" },
      skip,
      take: limit,
    }),
    db.player.count({ where }),
  ]);

  // Enrich with computed score and breakdown if missing
  const enriched = players.map((p) => {
    const ss = p.soloqStats;
    const ps = p.proStats;

    if (p.prospectMetrics && p.prospectScore) {
      return {
        ...p,
        prospectScore: p.prospectScore,
        breakdown: p.prospectMetrics,
      };
    }

    const computed = ss
      ? computeProspectScore({
          peakLp: ss.peakLp,
          proWinrate: ps?.kda ? 0.55 : null, // fallback
          currentLeague: p.league,
          bestProResult: null,
          soloqGames: ss.totalGames,
          age: p.age,
          proChampionPool: ps?.championPool ?? null,
          soloqWinrate: ss.winrate,
          eyeTestRating: null,
        })
      : {
          total: 0,
          breakdown: {
            peakLpScore: 0,
            proWinrateScore: 0,
            currentLeagueScore: 0,
            bestProResultScore: 0,
            soloqGamesScore: 0,
            ageScore: 0,
            proChampionPoolScore: 0,
            soloqWinrateScore: 0,
            eyeTestScore: 0,
          },
        };

    return {
      ...p,
      prospectScore: computed.total,
      breakdown: computed.breakdown,
    };
  });

  return NextResponse.json({
    prospects: enriched,
    totalCount: Math.min(totalCount, PROSPECT_LIMIT),
    page,
    totalPages: Math.ceil(Math.min(totalCount, PROSPECT_LIMIT) / limit),
  });
}

