import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";
import { z } from "zod";

const VALID_METRICS = [
  "globalScore",
  "tierScore",
  "dpm",
  "kda",
  "soloKills",
  "damagePercent",
  "vsPercent",
  "cspm",
  "gdAt15",
];

const LeaderboardQuerySchema = z.object({
  season: z.string().max(10).optional(),
  split: z.string().max(20).optional(),
  role: z.string().max(20).optional(),
  nationality: z.string().max(10).optional(),
  ageMin: z.coerce.number().min(0).max(100).optional(),
  ageMax: z.coerce.number().min(0).max(100).optional(),
  league: z.string().max(20).optional(),
  tier: z.string().max(10).optional(),
  metric: z.enum(["globalScore", "tierScore", "dpm", "kda", "soloKills", "damagePercent", "vsPercent", "cspm", "gdAt15"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  page: z.coerce.number().min(1).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = LeaderboardQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      season = "2026",
      split = "ALL",
      role,
      nationality,
      ageMin,
      ageMax,
      league,
      tier,
      metric = "globalScore",
      order = "desc",
      limit = 50,
      page = 1,
    } = parsed.data;

    // Build player filter
    const playerWhere: Record<string, unknown> = {};
    if (role && role !== "ALL") playerWhere.role = role;
    if (nationality && nationality !== "ALL") playerWhere.nationality = nationality;
    if (league && league !== "ALL") playerWhere.league = league;
    if (tier && tier !== "ALL") playerWhere.tier = tier;
    if (ageMin || ageMax) {
      playerWhere.age = {};
      if (ageMin) (playerWhere.age as Record<string, number>).gte = ageMin;
      if (ageMax) (playerWhere.age as Record<string, number>).lte = ageMax;
    }

    const skip = (page - 1) * limit;

    let players: unknown[] = [];
    let total = 0;

    if (split === "ALL") {
      // Query active ProStats
      const proStatsList = await db.proStats.findMany({
        where: {
          player: playerWhere,
          [metric]: { not: null },
        },
        orderBy: { [metric]: order as "asc" | "desc" },
        take: limit,
        skip,
        include: {
          player: {
            include: {
              soloqStats: {
                select: {
                  currentRank: true,
                  peakLp: true,
                  winrate: true,
                  totalGames: true,
                  championPool: true,
                },
              },
            },
          },
        },
      });

      players = proStatsList.map((ps) => ({
        ...ps.player,
        proStats: ps,
      }));

      total = await db.proStats.count({
        where: {
          player: playerWhere,
          [metric]: { not: null },
        },
      });
    } else {
      // Query ProStatsSplit
      const splitStats = await db.proStatsSplit.findMany({
        where: {
          season,
          split,
          player: playerWhere,
          [metric]: { not: null },
        },
        orderBy: { [metric]: order as "asc" | "desc" },
        take: limit,
        skip,
        include: {
          player: {
            include: {
              soloqStats: {
                select: {
                  currentRank: true,
                  peakLp: true,
                  winrate: true,
                  totalGames: true,
                  championPool: true,
                },
              },
            },
          },
        },
      });

      players = splitStats.map((s) => ({
        ...s.player,
        proStats: s,
      }));

      total = await db.proStatsSplit.count({
        where: {
          season,
          split,
          player: playerWhere,
          [metric]: { not: null },
        },
      });
    }

    return NextResponse.json({
      players,
      total,
      page,
      limit,
      season,
      split,
      metric,
      order,
    });
  } catch (error) {
    logger.error("GET /api/leaderboard failed", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
