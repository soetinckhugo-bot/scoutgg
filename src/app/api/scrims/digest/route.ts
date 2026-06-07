import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { logger } from "@/lib/logger";

const ROLES = ["Top", "Jungle", "Mid", "Adc", "Support"] as const;
type Role = (typeof ROLES)[number];

interface CompKey {
  comp: string[];
  result: string;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allScrims = await db.scrim.findMany({
      orderBy: { date: "desc" },
    });

    const total = allScrims.length;
    const wins = allScrims.filter((s) => s.result === "WIN").length;
    const losses = allScrims.filter((s) => s.result === "LOSS").length;
    const draws = allScrims.filter((s) => s.result === "DRAW").length;

    // Weekly trend (last 4 weeks)
    const now = new Date();
    const weeks: Array<{
      label: string;
      start: Date;
      wins: number;
      losses: number;
      draws: number;
      total: number;
    }> = [];

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekScrims = allScrims.filter((s) => {
        const d = new Date(s.date);
        return d >= weekStart && d < weekEnd;
      });

      weeks.push({
        label: formatWeekLabel(weekStart),
        start: weekStart,
        wins: weekScrims.filter((s) => s.result === "WIN").length,
        losses: weekScrims.filter((s) => s.result === "LOSS").length,
        draws: weekScrims.filter((s) => s.result === "DRAW").length,
        total: weekScrims.length,
      });
    }

    // Most played ally compositions (top 5)
    const compMap = new Map<string, { count: number; wins: number }>();
    for (const scrim of allScrims) {
      const champs = ROLES.map((r) => (scrim as unknown as Record<string, string | null>)[`ally${r}`]).filter(
        Boolean
      ) as string[];
      if (champs.length === 0) continue;
      const key = champs.join(", ");
      const existing = compMap.get(key) || { count: 0, wins: 0 };
      existing.count++;
      if (scrim.result === "WIN") existing.wins++;
      compMap.set(key, existing);
    }
    const topComps = Array.from(compMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([comp, stats]) => ({
        comp,
        count: stats.count,
        wins: stats.wins,
        winrate: stats.count > 0 ? Math.round((stats.wins / stats.count) * 100) : 0,
      }));

    // Most played enemy compositions (top 5)
    const enemyCompMap = new Map<string, { count: number; wins: number }>();
    for (const scrim of allScrims) {
      const champs = ROLES.map((r) => (scrim as unknown as Record<string, string | null>)[`enemy${r}`]).filter(
        Boolean
      ) as string[];
      if (champs.length === 0) continue;
      const key = champs.join(", ");
      const existing = enemyCompMap.get(key) || { count: 0, wins: 0 };
      existing.count++;
      if (scrim.result === "WIN") existing.wins++;
      enemyCompMap.set(key, existing);
    }
    const topEnemyComps = Array.from(enemyCompMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([comp, stats]) => ({
        comp,
        count: stats.count,
        wins: stats.wins,
        winrate: stats.count > 0 ? Math.round((stats.wins / stats.count) * 100) : 0,
      }));

    // Winrate by role (which role champions we play the most and win the most with)
    const roleStats: Record<string, { champion: string; games: number; wins: number }> = {};
    for (const scrim of allScrims) {
      for (const role of ROLES) {
        const champ = (scrim as unknown as Record<string, string | null>)[`ally${role}`];
        if (!champ) continue;
        const key = `${role}-${champ}`;
        if (!roleStats[key]) {
          roleStats[key] = { champion: champ, games: 0, wins: 0 };
        }
        roleStats[key].games++;
        if (scrim.result === "WIN") roleStats[key].wins++;
      }
    }

    const roleWinrates = ROLES.map((role) => {
      const champs = Object.entries(roleStats)
        .filter(([k]) => k.startsWith(`${role}-`))
        .map(([, v]) => v)
        .sort((a, b) => b.games - a.games);
      const totalGames = champs.reduce((sum, c) => sum + c.games, 0);
      const totalWins = champs.reduce((sum, c) => sum + c.wins, 0);
      return {
        role,
        totalGames,
        winrate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0,
        topChampion: champs[0] || null,
      };
    });

    // Recent scrims (last 5)
    const recentScrims = allScrims.slice(0, 5).map((s) => ({
      id: s.id,
      date: s.date,
      opponent: s.opponent,
      result: s.result,
      allyComp: ROLES.map((r) => (s as unknown as Record<string, string | null>)[`ally${r}`]).filter(Boolean),
      enemyComp: ROLES.map((r) => (s as unknown as Record<string, string | null>)[`enemy${r}`]).filter(Boolean),
    }));

    return NextResponse.json({
      summary: {
        total,
        wins,
        losses,
        draws,
        winrate: total > 0 ? Math.round((wins / total) * 100) : 0,
      },
      weeklyTrend: weeks,
      topCompositions: topComps,
      topEnemyCompositions: topEnemyComps,
      roleWinrates,
      recentScrims,
    });
  } catch (error) {
    logger.error("GET /api/scrims/digest failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate digest" },
      { status: 500 }
    );
  }
}
