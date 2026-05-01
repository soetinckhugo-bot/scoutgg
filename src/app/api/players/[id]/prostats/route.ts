import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { ProStatsUpdateSchema } from "@/lib/schemas";
import { requireAdmin } from "@/lib/server/auth";
import { logger } from "@/lib/logger";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const json = await request.json();
    const parsed = ProStatsUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const body = parsed.data;

    // Build update/create data dynamically
    const data: Record<string, unknown> = {};
    const fields = [
      "kda", "csdAt15", "gdAt15", "xpdAt15", "cspm", "gpm", "dpm",
      "kpPercent", "wpm", "wcpm",
      "fbParticipation", "fbVictim",
      "damagePercent", "goldPercent", "soloKills", "winRate",
      "gamesPlayed", "season", "split",
    ] as const;

    for (const field of fields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    const proStats = await db.proStats.upsert({
      where: { playerId: id },
      create: {
        playerId: id,
        season: body.season || "2026",
        split: body.split || null,
        ...data,
      },
      update: data,
    });

    return NextResponse.json(proStats);
  } catch (error) {
    logger.error("Error updating pro stats:", { error });
    return NextResponse.json(
      { error: "Failed to update pro stats" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season");
    const split = searchParams.get("split");

    // If season+split specified, fetch from ProStatsSplit
    if (season && split) {
      const proStatsSplit = await db.proStatsSplit.findUnique({
        where: {
          playerId_season_split: {
            playerId: id,
            season,
            split,
          },
        },
      });

      if (proStatsSplit) {
        return NextResponse.json(proStatsSplit);
      }
    }

    // Default: fetch active ProStats
    const [proStats, player] = await Promise.all([
      db.proStats.findFirst({ where: { playerId: id }, orderBy: [{ season: "desc" }, { split: "desc" }] }),
      db.player.findUnique({ where: { id }, select: { pseudo: true, league: true, tier: true, role: true } }),
    ]);

    if (!proStats) {
      return NextResponse.json({ error: "Pro stats not found" }, { status: 404 });
    }

    return NextResponse.json({ proStats, player });
  } catch (error) {
    logger.error("Error fetching pro stats:", { error });
    return NextResponse.json(
      { error: "Failed to fetch pro stats" },
      { status: 500 }
    );
  }
}
