import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { ReportUpdateSchema } from "@/lib/schemas";
import { requireAdmin } from "@/lib/server/auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await db.report.findUnique({
      where: { id },
      include: {
        player: {
          select: { pseudo: true },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // If report is free, return it directly
    if (!report.isPremium) {
      return NextResponse.json(report);
    }

    // Check if user has premium access
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    const isPremium = user?.isPremium === true && user?.subscriptionStatus === "active";

    if (!isPremium) {
      return NextResponse.json(
        {
          error: "Premium subscription required",
          id: report.id,
          title: report.title,
          playerId: report.playerId,
          player: report.player,
          isPremium: true,
          publishedAt: report.publishedAt,
          _locked: true,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    logger.error("Error fetching report:", { error });
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const json = await request.json();
    const parsed = ReportUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const report = await db.report.update({
      where: { id },
      data: {
        ...(body.playerId !== undefined && { playerId: body.playerId }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.strengths !== undefined && { strengths: body.strengths }),
        ...(body.weaknesses !== undefined && { weaknesses: body.weaknesses }),
        ...(body.verdict !== undefined && { verdict: body.verdict }),
        ...(body.author !== undefined && { author: body.author }),
        ...(body.isPremium !== undefined && { isPremium: body.isPremium }),
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    logger.error("Error updating report:", { error });
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;

    await db.report.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting report:", { error });
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
