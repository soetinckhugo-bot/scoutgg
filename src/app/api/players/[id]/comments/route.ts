import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { logger } from "@/lib/logger";
import { z } from "zod";

const CommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: playerId } = await params;

    const comments = await db.playerComment.findMany({
      where: { playerId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Enrich with user names
    const userIds = [...new Set(comments.map((c) => c.userId))];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = comments.map((c) => ({
      ...c,
      user: userMap.get(c.userId) || { id: c.userId, name: "Unknown", email: "", image: null },
    }));

    return NextResponse.json({ comments: enriched });
  } catch (error) {
    logger.error("GET /api/players/[id]/comments failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: playerId } = await params;
    const body = await request.json();
    const data = CommentSchema.parse(body);

    const comment = await db.playerComment.create({
      data: {
        playerId,
        userId: session.user.id,
        content: data.content,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    logger.error("POST /api/players/[id]/comments failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create comment" },
      { status: 500 }
    );
  }
}
