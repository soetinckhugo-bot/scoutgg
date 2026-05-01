import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";

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

    // Pre-load all recent notifications in ONE query
    const allPlayerIds = Array.from(playerMap.keys());
    const allUserIds = [...new Set(favorites.map((f) => f.userId))];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const existingNotifications = await db.notification.findMany({
      where: {
        userId: { in: allUserIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        userId: true,
        type: true,
        title: true,
        message: true,
        createdAt: true,
      },
    });

    // Group notifications by user for fast lookup
    const notifByUser = new Map();
    for (const n of existingNotifications) {
      if (!notifByUser.has(n.userId)) {
        notifByUser.set(n.userId, []);
      }
      notifByUser.get(n.userId).push(n);
    }

    function hasRecentNotification(
      userId: string,
      type: string,
      titleContains: string,
      messageContains: string,
      since: Date
    ): boolean {
      const userNotifs = notifByUser.get(userId) || [];
      return userNotifs.some(
        (n: { type: string; title: string; message: string; createdAt: Date }) =>
          n.type === type &&
          n.title.includes(titleContains) &&
          n.message.includes(messageContains) &&
          new Date(n.createdAt) >= since
      );
    }

    // Collect all notifications to create
    const notificationsToCreate: Array<{
      userId: string;
      type: string;
      title: string;
      message: string;
      link: string;
    }> = [];

    // Check each player for alert-worthy changes
    for (const [playerId, data] of playerMap) {
      const { player, users } = data;

      // Alert 1: Rank milestone (Challenger, Grandmaster hit)
      if (player.soloqStats?.currentRank) {
        const rank = player.soloqStats.currentRank;
        const isHighRank =
          rank.includes("Challenger") || rank.includes("Grandmaster");

        if (isHighRank) {
          for (const userId of users) {
            if (
              !hasRecentNotification(
                userId,
                "rank_up",
                player.pseudo,
                "SoloQ",
                sevenDaysAgo
              )
            ) {
              notificationsToCreate.push({
                userId,
                type: "rank_up",
                title: `${player.pseudo} hit ${rank.split(" ")[0]}!`,
                message: `${player.pseudo} reached ${rank} in SoloQ. Keep an eye on their performance.`,
                link: `/players/${playerId}`,
              });
              results.push({ type: "rank_up", playerId, userId, created: true });
            }
          }
        }
      }

      // Alert 2: High LP gain (500+ LP)
      if (player.soloqStats?.peakLp && player.soloqStats.peakLp >= 500) {
        for (const userId of users) {
          if (
            !hasRecentNotification(
              userId,
              "rank_up",
              player.pseudo,
              "500 LP",
              sevenDaysAgo
            )
          ) {
            notificationsToCreate.push({
              userId,
              type: "rank_up",
              title: `${player.pseudo} reached ${player.soloqStats.peakLp} LP`,
              message: `${player.pseudo} is now at ${player.soloqStats.peakLp} LP in SoloQ — impressive climb!`,
              link: `/players/${playerId}`,
            });
            results.push({ type: "rank_up", playerId, userId, created: true });
          }
        }
      }

      // Alert 3: Free agent status
      if (player.status === "FREE_AGENT") {
        for (const userId of users) {
          if (
            !hasRecentNotification(
              userId,
              "status_change",
              player.pseudo,
              "free agent",
              thirtyDaysAgo
            )
          ) {
            notificationsToCreate.push({
              userId,
              type: "status_change",
              title: `${player.pseudo} is now a Free Agent`,
              message: `${player.pseudo} (${player.role}) is available for recruitment from ${player.league}.`,
              link: `/players/${playerId}`,
            });
            results.push({
              type: "status_change",
              playerId,
              userId,
              created: true,
            });
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
            if (
              !hasRecentNotification(
                userId,
                "transfer",
                player.pseudo,
                `${milestone} days`,
                thirtyDaysAgo
              )
            ) {
              notificationsToCreate.push({
                userId,
                type: "transfer",
                title: `${player.pseudo}'s contract expires in ${milestone} days`,
                message: `${player.pseudo} (${player.role}, ${player.currentTeam || "No team"}) contract ends on ${new Date(player.contractEndDate).toLocaleDateString()}.`,
                link: `/players/${playerId}`,
              });
              results.push({
                type: "contract_expiry",
                playerId,
                userId,
                created: true,
              });
            }
          }
        }
      }
    }

    // Alert 5: New report published — check all at once
    const recentReports = await db.report.findMany({
      where: {
        playerId: { in: allPlayerIds },
        publishedAt: { gte: sevenDaysAgo },
      },
      select: { playerId: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    });

    // Group reports by player
    const reportsByPlayer = new Map();
    for (const r of recentReports) {
      if (!reportsByPlayer.has(r.playerId)) {
        reportsByPlayer.set(r.playerId, r);
      }
    }

    for (const [playerId, data] of playerMap) {
      if (reportsByPlayer.has(playerId)) {
        const { player, users } = data;
        for (const userId of users) {
          if (
            !hasRecentNotification(
              userId,
              "new_report",
              player.pseudo,
              "scouting report",
              sevenDaysAgo
            )
          ) {
            notificationsToCreate.push({
              userId,
              type: "new_report",
              title: `New report on ${player.pseudo}`,
              message: `A new scouting report has been published for ${player.pseudo}.`,
              link: `/players/${playerId}`,
            });
            results.push({ type: "new_report", playerId, userId, created: true });
          }
        }
      }
    }

    // Batch create all notifications
    if (notificationsToCreate.length > 0) {
      const BATCH_SIZE = 50;
      for (let i = 0; i < notificationsToCreate.length; i += BATCH_SIZE) {
        const batch = notificationsToCreate.slice(i, i + BATCH_SIZE);
        await db.$transaction(batch.map((n) => db.notification.create({ data: n })));
      }
    }

    return NextResponse.json({
      success: true,
      alertsCreated: results.filter((r) => r.created).length,
      results,
    });
  } catch (error: any) {
    logger.error("[Cron] Alert check error:", { error });
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
