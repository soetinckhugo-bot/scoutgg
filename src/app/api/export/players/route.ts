import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { rateLimit } from "@/lib/server/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  // Require authentication for CSV export
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(`export-players:${ip}`, 10, 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") || undefined;
    const role = searchParams.get("role") || undefined;
    const league = searchParams.get("league") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: any = {};

    if (q) {
      where.OR = [
        { pseudo: { contains: q } },
        { realName: { contains: q } },
      ];
    }
    if (role) where.role = role;
    if (league) where.league = league;
    if (status) where.status = status;

    const players = await db.player.findMany({
      where,
      include: {
        soloqStats: true,
        proStats: true,
      },
      orderBy: { pseudo: "asc" },
    });

    const headers = [
      "Pseudo",
      "Real Name",
      "Role",
      "Nationality",
      "Age",
      "Team",
      "League",
      "Status",
      "SoloQ Rank",
      "Peak LP",
      "SoloQ Winrate",
      "SoloQ Games",
      "Pro KDA",
      "Pro Games",
    ];

    const rows = players.map((p) => [
      p.pseudo,
      p.realName || "",
      p.role,
      p.nationality,
      p.age?.toString() || "",
      p.currentTeam || "",
      p.league,
      p.status,
      p.soloqStats?.currentRank || "",
      p.soloqStats?.peakLp?.toString() || "",
      p.soloqStats ? `${(p.soloqStats.winrate * 100).toFixed(1)}%` : "",
      p.soloqStats?.totalGames?.toString() || "",
      p.proStats?.kda?.toString() || "",
      p.proStats?.gamesPlayed?.toString() || "",
    ]);

    const escape = (val: string | null) => {
      const str = val ?? "";
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="LeagueScout-players-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    logger.error("Export error:", { error });
    return NextResponse.json(
      { error: "Failed to export players" },
      { status: 500 }
    );
  }
}

