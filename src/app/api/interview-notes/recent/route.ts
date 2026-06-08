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

    const notes = await db.interviewNote.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const userIds = [...new Set(notes.map((n) => n.userId))];
    const playerIds = [...new Set(notes.map((n) => n.playerId))];

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

    const enriched = notes.map((n) => ({
      ...n,
      user: userMap.get(n.userId) || { id: n.userId, name: "Unknown", email: "" },
      player: playerMap.get(n.playerId) || { id: n.playerId, pseudo: "Unknown", role: "", photoUrl: null },
    }));

    return NextResponse.json({ notes: enriched });
  } catch (error) {
    logger.error("GET /api/interview-notes/recent failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch recent interview notes" },
      { status: 500 }
    );
  }
}
