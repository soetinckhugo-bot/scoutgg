import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { logger } from "@/lib/logger";
import { z } from "zod";

const InterviewSchema = z.object({
  playerId: z.string().min(1),
  date: z.string().min(1),
  interviewer: z.string().max(100).optional(),
  notes: z.string().max(3000).optional(),
  impression: z.enum(["positive", "neutral", "negative"]).optional(),
  verdict: z.enum(["recommend", "monitor", "reject"]).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId") || undefined;

    const where: Record<string, unknown> = {};
    if (playerId) where.playerId = playerId;

    const notes = await db.interviewNote.findMany({
      where,
      orderBy: { date: "desc" },
      take: 50,
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
    logger.error("GET /api/interview-notes failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch interview notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = InterviewSchema.parse(body);

    const note = await db.interviewNote.create({
      data: {
        ...data,
        userId: session.user.id,
        date: new Date(data.date),
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    logger.error("POST /api/interview-notes failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create interview note" },
      { status: 500 }
    );
  }
}
