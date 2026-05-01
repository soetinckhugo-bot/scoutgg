import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const splits = await db.proStatsSplit.findMany({
      where: { playerId: id },
      select: { season: true, split: true },
      orderBy: [{ season: "desc" }, { split: "desc" }],
    });

    return NextResponse.json({ splits });
  } catch (error) {
    logger.error("Error fetching pro stats splits:", { error });
    return NextResponse.json(
      { error: "Failed to fetch splits" },
      { status: 500 }
    );
  }
}
