import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ReviewSchema = z.object({
  playerId: z.string().min(1),
  week: z.number().int().min(1).max(53),
  year: z.number().int().min(2020).max(2100),
  mechanics: z.number().int().min(0).max(5).default(0),
  macro: z.number().int().min(0).max(5).default(0),
  attitude: z.number().int().min(0).max(5).default(0),
  communication: z.number().int().min(0).max(5).default(0),
  notes: z.string().max(2000).optional(),
  goals: z.string().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId") || undefined;
    const week = searchParams.get("week") ? parseInt(searchParams.get("week")!, 10) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;

    const where: Record<string, unknown> = {};
    if (playerId) where.playerId = playerId;
    if (week !== undefined) where.week = week;
    if (year !== undefined) where.year = year;

    const reviews = await db.playerReview.findMany({
      where,
      orderBy: [{ year: "desc" }, { week: "desc" }],
      take: 50,
    });

    // Enrich with user names
    const userIds = [...new Set(reviews.map((r) => r.userId))];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Enrich with player names
    const playerIds = [...new Set(reviews.map((r) => r.playerId))];
    const players = await db.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, pseudo: true, role: true, photoUrl: true },
    });
    const playerMap = new Map(players.map((p) => [p.id, p]));

    const enriched = reviews.map((r) => ({
      ...r,
      user: userMap.get(r.userId) || { id: r.userId, name: "Unknown", email: "" },
      player: playerMap.get(r.playerId) || { id: r.playerId, pseudo: "Unknown", role: "", photoUrl: null },
    }));

    return NextResponse.json({ reviews: enriched });
  } catch (error) {
    logger.error("GET /api/player-reviews failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch reviews" },
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
    const data = ReviewSchema.parse(body);

    // Check if review already exists for this player/week/year/user
    const existing = await db.playerReview.findUnique({
      where: {
        playerId_userId_week_year: {
          playerId: data.playerId,
          userId: session.user.id,
          week: data.week,
          year: data.year,
        },
      },
    });

    if (existing) {
      // Update existing review
      const review = await db.playerReview.update({
        where: { id: existing.id },
        data: {
          mechanics: data.mechanics,
          macro: data.macro,
          attitude: data.attitude,
          communication: data.communication,
          notes: data.notes,
          goals: data.goals,
        },
      });
      return NextResponse.json(review);
    }

    const review = await db.playerReview.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    logger.error("POST /api/player-reviews failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create review" },
      { status: 500 }
    );
  }
}
