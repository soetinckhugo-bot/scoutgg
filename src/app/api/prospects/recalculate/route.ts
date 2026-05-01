import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { computeProspectScore } from "@/lib/prospect-scoring";
import { requireAdmin } from "@/lib/server/auth";
import { logger } from "@/lib/logger";

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

    // Prepare all updates
    const updates = [];
    for (const p of prospects) {
      const ss = p.soloqStats;
      const ps = p.proStats;

      const computed = computeProspectScore({
        peakLp: p.peakElo2Years ?? ss?.peakLp ?? 0,
        currentLeague: p.league,
        bestProResult: p.bestProResult ?? null,
        age: p.age,
        globalScore: ps?.globalScore ?? null,
        eyeTestRating: p.eyeTestRating ?? null,
      });

      updates.push({
        playerId: p.id,
        score: computed.total,
        breakdown: computed.breakdown,
      });
    }

    // Batch update all players
    const BATCH_SIZE = 20;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      await db.$transaction(
        batch.map((u) =>
          db.player.update({
            where: { id: u.playerId },
            data: {
              prospectScore: u.score,
              prospectMetrics: {
                upsert: {
                  create: { ...u.breakdown, lastUpdated: new Date() },
                  update: { ...u.breakdown, lastUpdated: new Date() },
                },
              },
            },
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      recalculated: prospects.length,
    });
  } catch (error) {
    logger.error("Prospect recalculation error:", { error });
    return NextResponse.json(
      { error: "Failed to recalculate prospects" },
      { status: 500 }
    );
  }
}
