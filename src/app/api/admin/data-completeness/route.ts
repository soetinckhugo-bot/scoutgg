import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { logger } from "@/lib/logger";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Total counts
    const totalPlayers = await db.player.count();
    const totalReports = await db.report.count();
    const totalFavorites = await db.favorite.count();
    const totalUsers = await db.user.count();

    // Players by league
    const byLeague = await db.player.groupBy({
      by: ["league"],
      _count: { id: true },
    });

    // Players by role
    const byRole = await db.player.groupBy({
      by: ["role"],
      _count: { id: true },
    });

    // Players by status
    const byStatus = await db.player.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // Players without image
    const withoutImage = await db.player.count({
      where: { photoUrl: null },
    });

    // Players without bio
    const withoutBio = await db.player.count({
      where: { bio: null },
    });

    // Players without realName
    const withoutRealName = await db.player.count({
      where: { realName: null },
    });

    // Players without nationality
    const withoutNationality = await db.player.count({
      where: { nationality: null },
    });

    // Players without age
    const withoutAge = await db.player.count({
      where: { age: null },
    });

    // Players without team
    const withoutTeam = await db.player.count({
      where: { currentTeam: null },
    });

    // Players with/without ProStats
    const withProStats = await db.proStats.count();
    const withSoloqStats = await db.soloqStats.count();

    // ProStats by league — aggregate via player relation
    const allProStats = await db.proStats.findMany({
      include: {
        player: { select: { league: true } },
      },
    });

    const proStatsByLeagueMap = new Map<
      string,
      {
        count: number;
        globalScores: number[];
        tierScores: number[];
        kdas: number[];
        dpms: number[];
        totalGames: number;
      }
    >();

    for (const stat of allProStats) {
      const league = stat.player?.league || "Unknown";
      const existing = proStatsByLeagueMap.get(league);
      if (existing) {
        existing.count++;
        if (stat.globalScore != null) existing.globalScores.push(stat.globalScore);
        if (stat.tierScore != null) existing.tierScores.push(stat.tierScore);
        if (stat.kda != null) existing.kdas.push(stat.kda);
        if (stat.dpm != null) existing.dpms.push(stat.dpm);
        existing.totalGames += stat.gamesPlayed ?? 0;
      } else {
        proStatsByLeagueMap.set(league, {
          count: 1,
          globalScores: stat.globalScore != null ? [stat.globalScore] : [],
          tierScores: stat.tierScore != null ? [stat.tierScore] : [],
          kdas: stat.kda != null ? [stat.kda] : [],
          dpms: stat.dpm != null ? [stat.dpm] : [],
          totalGames: stat.gamesPlayed ?? 0,
        });
      }
    }

    const proStatsByLeague = Array.from(proStatsByLeagueMap.entries()).map(
      ([league, data]) => ({
        league,
        count: data.count,
        avgGlobalScore:
          data.globalScores.length > 0
            ? data.globalScores.reduce((a, b) => a + b, 0) / data.globalScores.length
            : null,
        avgTierScore:
          data.tierScores.length > 0
            ? data.tierScores.reduce((a, b) => a + b, 0) / data.tierScores.length
            : null,
        avgKda:
          data.kdas.length > 0
            ? data.kdas.reduce((a, b) => a + b, 0) / data.kdas.length
            : null,
        avgDpm:
          data.dpms.length > 0
            ? data.dpms.reduce((a, b) => a + b, 0) / data.dpms.length
            : null,
        totalGames: data.totalGames,
      })
    );

    // Players with incomplete stats (proStats exists but missing key fields)
    const proStatsWithMissing = await db.proStats.findMany({
      include: {
        player: { select: { league: true } },
      },
    });

    const missingFieldsByLeague: Record<
      string,
      { total: number; missingCSD: number; missingGD: number; missingVision: number; missingKP: number; missingFB: number; missingSoloKills: number; lowGames: number }
    > = {};

    for (const stat of proStatsWithMissing) {
      const league = stat.player?.league || "Unknown";
      if (!missingFieldsByLeague[league]) {
        missingFieldsByLeague[league] = {
          total: 0,
          missingCSD: 0,
          missingGD: 0,
          missingVision: 0,
          missingKP: 0,
          missingFB: 0,
          missingSoloKills: 0,
          lowGames: 0,
        };
      }
      const m = missingFieldsByLeague[league];
      m.total++;
      if (stat.csdAt15 === null) m.missingCSD++;
      if (stat.gdAt15 === null) m.missingGD++;
      if (stat.visionScore === null) m.missingVision++;
      if (stat.kpPercent === null) m.missingKP++;
      if (stat.fbPercent === null) m.missingFB++;
      if (stat.soloKills === null) m.missingSoloKills++;
      if ((stat.gamesPlayed ?? 0) < 5) m.lowGames++;
    }

    // SoloQ stats completeness
    const soloqWithMissing = await db.soloqStats.findMany({
      select: {
        playerId: true,
        currentRank: true,
        peakLp: true,
        winrate: true,
        totalGames: true,
      },
    });

    const soloqMissingRank = soloqWithMissing.filter((s) => !s.currentRank).length;
    const soloqMissingPeak = soloqWithMissing.filter((s) => s.peakLp === null).length;
    const soloqMissingWinrate = soloqWithMissing.filter((s) => s.winrate === null).length;
    const soloqMissingGames = soloqWithMissing.filter((s) => s.totalGames === null).length;

    // Recent activity (players added last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPlayers = await db.player.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Prospect count
    const prospectCount = await db.player.count({
      where: { isProspect: true },
    });

    // Featured count
    const featuredCount = await db.player.count({
      where: { isFeatured: true },
    });

    return NextResponse.json({
      totals: {
        players: totalPlayers,
        reports: totalReports,
        favorites: totalFavorites,
        users: totalUsers,
        prospects: prospectCount,
        featured: featuredCount,
        recentPlayers,
      },
      byLeague: byLeague.map((r) => ({ league: r.league, count: r._count.id })),
      byRole: byRole.map((r) => ({ role: r.role, count: r._count.id })),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count.id })),
      completeness: {
        withoutImage,
        withoutBio,
        withoutRealName,
        withoutNationality,
        withoutAge,
        withoutTeam,
        withProStats,
        withSoloqStats,
        withoutProStats: totalPlayers - withProStats,
        withoutSoloqStats: totalPlayers - withSoloqStats,
      },
      proStatsByLeague: proStatsByLeague.map((r) => ({
        league: r.league,
        count: r.count,
        avgGlobalScore: r.avgGlobalScore,
        avgTierScore: r.avgTierScore,
        avgKda: r.avgKda,
        avgDpm: r.avgDpm,
        totalGames: r.totalGames,
      })),
      missingFieldsByLeague: Object.entries(missingFieldsByLeague).map(
        ([league, data]) => ({ league, ...data })
      ),
      soloqCompleteness: {
        total: soloqWithMissing.length,
        missingRank: soloqMissingRank,
        missingPeakLp: soloqMissingPeak,
        missingWinrate: soloqMissingWinrate,
        missingGames: soloqMissingGames,
      },
    });
  } catch (error) {
    logger.error("Data completeness error:", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
