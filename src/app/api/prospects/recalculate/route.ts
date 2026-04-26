import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { computeProspectScore } from "@/lib/prospect-scoring";
import { requireAdmin } from "@/lib/server/auth";

export async function POST() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const prospects = await db.player.findMany({
      where: { isProspect: true },
      include: {
        soloqStats: true,
        proStats: true,
        prospectMetrics: true,
      },
    });

    for (const p of prospects) {
      const ss = p.soloqStats;
      const ps = p.proStats;

      if (!ss) continue;

      const computed = computeProspectScore({
        peakLp: ss.peakLp,
        proWinrate: ps?.kda ? 0.55 : null,
        currentLeague: p.league,
        bestProResult: null,
        soloqGames: ss.totalGames,
        age: p.age,
        proChampionPool: ps?.championPool ?? null,
        soloqWinrate: ss.winrate,
        eyeTestRating: null,
      });

      await db.player.update({
        where: { id: p.id },
        data: {
          prospectScore: computed.total,
          prospectMetrics: {
            upsert: {
              create: { ...computed.breakdown, lastUpdated: new Date() },
              update: { ...computed.breakdown, lastUpdated: new Date() },
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      recalculated: prospects.length,
    });
  } catch (error) {
    console.error("Prospect recalculation error:", error);
    return NextResponse.json(
      { error: "Failed to recalculate prospects" },
      { status: 500 }
    );
  }
}

