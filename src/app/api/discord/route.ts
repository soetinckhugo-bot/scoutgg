import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";

/**
 * POST /api/discord
 * Discord webhook endpoint for slash commands.
 * Setup:
 * 1. Create a Discord app at https://discord.com/developers/applications
 * 2. Add a webhook URL pointing to this endpoint
 * 3. Set DISCORD_WEBHOOK_SECRET in env
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-discord-webhook-secret");
  const expectedSecret = process.env.DISCORD_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "DISCORD_WEBHOOK_SECRET not configured" },
      { status: 500 }
    );
  }

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, data, member } = body;

    // Discord ping verification
    if (type === 1) {
      return NextResponse.json({ type: 1 });
    }

    // Slash command
    if (type === 2 && data) {
      const command = data.name;
      const options = data.options || [];

      switch (command) {
        case "player": {
          const name = options.find((o: any) => o.name === "name")?.value;
          if (!name) {
            return NextResponse.json({
              type: 4,
              data: { content: "Please provide a player name." },
            });
          }

          const player = await db.player.findFirst({
            where: { pseudo: { contains: name } },
            include: { soloqStats: true, proStats: true },
          });

          if (!player) {
            return NextResponse.json({
              type: 4,
              data: { content: `Player "${name}" not found.` },
            });
          }

          const embed = {
            title: `${player.pseudo} — ${player.role}`,
            description: player.currentTeam
              ? `Team: ${player.currentTeam} · League: ${player.league}`
              : `League: ${player.league}`,
            color: 0xe94560,
            fields: [
              {
                name: "SoloQ",
                value: player.soloqStats
                  ? `${player.soloqStats.currentRank} · ${player.soloqStats.peakLp} LP · ${(
                      player.soloqStats.winrate * 100
                    ).toFixed(1)}% WR`
                  : "No data",
                inline: true,
              },
              {
                name: "Pro Stats",
                value: player.proStats
                  ? `KDA: ${player.proStats.kda?.toFixed(2) || "N/A"} · DPM: ${
                      Math.round(player.proStats.dpm || 0)
                    }`
                  : "No data",
                inline: true,
              },
              {
                name: "Profile",
                value: `[View on LeagueScout](${process.env.NEXTAUTH_URL}/players/${player.id})`,
              },
            ],
            timestamp: new Date().toISOString(),
          };

          return NextResponse.json({
            type: 4,
            data: { embeds: [embed] },
          });
        }

        case "prospect": {
          const prospects = await db.player.findMany({
            where: { isProspect: true },
            orderBy: { prospectScore: "desc" },
            take: 5,
            select: {
              pseudo: true,
              role: true,
              league: true,
              prospectScore: true,
              id: true,
            },
          });

          const embed = {
            title: "Top Prospects",
            color: 0x0f3460,
            fields: prospects.map((p, i) => ({
              name: `${i + 1}. ${p.pseudo} (${p.role})`,
              value: `${p.league} · Score: ${p.prospectScore?.toFixed(1) || "N/A"} · [Profile](${process.env.NEXTAUTH_URL}/players/${p.id})`,
            })),
            timestamp: new Date().toISOString(),
          };

          return NextResponse.json({
            type: 4,
            data: { embeds: [embed] },
          });
        }

        case "leaderboard": {
          const metric =
            options.find((o: any) => o.name === "metric")?.value || "lp";
          const sortField =
            metric === "lp"
              ? { soloqStats: { peakLp: "desc" as const } }
              : metric === "kda"
              ? { proStats: { kda: "desc" as const } }
              : { soloqStats: { winrate: "desc" as const } };

          const players = await db.player.findMany({
            include: { soloqStats: true, proStats: true },
            orderBy: sortField,
            take: 5,
          });

          const embed = {
            title: `Leaderboard — ${metric.toUpperCase()}`,
            color: 0x28a745,
            fields: players.map((p, i) => ({
              name: `${i + 1}. ${p.pseudo} (${p.role})`,
              value:
                metric === "lp"
                  ? `${p.soloqStats?.peakLp || 0} LP`
                  : metric === "kda"
                  ? `KDA: ${p.proStats?.kda?.toFixed(2) || "N/A"}`
                  : `${((p.soloqStats?.winrate || 0) * 100).toFixed(1)}% WR`,
            })),
            timestamp: new Date().toISOString(),
          };

          return NextResponse.json({
            type: 4,
            data: { embeds: [embed] },
          });
        }

        default:
          return NextResponse.json({
            type: 4,
            data: {
              content:
                "Available commands: `/player <name>`, `/prospect`, `/leaderboard <metric>`",
            },
          });
      }
    }

    return NextResponse.json({ type: 1 });
  } catch (error) {
    console.error("Discord webhook error:", error);
    return NextResponse.json(
      { type: 4, data: { content: "An error occurred." } },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Discord webhook endpoint",
    commands: [
      { name: "/player <name>", description: "Get player stats" },
      { name: "/prospect", description: "Top 5 prospects" },
      { name: "/leaderboard <metric>", description: "Leaderboard (lp, kda, winrate)" },
    ],
    setup: [
      "1. Create Discord app at https://discord.com/developers/applications",
      "2. Add webhook URL pointing to this endpoint",
      "3. Set DISCORD_WEBHOOK_SECRET in env",
    ],
  });
}

