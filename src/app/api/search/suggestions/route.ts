import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";
import { z } from "zod";

const SearchQuerySchema = z.object({
  q: z.string().min(2).max(100).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = SearchQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json({ suggestions: [] });
    }
    const q = parsed.data.q?.trim() || "";

    if (q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const players = await db.player.findMany({
      where: {
        OR: [
          { pseudo: { contains: q } },
          { realName: { contains: q } },
        ],
      },
      select: {
        id: true,
        pseudo: true,
        realName: true,
        role: true,
        currentTeam: true,
        photoUrl: true,
      },
      take: 5,
    });

    return NextResponse.json({ suggestions: players });
  } catch (error) {
    logger.error("Error fetching search suggestions:", { error });
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

