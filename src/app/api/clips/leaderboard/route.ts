import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";

function getCurrentMonthPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthPeriod = searchParams.get("month") || getCurrentMonthPeriod();
    const minVotes = parseInt(searchParams.get("minVotes") || "5", 10);

    const clips = await db.clip.findMany({
      where: { isActive: true, monthPeriod },
      include: { votes: { select: { score: true } } },
    });

    const ranked = clips
      .map((clip) => {
        const totalVotes = clip.votes.length;
        const avgScore = totalVotes > 0
          ? clip.votes.reduce((sum, v) => sum + v.score, 0) / totalVotes
          : 0;
        return {
          id: clip.id,
          playerName: clip.playerName,
          playerRole: clip.playerRole,
          title: clip.title,
          youtubeId: clip.youtubeId,
          monthPeriod: clip.monthPeriod,
          isWinner: clip.isWinner,
          createdAt: clip.createdAt,
          totalVotes,
          avgScore: Math.round(avgScore * 10) / 10,
        };
      })
      .filter((c) => c.totalVotes >= minVotes)
      .sort((a, b) => b.avgScore - a.avgScore || b.totalVotes - a.totalVotes);

    return NextResponse.json({ clips: ranked });
  } catch (error: any) {
    logger.error("GET /api/clips/leaderboard failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
