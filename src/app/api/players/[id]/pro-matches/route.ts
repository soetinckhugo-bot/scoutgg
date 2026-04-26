import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { z } from "zod";

// GET /api/players/[id]/pro-matches
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const matches = await db.proMatch.findMany({
      where: { playerId: id },
      orderBy: { matchDate: "desc" },
    });
    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error fetching pro matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch pro matches" },
      { status: 500 }
    );
  }
}

// POST /api/players/[id]/pro-matches — create a new pro match
const ProMatchCreateSchema = z.object({
  matchDate: z.string().datetime(),
  champion: z.string().min(1),
  result: z.enum(["WIN", "LOSS"]),
  duration: z.string(),
  kda: z.string(),
  cs: z.number().int().optional().nullable(),
  cspm: z.number().optional().nullable(),
  gold: z.number().int().optional().nullable(),
  gpm: z.number().optional().nullable(),
  damage: z.number().int().optional().nullable(),
  dpm: z.number().optional().nullable(),
  damagePercent: z.number().optional().nullable(),
  kpPercent: z.number().optional().nullable(),
  visionScore: z.number().int().optional().nullable(),
  teamName: z.string(),
  opponent: z.string(),
  tournament: z.string(),
  gameVersion: z.string().optional().nullable(),
  patch: z.string().optional().nullable(),
  items: z.string().optional().nullable(),
  summoner1: z.string().optional().nullable(),
  summoner2: z.string().optional().nullable(),
  keystoneRune: z.string().optional().nullable(),
  secondaryRune: z.string().optional().nullable(),
  side: z.enum(["BLUE", "RED"]).optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = ProMatchCreateSchema.parse(body);

    const match = await db.proMatch.create({
      data: {
        ...data,
        matchDate: new Date(data.matchDate),
        playerId: id,
      },
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating pro match:", error);
    return NextResponse.json(
      { error: "Failed to create pro match" },
      { status: 500 }
    );
  }
}
