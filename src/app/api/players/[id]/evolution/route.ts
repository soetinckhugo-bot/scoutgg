import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: playerId } = await params;

    const [splits, statHistory] = await Promise.all([
      db.proStatsSplit.findMany({
        where: { playerId },
        orderBy: [{ season: "asc" }, { split: "asc" }],
      }),
      db.statHistory.findMany({
        where: { playerId },
        orderBy: [{ year: "asc" }, { week: "asc" }],
      }),
    ]);

    return NextResponse.json({
      splits: splits.map((s) => ({
        season: s.season,
        split: s.split,
        gamesPlayed: s.gamesPlayed,
        kda: s.kda,
        dpm: s.dpm,
        cspm: s.cspm,
        gdAt15: s.gdAt15,
        kpPercent: s.kpPercent,
        vspm: s.vspm,
        tier: s.tier,
      })),
      statHistory: statHistory.map((h) => ({
        week: h.week,
        year: h.year,
        peakLp: h.peakLp,
        winrate: h.winrate,
        totalGames: h.totalGames,
        kda: h.kda,
        dpm: h.dpm,
        cspm: h.cspm,
        kpPercent: h.kpPercent,
        visionScore: h.visionScore,
      })),
    });
  } catch (error) {
    logger.error("GET /api/players/[id]/evolution failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch evolution data" },
      { status: 500 }
    );
  }
}
