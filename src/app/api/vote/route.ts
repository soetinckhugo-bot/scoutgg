import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const limit = rateLimit(`vote:${userId}`, 10, 60 * 1000);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { clipId, score } = body;

    if (!clipId || typeof score !== "number" || score < 1 || score > 5) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const clip = await db.clip.findUnique({ where: { id: clipId } });
    if (!clip || !clip.isActive) {
      return NextResponse.json({ error: "Clip not found or inactive" }, { status: 404 });
    }

    const vote = await db.clipVote.upsert({
      where: { clipId_userId: { clipId, userId } },
      update: { score },
      create: { clipId, userId, score },
    });

    return NextResponse.json({ success: true, vote });
  } catch (error: any) {
    logger.error("POST /api/vote failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
