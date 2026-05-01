import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";
import { parseCsv, normalizeRole, parseProStatsFromRow, validateCsvRow, findDuplicatePlayers, detectCsvMetrics } from "@/lib/csv-parser";
import { calculateScores, type PlayerData } from "@/lib/scoring";
import { LEAGUE_TIERS } from "@/lib/constants";
import { logger } from "@/lib/logger";

// Process batch with limited concurrency to avoid SQLite locks
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
    const detectedMetrics = detectCsvMetrics(rows);

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
      warnings: [] as string[],
      players: [] as string[],
      detectedMetrics: detectedMetrics,
    };

    // Validation: check for duplicates
    const duplicates = findDuplicatePlayers(rows);
    if (duplicates.length > 0) {
      results.warnings.push(`Doublons détectés: ${duplicates.join("; ")}`);
    }

    // Validate each row and collect valid ones
    const validatedRows = rows
      .map((row, idx) => ({
        row,
        validation: validateCsvRow(row, idx + 2), // +2 = header + 0-indexed
        pseudo: row.Player?.trim(),
        team: row.Team || null,
        pos: row.Pos || "TOP",
        stats: parseProStatsFromRow(row),
      }));

    // Report warnings
    for (const v of validatedRows) {
      for (const w of v.validation.warnings) {
        results.warnings.push(`${v.validation.pseudo}: ${w.field} — ${w.message}`);
      }
    }

    // Report errors and filter valid rows
    const validRows = validatedRows
      .filter((v) => {
        if (!v.pseudo) {
          results.skipped++;
          return false;
        }
        if (!v.validation.valid) {
          for (const err of v.validation.errors) {
            results.errors.push(`${v.validation.pseudo}: ${err.field} — ${err.message}`);
          }
          results.skipped++;
          return false;
        }
        return true;
      })
      .map((v) => ({
        pseudo: v.pseudo,
        team: v.team,
        pos: v.pos,
        stats: v.stats,
      }));

    // Phase 1: Load all existing players in ONE query
    const existingPlayers = await db.player.findMany({
      where: {
        pseudo: { in: validRows.map((r) => r.pseudo) },
      },
      select: { id: true, pseudo: true, currentTeam: true, tier: true },
    });

    const existingByPseudo = new Map(existingPlayers.map((p) => [p.pseudo, p]));

    // Helper: compute tier from league
    function getTierFromLeague(leagueName: string): string | null {
      const info = LEAGUE_TIERS[leagueName.toUpperCase()];
      return info ? String(info.tier) : null;
    }

    // Phase 2: Process players (create or update) with batching
    const playerDataList = await batchProcess(
      validRows,
      async (row) => {
        const existing = existingByPseudo.get(row.pseudo);
        const role = normalizeRole(row.pos);
        const tier = getTierFromLeague(league);

        if (!existing) {
          // Create new player
          const newPlayer = await db.player.create({
            data: {
              pseudo: row.pseudo,
              role,
              league,
              currentTeam: row.team,
              status: "SCOUTING",
              tier,
            },
          });
          results.created++;
          results.players.push(row.pseudo);
          return {
            pseudo: row.pseudo,
            role,
            stats: row.stats,
            playerId: newPlayer.id,
          };
        } else {
          // Update existing player
          await db.player.update({
            where: { id: existing.id },
            data: {
              league,
              currentTeam: row.team || existing.currentTeam,
              tier: tier || existing.tier,
            },
          });
          results.updated++;
          results.players.push(row.pseudo);
          return {
            pseudo: row.pseudo,
            role,
            stats: row.stats,
            playerId: existing.id,
          };
        }
      },
      5 // Small batch to avoid SQLite locks
    );

    // Phase 3: Batch upsert ProStats (active display)
    await batchProcess(
      playerDataList,
      async (playerData) => {
        await db.proStats.upsert({
          where: { playerId: playerData.playerId },
          update: {
            ...playerData.stats,
            season,
            split,
          },
          create: {
            playerId: playerData.playerId,
            ...playerData.stats,
            season,
            split,
          },
        });
      },
      5
    );

    // Phase 3b: Batch upsert ProStatsSplit (historical)
    await batchProcess(
      playerDataList,
      async (playerData) => {
        await db.proStatsSplit.upsert({
          where: {
            playerId_season_split: {
              playerId: playerData.playerId,
              season,
              split,
            },
          },
          update: {
            ...playerData.stats,
          },
          create: {
            playerId: playerData.playerId,
            season,
            split,
            ...playerData.stats,
          },
        });
      },
      5
    );

    // Phase 4: Calculate scores and batch update
    const allPlayerData: PlayerData[] = playerDataList.map((p) => ({
      id: p.playerId,
      pseudo: p.pseudo,
      role: p.role,
      league,
      ...p.stats,
    }));

    const scoringResults = playerDataList.map((playerData) => {
      try {
        return {
          playerId: playerData.playerId,
          result: calculateScores(
            { role: playerData.role, league, ...playerData.stats },
            allPlayerData
          ),
          error: null,
        };
      } catch (err: any) {
        results.errors.push(
          `${playerData.pseudo}: score calculation failed - ${err.message}`
        );
        return { playerId: playerData.playerId, result: null, error: err };
      }
    });

    // Batch update players and ProStats with scores
    await batchProcess(
      scoringResults.filter((s) => s.result),
      async (scoring) => {
        await Promise.all([
          db.player.update({
            where: { id: scoring.playerId },
            data: { tier: scoring.result!.tier },
          }),
          db.proStats.update({
            where: { playerId: scoring.playerId },
            data: {
              rawScore: scoring.result!.rawScore,
              globalScore: scoring.result!.globalScore,
              tierScore: scoring.result!.tierScore,
              tier: scoring.result!.tier,
            },
          }),
        ]);
      },
      5
    );

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    logger.error("CSV import error:", { error });
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}
