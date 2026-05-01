import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    // Total players
    const totalPlayers = await db.player.count();

    // Players without ProStats
    const playersWithoutStats = await db.player.findMany({
      where: { proStats: null },
      select: { id: true, pseudo: true, league: true, role: true, currentTeam: true },
      orderBy: { league: "asc" },
    });

    // Breakdown by league
    const byLeague: Record<string, number> = {};
    for (const p of playersWithoutStats) {
      const league = p.league || "UNKNOWN";
      byLeague[league] = (byLeague[league] || 0) + 1;
    }

    // Breakdown by role
    const byRole: Record<string, number> = {};
    for (const p of playersWithoutStats) {
      const role = p.role || "UNKNOWN";
      byRole[role] = (byRole[role] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      totalPlayers,
      withoutStats: playersWithoutStats.length,
      percentage: ((playersWithoutStats.length / totalPlayers) * 100).toFixed(1),
      byLeague,
      byRole,
      players: playersWithoutStats.map((p) => ({
        pseudo: p.pseudo,
        league: p.league,
        role: p.role,
        team: p.currentTeam,
      })),
    });
  } catch (error: any) {
    logger.error("Check missing stats error:", { error });
    return NextResponse.json(
      { error: error.message || "Check failed" },
      { status: 500 }
    );
  }
}
