import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";
import { logger } from "@/lib/logger";
import crypto from "crypto";

function getIpHash(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function POST(request: Request) {
  try {
    const ipHash = getIpHash(request);
    const limit = rateLimit(`vote:${ipHash}`, 10, 60 * 1000);
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
      where: { clipId_ipHash: { clipId, ipHash } },
      update: { score },
      create: { clipId, ipHash, score },
    });

    return NextResponse.json({ success: true, vote });
  } catch (error: any) {
    logger.error("POST /api/vote failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
