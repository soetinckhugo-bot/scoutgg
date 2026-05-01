import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";
import { logger } from "@/lib/logger";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const players = await db.player.findMany({
      where: {
        contractEndDate: {
          not: null,
          lte: ninetyDaysFromNow,
          gte: new Date(),
        },
      },
      select: {
        id: true,
        pseudo: true,
        role: true,
        league: true,
        currentTeam: true,
        contractEndDate: true,
      },
      orderBy: {
        contractEndDate: "asc",
      },
    });

    const playersWithDays = players.map((player) => ({
      ...player,
      daysUntil: Math.ceil(
        (+new Date(player.contractEndDate!) - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return NextResponse.json({ players: playersWithDays });
  } catch (error) {
    logger.error("Error fetching contract expiry:", { error });
    return NextResponse.json(
      { error: "Failed to fetch contract expiry data" },
      { status: 500 }
    );
  }
}
