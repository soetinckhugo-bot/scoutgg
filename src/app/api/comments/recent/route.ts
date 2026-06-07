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

    const comments = await db.playerComment.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Enrich with user names and player pseudos
    const userIds = [...new Set(comments.map((c) => c.userId))];
    const playerIds = [...new Set(comments.map((c) => c.playerId))];

    const [users, players] = await Promise.all([
      db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, image: true },
      }),
      db.player.findMany({
        where: { id: { in: playerIds } },
        select: { id: true, pseudo: true, photoUrl: true, role: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const playerMap = new Map(players.map((p) => [p.id, p]));

    const enriched = comments.map((c) => ({
      ...c,
      user: userMap.get(c.userId) || { id: c.userId, name: "Unknown", email: "", image: null },
      player: playerMap.get(c.playerId) || { id: c.playerId, pseudo: "Unknown", photoUrl: null, role: "" },
    }));

    return NextResponse.json({ comments: enriched });
  } catch (error) {
    logger.error("GET /api/comments/recent failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch recent comments" },
      { status: 500 }
    );
  }
}
