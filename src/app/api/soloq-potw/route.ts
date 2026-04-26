import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";
import { z } from "zod";

const potwSchema = z.object({
  playerId: z.string().min(1),
  week: z.coerce.number().int().min(1).max(53),
  year: z.coerce.number().int().min(2020).max(2100),
  lpGain: z.coerce.number().int().default(0),
  winrate: z.coerce.number().min(0).max(1).default(0),
  gamesPlayed: z.coerce.number().int().default(0),
  reason: z.string().default(""),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get("week");
    const year = searchParams.get("year");
    const all = searchParams.get("all");

    // If all=true, return all entries for admin
    if (all === "true") {
      const unauthorized = await requireAdmin();
      if (unauthorized) return unauthorized;

      const potws = await db.soloqPOTW.findMany({
        orderBy: [{ year: "desc" }, { week: "desc" }],
        include: {
          player: {
            select: {
              pseudo: true,
              realName: true,
              photoUrl: true,
              role: true,
            },
          },
        },
      });
      return NextResponse.json({ potws });
    }

    // If week/year provided, get specific one
    if (week && year) {
      const potw = await db.soloqPOTW.findUnique({
        where: {
          week_year: {
            week: parseInt(week),
            year: parseInt(year),
          },
        },
        include: {
          player: {
            include: {
              soloqStats: true,
            },
          },
        },
      });
      return NextResponse.json({ potw });
    }

    // Otherwise get the most recent active one
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();

    const potw = await db.soloqPOTW.findFirst({
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
    });

    return NextResponse.json({ potw, currentWeek, currentYear });
  } catch (error) {
    console.error("Error fetching Soloq POTW:", error);
    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const parsed = potwSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { playerId, week, year, lpGain, winrate, gamesPlayed, reason } = parsed.data;

    const potw = await db.soloqPOTW.upsert({
      where: {
        week_year: { week, year },
      },
      create: {
        playerId,
        week,
        year,
        lpGain,
        winrate,
        gamesPlayed,
        reason,
        isActive: true,
      },
      update: {
        playerId,
        lpGain,
        winrate,
        gamesPlayed,
        reason,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, potw });
  } catch (error) {
    console.error("Error creating Soloq POTW:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await db.soloqPOTW.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Soloq POTW:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
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

