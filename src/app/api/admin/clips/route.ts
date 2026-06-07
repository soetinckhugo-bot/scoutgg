import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createSchema = z.object({
  playerName: z.string().min(1).max(50),
  playerRole: z.enum(["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]),
  title: z.string().min(1).max(100),
  platform: z.enum(["youtube", "tiktok"]),
  videoId: z.string().min(1).max(50),
  champion: z.string().min(1).max(30).optional(),
  monthPeriod: z.string().regex(/^\d{4}-\d{2}$/),
  isActive: z.boolean().optional(),
  adminNotes: z.string().optional(),
});

export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    const clips = await db.clip.findMany({
      where: month ? { monthPeriod: month } : undefined,
      include: { votes: { select: { score: true } } },
      orderBy: { createdAt: "desc" },
    });

    const clipsWithStats = clips.map((clip) => {
      const totalVotes = clip.votes.length;
      const avgScore = totalVotes > 0
        ? clip.votes.reduce((sum, v) => sum + v.score, 0) / totalVotes
        : 0;
      return {
        ...clip,
        totalVotes,
        avgScore: Math.round(avgScore * 10) / 10,
      };
    });

    return NextResponse.json({ clips: clipsWithStats });
  } catch (error: unknown) {
    logger.error("GET /api/admin/clips failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = createSchema.parse(await request.json());
    const clip = await db.clip.create({ data: body });
    return NextResponse.json({ success: true, clip });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    logger.error("POST /api/admin/clips failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
