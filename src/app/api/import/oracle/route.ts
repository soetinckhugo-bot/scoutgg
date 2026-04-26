import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";
import { z } from "zod";

const importSchema = z.object({
  csv: z.string().min(1, "CSV content is required"),
});

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

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

    const headers = lines[0].split(",").map((h: string) => h.trim().replace(/^"|"$/g, "").toLowerCase());
    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v: string) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h: string, idx: number) => {
        row[h] = values[idx] || "";
      });

      const player = await db.player.findFirst({
        where: {
          pseudo: { contains: row.player },
        },
      });

      if (!player) continue;

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
    }

    return NextResponse.json({ success: true, imported });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed", details: String(error) },
      { status: 500 }
    );
  }
}

