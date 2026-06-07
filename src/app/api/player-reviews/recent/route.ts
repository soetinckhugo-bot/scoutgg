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

    const reviews = await db.playerReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Enrich with user and player data
    const userIds = [...new Set(reviews.map((r) => r.userId))];
    const playerIds = [...new Set(reviews.map((r) => r.playerId))];

    const [users, players] = await Promise.all([
      db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      }),
      db.player.findMany({
        where: { id: { in: playerIds } },
        select: { id: true, pseudo: true, role: true, photoUrl: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const playerMap = new Map(players.map((p) => [p.id, p]));

    const enriched = reviews.map((r) => ({
      ...r,
      user: userMap.get(r.userId) || { id: r.userId, name: "Unknown", email: "" },
      player: playerMap.get(r.playerId) || { id: r.playerId, pseudo: "Unknown", role: "", photoUrl: null },
    }));

    return NextResponse.json({ reviews: enriched });
  } catch (error) {
    logger.error("GET /api/player-reviews/recent failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch recent reviews" },
      { status: 500 }
    );
  }
}
