import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const clip = await db.clip.findUnique({
      where: { id },
      include: { votes: { select: { score: true } } },
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const totalVotes = clip.votes.length;
    const avgScore = totalVotes > 0
      ? clip.votes.reduce((sum, v) => sum + v.score, 0) / totalVotes
      : 0;

    return NextResponse.json({
      clip: {
        id: clip.id,
        playerName: clip.playerName,
        playerRole: clip.playerRole,
        champion: clip.champion,
        title: clip.title,
        platform: clip.platform,
        videoId: clip.videoId,
        monthPeriod: clip.monthPeriod,
        isActive: clip.isActive,
        isWinner: clip.isWinner,
        adminNotes: clip.adminNotes,
        createdAt: clip.createdAt,
        totalVotes,
        avgScore: Math.round(avgScore * 10) / 10,
      },
    });
  } catch (error: any) {
    logger.error("GET /api/clips/:id failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
