import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ScrimUpdateSchema = z.object({
  date: z.string().min(1).optional(),
  opponent: z.string().min(1).max(100).optional(),
  result: z.enum(["WIN", "LOSS", "DRAW"]).optional(),
  compAlly: z.string().max(500).optional().nullable(),
  compEnemy: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const scrim = await db.scrim.findUnique({ where: { id } });
    if (!scrim) {
      return NextResponse.json({ error: "Scrim not found" }, { status: 404 });
    }
    return NextResponse.json(scrim);
  } catch (error) {
    logger.error("GET /api/scrims/[id] failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch scrim" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = ScrimUpdateSchema.parse(body);

    const existing = await db.scrim.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Scrim not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }

    const scrim = await db.scrim.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(scrim);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    logger.error("PATCH /api/scrims/[id] failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update scrim" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.scrim.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Scrim not found" }, { status: 404 });
    }

    await db.scrim.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("DELETE /api/scrims/[id] failed", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete scrim" },
      { status: 500 }
    );
  }
}
