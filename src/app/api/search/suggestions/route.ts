import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

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
    console.error("Error fetching search suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}

