import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { logger } from "@/lib/logger";
import { z } from "zod";

const PlanSchema = z.object({
  playerId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  targetDate: z.string().optional(),
  status: z.enum(["active", "completed", "abandoned"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  targetDate: z.string().optional().nullable(),
  status: z.enum(["active", "completed", "abandoned"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: Record<string, unknown> = {};
    if (playerId) where.playerId = playerId;
    if (status) where.status = status;

    const plans = await db.developmentPlan.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    });

    // Enrich with player data
    const playerIds = [...new Set(plans.map((p) => p.playerId))];
    const players = await db.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, pseudo: true, role: true, photoUrl: true },
    });
    const playerMap = new Map(players.map((p) => [p.id, p]));

    const enriched = plans.map((p) => ({
      ...p,
      player: playerMap.get(p.playerId) || { id: p.playerId, pseudo: "Unknown", role: "", photoUrl: null },
    }));

    return NextResponse.json({ plans: enriched });
  } catch (error) {
    logger.error("GET /api/development-plans failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch plans" },
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
    const data = PlanSchema.parse(body);

    const plan = await db.developmentPlan.create({
      data: {
        ...data,
        userId: session.user.id,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    logger.error("POST /api/development-plans failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create plan" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const data = UpdateSchema.parse(rest);

    const updateData: Record<string, unknown> = { ...data };
    if (data.targetDate !== undefined) {
      updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    }

    const plan = await db.developmentPlan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    logger.error("PATCH /api/development-plans failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update plan" },
      { status: 500 }
    );
  }
}
