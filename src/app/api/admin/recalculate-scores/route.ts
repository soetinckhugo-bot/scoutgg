import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { recalculateAllScores } from "@/lib/server/recalculate-scores";
import { revalidateTag } from "next/cache";
import { logger } from "@/lib/logger";

export async function POST() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { recalculated, totalPlayers } = await recalculateAllScores(10000);

    revalidateTag("players");
    revalidateTag("homepage");

    return NextResponse.json({
      success: true,
      recalculated,
      totalPlayers,
    });
  } catch (error) {
    logger.error("Recalculate scores error:", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to recalculate scores" },
      { status: 500 }
    );
  }
}
