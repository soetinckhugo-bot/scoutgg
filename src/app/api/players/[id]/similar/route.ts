import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";

function normalize(value: number | null, min: number, max: number): number {
  if (value === null || value === undefined) return 0.5;
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playerId } = await params;

  try {
    const target = await db.player.findUnique({
      where: { id: playerId },
      include: {
        soloqStats: true,
        proStats: true,
      },
    });

    if (!target) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Get all other players with stats
    const candidates = await db.player.findMany({
      where: {
        id: { not: playerId },
        role: target.role, // Same role only
      },
      include: {
        soloqStats: true,
        proStats: true,
      },
      take: 100,
    });

    if (candidates.length === 0) {
      return NextResponse.json({ similar: [] });
    }

    // Define feature ranges for normalization
    const allPlayers = [target, ...candidates];
    const stats = allPlayers.map((p) => ({
      peakLp: p.soloqStats?.peakLp ?? 0,
      winrate: (p.soloqStats?.winrate ?? 0) * 100,
      kda: p.proStats?.kda ?? 0,
      dpm: p.proStats?.dpm ?? 0,
      cspm: p.proStats?.cspm ?? 0,
      kpPercent: (p.proStats?.kpPercent ?? 0) * 100,
      visionScore: p.proStats?.visionScore ?? 0,
    }));

    const ranges = {
      peakLp: { min: Math.min(...stats.map((s) => s.peakLp)), max: Math.max(...stats.map((s) => s.peakLp)) },
      winrate: { min: 0, max: 100 },
      kda: { min: 0, max: Math.max(...stats.map((s) => s.kda), 10) },
      dpm: { min: 0, max: Math.max(...stats.map((s) => s.dpm), 1000) },
      cspm: { min: 0, max: Math.max(...stats.map((s) => s.cspm), 12) },
      kpPercent: { min: 0, max: 100 },
      visionScore: { min: 0, max: Math.max(...stats.map((s) => s.visionScore), 100) },
    };

    function getVector(p: NonNullable<typeof target>): number[] {
      return [
        normalize(p.soloqStats?.peakLp ?? null, ranges.peakLp.min, ranges.peakLp.max),
        normalize((p.soloqStats?.winrate ?? 0) * 100, ranges.winrate.min, ranges.winrate.max),
        normalize(p.proStats?.kda ?? null, ranges.kda.min, ranges.kda.max),
        normalize(p.proStats?.dpm ?? null, ranges.dpm.min, ranges.dpm.max),
        normalize(p.proStats?.cspm ?? null, ranges.cspm.min, ranges.cspm.max),
        normalize((p.proStats?.kpPercent ?? 0) * 100, ranges.kpPercent.min, ranges.kpPercent.max),
        normalize(p.proStats?.visionScore ?? null, ranges.visionScore.min, ranges.visionScore.max),
      ];
    }

    const targetVector = getVector(target);

    const scored = candidates
      .map((candidate) => {
        const vector = getVector(candidate);
        const distance = euclideanDistance(targetVector, vector);
        // Convert distance to similarity score (0-100)
        const similarity = Math.round((1 - Math.min(distance / 2, 1)) * 100);
        return { player: candidate, similarity };
      })
      .filter((s) => s.similarity > 30) // Only reasonably similar
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8);

    return NextResponse.json({
      target: {
        id: target.id,
        pseudo: target.pseudo,
        role: target.role,
      },
      similar: scored.map((s) => ({
        id: s.player.id,
        pseudo: s.player.pseudo,
        realName: s.player.realName,
        role: s.player.role,
        league: s.player.league,
        currentTeam: s.player.currentTeam,
        photoUrl: s.player.photoUrl,
        similarity: s.similarity,
        soloqStats: s.player.soloqStats,
        proStats: s.player.proStats,
      })),
    }, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=86400" }
    });
  } catch (error) {
    logger.error("Similarity search error:", { error });
    return NextResponse.json(
      { error: "Failed to find similar players" },
      { status: 500 }
    );
  }
}
