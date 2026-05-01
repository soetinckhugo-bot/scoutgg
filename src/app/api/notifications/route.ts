import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";

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

  // Load all existing notifications for this user in ONE query
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

    // 1. Free Agent alert
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
        existingSet.add(key); // prevent duplicates in same batch
      }
    }

    // 2. LP Milestone (500+ LP)
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

  // Batch create all notifications in one query
  if (notificationsToCreate.length > 0) {
    await db.notification.createMany({
      data: notificationsToCreate,
    });
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ notifications: [] });
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ notifications: [] });
  }

  // Generate new notifications based on watchlist
  await generateNotifications(user.id);

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await db.notification.count({
    where: { userId: user.id, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(request: NextRequest) {
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

  const { id } = await request.json();

  if (id) {
    // Mark single as read
    await db.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });
  } else {
    // Mark all as read
    await db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}

