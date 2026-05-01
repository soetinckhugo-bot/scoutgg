/**
 * API de sync des rosters depuis Leaguepedia
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { syncRostersWithLeaguepedia } from "@/lib/leaguepedia";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { league, year, split } = body;

    if (!league || !year || !split) {
      return NextResponse.json(
        { error: "league, year, and split are required" },
        { status: 400 }
      );
    }

    const result = await syncRostersWithLeaguepedia(league, year, split);

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error("Sync rosters error:", { error });
    return NextResponse.json(
      { error: error.message || "Sync failed" },
      { status: 500 }
    );
  }
}
