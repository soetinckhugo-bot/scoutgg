import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";

function avg(vals: (number | null | undefined)[]): number | null {
  const clean = vals.filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
  if (clean.length === 0) return null;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

function sum(vals: (number | null | undefined)[]): number | null {
  const clean = vals.filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
  if (clean.length === 0) return null;
  return clean.reduce((a, b) => a + b, 0);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    if (!year) {
      return NextResponse.json({ error: "year parameter required" }, { status: 400 });
    }

    const splits = await db.proStatsSplit.findMany({
      where: {
        playerId: id,
        season: year,
      },
    });

    if (splits.length === 0) {
      return NextResponse.json({ error: "No stats found for this year" }, { status: 404 });
    }

    // Aggregate by averaging most fields, summing games and totals
    const aggregated = {
      playerId: id,
      season: year,
      split: "ALL",
      gamesPlayed: sum(splits.map((s) => s.gamesPlayed)),
      k: avg(splits.map((s) => s.k)),
      d: avg(splits.map((s) => s.d)),
      a: avg(splits.map((s) => s.a)),
      kda: avg(splits.map((s) => s.kda)),
      kpPercent: avg(splits.map((s) => s.kpPercent)),
      ksPercent: avg(splits.map((s) => s.ksPercent)),
      dthPercent: avg(splits.map((s) => s.dthPercent)),
      fbPercent: avg(splits.map((s) => s.fbPercent)),
      fbVictim: avg(splits.map((s) => s.fbVictim)),
      soloKills: avg(splits.map((s) => s.soloKills)),
      pentaKills: sum(splits.map((s) => s.pentaKills)),
      ctrPercent: avg(splits.map((s) => s.ctrPercent)),
      gdAt10: avg(splits.map((s) => s.gdAt10)),
      xpdAt10: avg(splits.map((s) => s.xpdAt10)),
      csdAt10: avg(splits.map((s) => s.csdAt10)),
      gdAt15: avg(splits.map((s) => s.gdAt15)),
      xpdAt15: avg(splits.map((s) => s.xpdAt15)),
      csdAt15: avg(splits.map((s) => s.csdAt15)),
      cspm: avg(splits.map((s) => s.cspm)),
      csm: avg(splits.map((s) => s.csm)),
      csPercentAt15: avg(splits.map((s) => s.csPercentAt15)),
      dpm: avg(splits.map((s) => s.dpm)),
      damagePercent: avg(splits.map((s) => s.damagePercent)),
      dPercentAt15: avg(splits.map((s) => s.dPercentAt15)),
      tdpg: avg(splits.map((s) => s.tdpg)),
      egpm: avg(splits.map((s) => s.egpm)),
      gpm: avg(splits.map((s) => s.gpm)),
      goldPercent: avg(splits.map((s) => s.goldPercent)),
      wpm: avg(splits.map((s) => s.wpm)),
      cwpm: avg(splits.map((s) => s.cwpm)),
      wcpm: avg(splits.map((s) => s.wcpm)),
      vwpm: avg(splits.map((s) => s.vwpm)),
      vsPercent: avg(splits.map((s) => s.vsPercent)),
      vspm: avg(splits.map((s) => s.vspm)),
      stl: avg(splits.map((s) => s.stl)),
      avgKills: avg(splits.map((s) => s.avgKills)),
      avgDeaths: avg(splits.map((s) => s.avgDeaths)),
      avgAssists: avg(splits.map((s) => s.avgAssists)),
      avgWpm: avg(splits.map((s) => s.avgWpm)),
      avgWcpm: avg(splits.map((s) => s.avgWcpm)),
      avgVwpm: avg(splits.map((s) => s.avgVwpm)),
      winRate: avg(splits.map((s) => s.winRate)),
    };

    return NextResponse.json(aggregated);
  } catch (error) {
    logger.error("Error fetching aggregated pro stats:", { error });
    return NextResponse.json(
      { error: "Failed to fetch aggregated stats" },
      { status: 500 }
    );
  }
}
