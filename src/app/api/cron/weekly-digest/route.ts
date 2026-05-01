import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { Resend } from "resend";
import he from "he";
import { logger } from "@/lib/logger";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * POST /api/cron/weekly-digest
 * Sends weekly digest emails to all users with favorites.
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

  if (!resend) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    // Get top prospects ONCE
    const prospects = await db.player.findMany({
      where: { isProspect: true },
      orderBy: { prospectScore: "desc" },
      take: 5,
      select: {
        pseudo: true,
        role: true,
        league: true,
        prospectScore: true,
      },
    });

    // Get ALL favorites with players in ONE query
    const allFavorites = await db.favorite.findMany({
      include: {
        player: {
          include: {
            soloqStats: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group favorites by user
    const favoritesByUser = new Map<string, typeof allFavorites>();
    for (const fav of allFavorites) {
      if (!favoritesByUser.has(fav.userId)) {
        favoritesByUser.set(fav.userId, []);
      }
      favoritesByUser.get(fav.userId)!.push(fav);
    }

    const fromEmail = process.env.FROM_EMAIL || "digest@LeagueScout.gg";
    const sent: string[] = [];
    const failed: string[] = [];

    // Send emails in parallel with limited concurrency
    const userIds = Array.from(favoritesByUser.keys());
    const BATCH_SIZE = 5;

    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (userId) => {
          const userFavorites = favoritesByUser.get(userId) || [];
          if (userFavorites.length === 0) return;

          // Take top 10 favorites
          const topFavorites = userFavorites.slice(0, 10);

          const html = buildDigestEmail({
            favorites: topFavorites.map((f) => ({
              pseudo: f.player.pseudo,
              role: f.player.role,
              currentRank: f.player.soloqStats?.currentRank || "Unranked",
              peakLp: f.player.soloqStats?.peakLp || 0,
            })),
            prospects: prospects.map((p) => ({
              pseudo: p.pseudo,
              role: p.role,
              league: p.league,
              score: p.prospectScore || 0,
            })),
          });

          try {
            await resend.emails.send({
              from: `LeagueScout <${fromEmail}>`,
              to: userId,
              subject: "Your Weekly Scouting Digest",
              html,
            });
            sent.push(userId);
          } catch (err) {
            logger.error(`Failed to send digest to ${userId}:`, { err });
            failed.push(userId);
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      sent: sent.length,
      failed: failed.length,
      sentTo: sent,
      failedFor: failed,
    });
  } catch (error: any) {
    logger.error("[Cron] Weekly digest error:", { error });
    return NextResponse.json(
      { error: error.message || "Digest failed" },
      { status: 500 }
    );
  }
}

function buildDigestEmail({
  favorites,
  prospects,
}: {
  favorites: Array<{
    pseudo: string;
    role: string;
    currentRank: string;
    peakLp: number;
  }>;
  prospects: Array<{
    pseudo: string;
    role: string;
    league: string;
    score: number;
  }>;
}) {
  const escape = (str: string) => he.encode(str, { useNamedReferences: true });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1A1A2E; }
    h1 { color: #1A1A2E; font-size: 24px; }
    h2 { color: #0F3460; font-size: 18px; margin-top: 24px; }
    .player-row { padding: 12px; border-bottom: 1px solid #E9ECEF; }
    .player-name { font-weight: 600; }
    .player-meta { color: #6C757D; font-size: 14px; }
    .prospect-row { padding: 10px 12px; }
    .score { color: #E94560; font-weight: 700; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E9ECEF; font-size: 12px; color: #6C757D; }
    a { color: #0F3460; }
  </style>
</head>
<body>
  <h1>Weekly Scouting Digest</h1>
  <p>Here's what's happening with your watchlist and the prospect scene this week.</p>

  <h2>Your Watchlist</h2>
  ${favorites
    .map(
      (f) => `
    <div class="player-row">
      <div class="player-name">${escape(f.pseudo)} <span style="color:#6C757D;font-size:12px;">(${escape(f.role)})</span></div>
      <div class="player-meta">${escape(f.currentRank)} · ${f.peakLp} LP</div>
    </div>
  `
    )
    .join("")}

  <h2>Top Prospects</h2>
  ${prospects
    .map(
      (p) => `
    <div class="prospect-row">
      <span class="player-name">${escape(p.pseudo)}</span>
      <span class="player-meta"> — ${escape(p.role)}, ${escape(p.league)}</span>
      <span class="score"> ${p.score.toFixed(1)}</span>
    </div>
  `
    )
    .join("")}

  <div class="footer">
    <p>You're receiving this because you have players on your LeagueScout watchlist.</p>
    <p><a href="https://LeagueScout.gg/dashboard">View Dashboard</a> · <a href="https://LeagueScout.gg/watchlist">Manage Watchlist</a></p>
  </div>
</body>
</html>
  `;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userCount = await db.favorite.groupBy({
    by: ["userId"],
    _count: { userId: true },
  });

  return NextResponse.json({
    subscribers: userCount.length,
    resendConfigured: !!resend,
    message: "Use POST with Bearer CRON_SECRET to send digest",
  });
}

