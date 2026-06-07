import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ScrimSchema = z.object({
  date: z.string().min(1),
  opponent: z.string().min(1).max(100),
  result: z.enum(["WIN", "LOSS", "DRAW"]),
  compAlly: z.string().max(500).optional(),
  compEnemy: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const opponent = searchParams.get("opponent") || undefined;
    const result = searchParams.get("result") || undefined;

    const where: Record<string, unknown> = {};
    if (opponent) {
      where.opponent = { contains: opponent };
    }
    if (result) {
      where.result = result;
    }

    const [scrims, total] = await Promise.all([
      db.scrim.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.scrim.count({ where }),
    ]);

    return NextResponse.json({
      scrims,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("GET /api/scrims failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch scrims" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = ScrimSchema.parse(body);

    const scrim = await db.scrim.create({
      data: {
        ...data,
        date: new Date(data.date),
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(scrim, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    logger.error("POST /api/scrims failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create scrim" },
      { status: 500 }
    );
  }
}
