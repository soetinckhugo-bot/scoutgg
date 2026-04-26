import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { withApiAuth, ApiAuthResult } from "@/lib/server/api-auth";

async function handler(
  request: NextRequest,
  auth: ApiAuthResult,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const player = await db.player.findUnique({
    where: { id },
    include: {
      soloqStats: {
        select: {
          currentRank: true,
          peakLp: true,
          winrate: true,
          totalGames: true,
          championPool: true,
          lastUpdated: true,
        },
      },
      proStats: {
        select: {
          kda: true,
          dpm: true,
          gdAt15: true,
          cspm: true,
          wcpm: true,
          visionScore: true,
          fbPercent: true,
        },
      },
      reports: {
        select: {
          id: true,
          title: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!player) {
    return NextResponse.json(
      { error: "Player not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: player });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Manual auth + rate limit
  const { validateApiKey, checkRateLimit, updateApiKeyUsage, hashApiKey } =
    await import("@/lib/server/api-auth");

  const auth = await validateApiKey(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  const keyHash = hashApiKey(request.headers.get("x-api-key")!);
  const rateCheck = checkRateLimit(keyHash, auth.rateLimit);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(auth.rateLimit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rateCheck.resetAt / 1000)),
        },
      }
    );
  }

  await updateApiKeyUsage(keyHash);

  const response = await handler(request, auth, context);

  response.headers.set("X-RateLimit-Limit", String(auth.rateLimit));
  response.headers.set("X-RateLimit-Remaining", String(rateCheck.remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil(rateCheck.resetAt / 1000))
  );

  return response;
}
