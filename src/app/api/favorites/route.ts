import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth/next";
import { db } from "@/lib/server/db";
import { FavoriteCreateSchema, FavoriteUpdateSchema } from "@/lib/schemas";
import { authOptions } from "@/lib/server/auth-options";

function getUserId(session: any): string | null {
  return session?.user?.email || null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await db.favorite.findMany({
      where: { userId },
      include: {
        player: {
          include: {
            soloqStats: true,
            proStats: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(favorites);
  } catch (error) {
    logger.error("Error fetching favorites", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = FavoriteCreateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { playerId } = parsed.data;

    // Check if already favorited
    const existing = await db.favorite.findFirst({
      where: {
        userId,
        playerId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Player is already in favorites" },
        { status: 409 }
      );
    }

    const favorite = await db.favorite.create({
      data: {
        userId,
        playerId,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    logger.error("Error creating favorite", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = FavoriteCreateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { playerId } = parsed.data;

    const existing = await db.favorite.findFirst({
      where: {
        userId,
        playerId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Favorite not found" },
        { status: 404 }
      );
    }

    await db.favorite.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting favorite", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = FavoriteUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { playerId, notes } = parsed.data;

    const existing = await db.favorite.findFirst({
      where: { userId, playerId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Favorite not found" },
        { status: 404 }
      );
    }

    const updated = await db.favorite.update({
      where: { id: existing.id },
      data: { notes: notes ?? null },
      include: {
        player: {
          include: {
            soloqStats: true,
            proStats: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("Error updating favorite notes", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to update notes" },
      { status: 500 }
    );
  }
}

