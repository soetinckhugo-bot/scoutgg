import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { z } from "zod";
import { logger } from "@/lib/logger";

const importSchema = z.object({
  csv: z.string().min(1, "CSV content is required"),
});

async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize = 10
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(`import-oracle:${ip}`, 5, 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = importSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { csv } = parsed.data;
    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
      return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
    }

    const headers = lines[0]
      .split(",")
      .map((h: string) => h.trim().replace(/^"|"$/g, "").toLowerCase());

    // Parse all rows first
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v: string) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h: string, idx: number) => {
        row[h] = values[idx] || "";
      });
      return row;
    });

    // Load all existing players in ONE query
    const pseudos = rows.map((r) => r.player).filter(Boolean);
    const existingPlayers = await db.player.findMany({
      where: { pseudo: { in: pseudos } },
      select: { id: true, pseudo: true },
    });

    const playerByPseudo = new Map(
      existingPlayers.map((p) => [p.pseudo.toLowerCase(), p])
    );

    let imported = 0;

    // Process ProStats upserts in batches
    await batchProcess(
      rows,
      async (row) => {
        const player = playerByPseudo.get(row.player.toLowerCase());
        if (!player) return;

        await db.proStats.upsert({
          where: { playerId: player.id },
          create: {
            playerId: player.id,
            kda: parseFloat(row.kda) || null,
            csdAt15: parseFloat(row.csdat15 || row.csd_at_15) || null,
            gdAt15: parseFloat(row.gdat15 || row.gd_at_15) || null,
            dpm: parseFloat(row.dpm) || null,
            kpPercent: parseFloat(row.kppercent || row.kp_percent) || null,
            visionScore: parseFloat(row.visionscore || row.vision_score) || null,
            gamesPlayed: parseInt(row.games) || null,
            championPool: row.championpool || row.champion_pool || null,
            season: row.season || "2026 Spring",
          },
          update: {
            kda: parseFloat(row.kda) || undefined,
            csdAt15: parseFloat(row.csdat15 || row.csd_at_15) || undefined,
            gdAt15: parseFloat(row.gdat15 || row.gd_at_15) || undefined,
            dpm: parseFloat(row.dpm) || undefined,
            kpPercent: parseFloat(row.kppercent || row.kp_percent) || undefined,
            visionScore: parseFloat(row.visionscore || row.vision_score) || undefined,
            gamesPlayed: parseInt(row.games) || undefined,
            championPool: row.championpool || row.champion_pool || undefined,
            season: row.season || undefined,
          },
        });

        if (row.team || row.league) {
          await db.player.update({
            where: { id: player.id },
            data: {
              currentTeam: row.team || undefined,
              league: row.league || undefined,
            },
          });
        }

        imported++;
      },
      5
    );

    return NextResponse.json({ success: true, imported });
  } catch (error) {
    logger.error("Import error:", { error });
    return NextResponse.json(
      { error: "Import failed", details: String(error) },
      { status: 500 }
    );
  }
}
