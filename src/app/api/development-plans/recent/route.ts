import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await db.developmentPlan.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Enrich with player data
    const playerIds = [...new Set(plans.map((p) => p.playerId))];
    const players = await db.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, pseudo: true, role: true, photoUrl: true },
    });
    const playerMap = new Map(players.map((p) => [p.id, p]));

    const enriched = plans.map((p) => ({
      ...p,
      player: playerMap.get(p.playerId) || { id: p.playerId, pseudo: "Unknown", role: "", photoUrl: null },
    }));

    return NextResponse.json({ plans: enriched });
  } catch (error) {
    logger.error("GET /api/development-plans/recent failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch recent plans" },
      { status: 500 }
    );
  }
}
