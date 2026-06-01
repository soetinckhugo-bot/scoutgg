import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

const updateSchema = z.object({
  playerName: z.string().min(1).max(50).optional(),
  playerRole: z.enum(["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]).optional(),
  title: z.string().min(1).max(100).optional(),
  platform: z.enum(["youtube", "tiktok"]).optional(),
  videoId: z.string().min(1).max(50).optional(),
  monthPeriod: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  isActive: z.boolean().optional(),
  isWinner: z.boolean().optional(),
  adminNotes: z.string().optional().nullable(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = updateSchema.parse(await request.json());
    const clip = await db.clip.update({ where: { id }, data: body });
    return NextResponse.json({ success: true, clip });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    logger.error("PATCH /api/admin/clips/:id failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    await db.clip.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("DELETE /api/admin/clips/:id failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
