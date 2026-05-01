import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playerId } = await params;

  try {
    const history = await db.statHistory.findMany({
      where: { playerId },
      orderBy: [{ year: "asc" }, { week: "asc" }],
      take: 100,
    });

    return NextResponse.json({ history });
  } catch (error) {
    logger.error("Error fetching stat history:", { error });
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
