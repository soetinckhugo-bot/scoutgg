import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playerId } = await params;

  try {
    const history = await db.statHistory.findMany({
      where: { playerId },
      orderBy: [{ year: "asc" }, { week: "asc" }],
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching stat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
