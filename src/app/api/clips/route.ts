import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

function getCurrentMonthPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthPeriod = searchParams.get("month") || getCurrentMonthPeriod();
    const period = searchParams.get("period") || "month";
    const role = searchParams.get("role");
    const player = searchParams.get("player");
    const sort = searchParams.get("sort") || "recent";

    const where: Prisma.ClipWhereInput = { isActive: true };
    if (period === "month") {
      where.monthPeriod = monthPeriod;
    }
    if (role) {
      where.playerRole = role;
    }
    if (player) {
      where.playerName = { contains: player };
    }

    const clips = await db.clip.findMany({
      where,
      include: { votes: { select: { score: true } } },
      orderBy: { createdAt: "desc" },
    });

    const clipsWithStats = clips.map((clip) => {
      const totalVotes = clip.votes.length;
      const avgScore = totalVotes > 0
        ? clip.votes.reduce((sum, v) => sum + v.score, 0) / totalVotes
        : 0;
      return {
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
      };
    });

    if (sort === "popular") {
      clipsWithStats.sort((a, b) => b.totalVotes - a.totalVotes);
    } else if (sort === "top") {
      clipsWithStats.sort((a, b) => b.avgScore - a.avgScore || b.totalVotes - a.totalVotes);
    } else if (sort === "player") {
      clipsWithStats.sort((a, b) => a.playerName.localeCompare(b.playerName));
    }
    // "recent" is default (already sorted by createdAt desc)

    return NextResponse.json({ clips: clipsWithStats });
  } catch (error: unknown) {
    logger.error("GET /api/clips failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
