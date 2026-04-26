import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { withApiAuth } from "@/lib/server/api-auth";

export const GET = withApiAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const role = searchParams.get("role");
  const league = searchParams.get("league");
  const search = searchParams.get("search");
  const skip = (page - 1) * limit;

  const where: any = {};
  if (role) where.role = role;
  if (league) where.league = league;
  if (search) {
    where.pseudo = { contains: search };
  }

  const [players, totalCount] = await Promise.all([
    db.player.findMany({
      where,
      include: {
        soloqStats: {
          select: {
            currentRank: true,
            peakLp: true,
            winrate: true,
            totalGames: true,
            lastUpdated: true,
          },
        },
        proStats: {
          select: {
            kda: true,
            dpm: true,
            gdAt15: true,
            cspm: true,
            wcpm: true,
          },
        },
      },
      orderBy: { pseudo: "asc" },
      skip,
      take: limit,
    }),
    db.player.count({ where }),
  ]);

  return NextResponse.json({
    data: players,
    meta: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
});

