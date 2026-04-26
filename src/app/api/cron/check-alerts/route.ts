import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";

/**
 * POST /api/cron/check-alerts
 * Checks for significant player changes and creates notifications.
 * Secured by CRON_SECRET header.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Array<{
    type: string;
    playerId: string;
    userId: string;
    created: boolean;
    error?: string;
  }> = [];

  try {
    // Get all favorites with their players' current stats
    const favorites = await db.favorite.findMany({
      include: {
        player: {
          include: {
            soloqStats: true,
            proStats: true,
          },
        },
      },
    });

    // Group by player to avoid duplicate checks
    const playerMap = new Map();
    for (const fav of favorites) {
      if (!playerMap.has(fav.playerId)) {
        playerMap.set(fav.playerId, {
          player: fav.player,
          users: [fav.userId],
        });
      } else {
        playerMap.get(fav.playerId).users.push(fav.userId);
      }
    }

    // Check each player for alert-worthy changes
    for (const [playerId, data] of playerMap) {
      const { player, users } = data;

      // Alert 1: Rank milestone (Challenger, Grandmaster hit)
      if (player.soloqStats?.currentRank) {
        const rank = player.soloqStats.currentRank;
        const isHighRank =
          rank.includes("Challenger") ||
          rank.includes("Grandmaster");

        if (isHighRank) {
          for (const userId of users) {
            const existing = await db.notification.findFirst({
              where: {
                userId,
                type: "rank_up",
                title: { contains: player.pseudo },
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
              },
            });

            if (!existing) {
              await db.notification.create({
                data: {
                  userId,
                  type: "rank_up",
                  title: `${player.pseudo} hit ${rank.split(" ")[0]}!`,
                  message: `${player.pseudo} reached ${rank} in SoloQ. Keep an eye on their performance.`,
                  link: `/players/${playerId}`,
                },
              });
              results.push({ type: "rank_up", playerId, userId, created: true });
            }
          }
        }
      }

      // Alert 2: High LP gain (500+ LP)
      if (player.soloqStats?.peakLp && player.soloqStats.peakLp >= 500) {
        for (const userId of users) {
          const existing = await db.notification.findFirst({
            where: {
              userId,
              type: "rank_up",
              title: { contains: player.pseudo },
              message: { contains: "500 LP" },
              createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          });

          if (!existing) {
            await db.notification.create({
              data: {
                userId,
                type: "rank_up",
                title: `${player.pseudo} reached ${player.soloqStats.peakLp} LP`,
                message: `${player.pseudo} is now at ${player.soloqStats.peakLp} LP in SoloQ — impressive climb!`,
                link: `/players/${playerId}`,
              },
            });
            results.push({ type: "rank_up", playerId, userId, created: true });
          }
        }
      }

      // Alert 3: Free agent status
      if (player.status === "FREE_AGENT") {
        for (const userId of users) {
          const existing = await db.notification.findFirst({
            where: {
              userId,
              type: "status_change",
              title: { contains: player.pseudo },
              message: { contains: "free agent" },
              createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
          });

          if (!existing) {
            await db.notification.create({
              data: {
                userId,
                type: "status_change",
                title: `${player.pseudo} is now a Free Agent`,
                message: `${player.pseudo} (${player.role}) is available for recruitment from ${player.league}.`,
                link: `/players/${playerId}`,
              },
            });
            results.push({ type: "status_change", playerId, userId, created: true });
          }
        }
      }

      // Alert 4: Contract expiring (30, 60, 90 days)
      if (player.contractEndDate) {
        const daysUntilExpiry = Math.ceil(
          (+player.contractEndDate - Date.now()) / (1000 * 60 * 60 * 24)
        );
        const milestoneDays = [30, 60, 90];
        const milestone = milestoneDays.find(
          (d) => daysUntilExpiry <= d && daysUntilExpiry > d - 7
        );

        if (milestone) {
          for (const userId of users) {
            const existing = await db.notification.findFirst({
              where: {
                userId,
                type: "transfer",
                title: { contains: player.pseudo },
                message: { contains: `${milestone} days` },
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
              },
            });

            if (!existing) {
              await db.notification.create({
                data: {
                  userId,
                  type: "transfer",
                  title: `${player.pseudo}'s contract expires in ${milestone} days`,
                  message: `${player.pseudo} (${player.role}, ${player.currentTeam || "No team"}) contract ends on ${new Date(player.contractEndDate).toLocaleDateString()}.`,
                  link: `/players/${playerId}`,
                },
              });
              results.push({ type: "contract_expiry", playerId, userId, created: true });
            }
          }
        }
      }

      // Alert 5: New report published
      const recentReports = await db.report.findMany({
        where: {
          playerId,
          publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { publishedAt: "desc" },
        take: 1,
      });

      if (recentReports.length > 0) {
        for (const userId of users) {
          const existing = await db.notification.findFirst({
            where: {
              userId,
              type: "new_report",
              title: { contains: player.pseudo },
              createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          });

          if (!existing) {
            await db.notification.create({
              data: {
                userId,
                type: "new_report",
                title: `New report on ${player.pseudo}`,
                message: `A new scouting report has been published for ${player.pseudo}.`,
                link: `/players/${playerId}`,
              },
            });
            results.push({ type: "new_report", playerId, userId, created: true });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      alertsCreated: results.filter((r) => r.created).length,
      results,
    });
  } catch (error: any) {
    console.error("[Cron] Alert check error:", error);
    return NextResponse.json(
      { error: error.message || "Alert check failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/check-alerts
 * Returns alert system status.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favoriteCount = await db.favorite.count();
  const notificationCount = await db.notification.count();
  const unreadCount = await db.notification.count({ where: { read: false } });

  return NextResponse.json({
    trackedPlayers: favoriteCount,
    totalNotifications: notificationCount,
    unreadNotifications: unreadCount,
    message: "Use POST with Bearer CRON_SECRET to trigger alert check",
  });
}

