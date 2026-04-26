import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";
import { parseCsv, normalizeRole, parseProStatsFromRow } from "@/lib/csv-parser";
import { calculateScores, type PlayerData } from "@/lib/scoring";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const league = (formData.get("league") as string) || "ROL";
    const season = (formData.get("season") as string) || "2026";
    const split = (formData.get("split") as string) || "Winter";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const content = await file.text();
    const rows = parseCsv(content);

    // Phase 1: Create/update all players and store their stats
    const playerDataList: Array<{
      pseudo: string;
      role: string;
      stats: ReturnType<typeof parseProStatsFromRow>;
      playerId: string;
    }> = [];

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
      players: [] as string[],
    };

    for (const row of rows) {
      const pseudo = row.Player?.trim();
      if (!pseudo) continue;

      try {
        const stats = parseProStatsFromRow(row);
        const role = normalizeRole(row.Pos || "TOP");

        // Check if player exists
        let player = await db.player.findFirst({
          where: { pseudo: { equals: pseudo } },
        });

        if (!player) {
          player = await db.player.create({
            data: {
              pseudo,
              role,
              league,
              currentTeam: row.Team || null,
              status: "SCOUTING",
            },
          });
          results.created++;
        } else {
          await db.player.update({
            where: { id: player.id },
            data: {
              league,
              currentTeam: row.Team || player.currentTeam,
            },
          });
          results.updated++;
        }

        results.players.push(pseudo);
        playerDataList.push({ pseudo, role, stats, playerId: player.id });

        // Create/update ProStats without scores first
        await db.proStats.upsert({
          where: { playerId: player.id },
          update: {
            ...stats,
            season,
            split,
          },
          create: {
            playerId: player.id,
            ...stats,
            season,
            split,
          },
        });
      } catch (err: any) {
        results.errors.push(`${pseudo}: ${err.message || "Unknown error"}`);
      }
    }

    // Phase 2: Calculate scores with all players loaded
    // Build PlayerData array for scoring
    const allPlayerData: PlayerData[] = playerDataList.map((p) => ({
      id: p.playerId,
      pseudo: p.pseudo,
      role: p.role,
      league,
      ...p.stats,
    }));

    // Calculate scores for each player
    for (const playerData of playerDataList) {
      try {
        const scoringResult = calculateScores(
          {
            role: playerData.role,
            league,
            ...playerData.stats,
          },
          allPlayerData
        );

        // Update player tier
        await db.player.update({
          where: { id: playerData.playerId },
          data: { tier: scoringResult.tier },
        });

        // Update ProStats with scores
        await db.proStats.update({
          where: { playerId: playerData.playerId },
          data: {
            rawScore: scoringResult.rawScore,
            globalScore: scoringResult.globalScore,
            tierScore: scoringResult.tierScore,
            tier: scoringResult.tier,
          },
        });
      } catch (err: any) {
        results.errors.push(`${playerData.pseudo}: score calculation failed - ${err.message}`);
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}
