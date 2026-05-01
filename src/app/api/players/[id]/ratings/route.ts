import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/lib/server/db";
import { authOptions } from "@/lib/server/auth-options";
import { logger } from "@/lib/logger";

function getUserId(session: any): string | null {
  return session?.user?.email || null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playerId } = await params;

  try {
    const ratings = await db.playerRating.findMany({
      where: { playerId },
      orderBy: { createdAt: "desc" },
    });

    // Calculate averages
    const count = ratings.length;
    const avg =
      count > 0
        ? {
            mechanics:
              Math.round(
                (ratings.reduce((s, r) => s + r.mechanics, 0) / count) * 10
              ) / 10,
            macro:
              Math.round(
                (ratings.reduce((s, r) => s + r.macro, 0) / count) * 10
              ) / 10,
            attitude:
              Math.round(
                (ratings.reduce((s, r) => s + r.attitude, 0) / count) * 10
              ) / 10,
            potential:
              Math.round(
                (ratings.reduce((s, r) => s + r.potential, 0) / count) * 10
              ) / 10,
            overall:
              Math.round(
                (ratings.reduce(
                  (s, r) => s + r.mechanics + r.macro + r.attitude + r.potential,
                  0
                ) /
                  (count * 4)) *
                  10
              ) / 10,
          }
        : null;

    return NextResponse.json({ ratings, count, average: avg });
  } catch (error) {
    logger.error("Error fetching ratings:", { error });
    return NextResponse.json(
      { error: "Failed to fetch ratings" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playerId } = await params;
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { mechanics, macro, attitude, potential, notes } = json;

    // Validate ratings are 1-5
    const validate = (v: any) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 0;
    };

    const rating = await db.playerRating.upsert({
      where: {
        playerId_userId: {
          playerId,
          userId,
        },
      },
      update: {
        mechanics: validate(mechanics),
        macro: validate(macro),
        attitude: validate(attitude),
        potential: validate(potential),
        notes: notes || null,
      },
      create: {
        playerId,
        userId,
        mechanics: validate(mechanics),
        macro: validate(macro),
        attitude: validate(attitude),
        potential: validate(potential),
        notes: notes || null,
      },
    });

    return NextResponse.json(rating);
  } catch (error) {
    logger.error("Error saving rating:", { error });
    return NextResponse.json(
      { error: "Failed to save rating" },
      { status: 500 }
    );
  }
}
