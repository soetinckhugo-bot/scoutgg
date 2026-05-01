import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { logger } from "@/lib/logger";

const NOTIFICATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function generateNotifications(userId: string) {
  const favorites = await db.favorite.findMany({
    where: { userId },
    include: {
      player: {
        include: {
          soloqStats: true,
        },
      },
    },
  });

  const cutoff = new Date(Date.now() - NOTIFICATION_WINDOW_MS);
  const links = favorites.map((f) => `/players/${f.player.id}`);
  const existingNotifications = await db.notification.findMany({
    where: {
      userId,
      link: { in: links },
      createdAt: { gte: cutoff },
    },
    select: { link: true, type: true },
  });

  const existingSet = new Set(
    existingNotifications.map((n) => `${n.link}:${n.type}`)
  );

  const notificationsToCreate: Array<{
    userId: string;
    type: string;
    title: string;
    message: string;
    link: string;
  }> = [];

  for (const fav of favorites) {
    const player = fav.player;
    const link = `/players/${player.id}`;

    if (player.status === "FREE_AGENT") {
      const key = `${link}:FREE_AGENT`;
      if (!existingSet.has(key)) {
        notificationsToCreate.push({
          userId,
          type: "FREE_AGENT",
          title: `${player.pseudo} est Free Agent`,
          message: `${player.pseudo} (${player.role} — ${player.league}) est disponible sur le marché des transferts.`,
          link,
        });
        existingSet.add(key);
      }
    }

    const peakLp = player.soloqStats?.peakLp;
    if (peakLp && peakLp >= 500) {
      const key = `${link}:LP_MILESTONE`;
      if (!existingSet.has(key)) {
        notificationsToCreate.push({
          userId,
          type: "LP_MILESTONE",
          title: `${player.pseudo} a dépassé 500 LP`,
          message: `${player.pseudo} a atteint ${peakLp} LP en SoloQ.`,
          link,
        });
        existingSet.add(key);
      }
    }
  }

  if (notificationsToCreate.length > 0) {
    await db.notification.createMany({
      data: notificationsToCreate,
    });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;

    // Generate notifications based on watchlist
    await generateNotifications(userId);

    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();

    const [
      favorites,
      notifications,
      prospects,
      reports,
      potw,
      cards,
    ] = await Promise.all([
      // Favorites
      db.favorite.findMany({
        where: { userId },
        include: {
          player: {
            include: {
              soloqStats: true,
              proStats: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),

      // Notifications
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),

      // Prospects (top 5)
      db.player.findMany({
        where: { isProspect: true },
        select: {
          id: true,
          pseudo: true,
          realName: true,
          role: true,
          league: true,
          photoUrl: true,
          prospectScore: true,
          soloqStats: {
            select: {
              currentRank: true,
              peakLp: true,
            },
          },
        },
        orderBy: { prospectScore: "desc" },
        take: 5,
      }),

      // Reports (latest 5)
      db.report.findMany({
        orderBy: { publishedAt: "desc" },
        include: {
          player: {
            select: { pseudo: true },
          },
        },
        take: 5,
      }),

      // SoloQ POTW
      db.soloqPOTW.findFirst({
        where: {
          isActive: true,
          year: currentYear,
        },
        orderBy: { week: "desc" },
        include: {
          player: {
            include: {
              soloqStats: true,
            },
          },
        },
      }),

      // Scouting cards
      db.scoutingCard.findMany({
        where: { userId },
        select: {
          id: true,
        },
      }),
    ]);

    // Sanitize reports for non-premium users
    const isPremium = user.isPremium === true && user.subscriptionStatus === "active";
    const sanitizedReports = reports.map((report) => {
      if (report.isPremium && !isPremium) {
        return {
          ...report,
          content: "",
          strengths: "",
          weaknesses: "",
          verdict: "",
          author: "",
          _locked: true as const,
        };
      }
      return { ...report, _locked: false as const };
    });

    return NextResponse.json({
      favorites: favorites || [],
      notifications: notifications || [],
      prospects: prospects || [],
      reports: sanitizedReports || [],
      potw: potw
        ? {
            player: potw.player,
            lpGain: potw.lpGain,
            winrate: potw.winrate,
            gamesPlayed: potw.gamesPlayed,
            reason: potw.reason,
          }
        : null,
      boardCount: cards?.length || 0,
    });
  } catch (error) {
    logger.error("Dashboard API error:", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
}
