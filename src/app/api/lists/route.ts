import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth/next";
import { db } from "@/lib/server/db";
import { authOptions } from "@/lib/server/auth-options";
import { z } from "zod";

function getUserId(session: any): string | null {
  return session?.user?.email || null;
}

const createListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  playerIds: z.array(z.string().min(1)).optional(),
});

const updateListSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  addPlayerIds: z.array(z.string().min(1)).optional(),
  removePlayerIds: z.array(z.string().min(1)).optional(),
});

const deleteListSchema = z.object({
  id: z.string().min(1),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lists = await db.playerList.findMany({
      where: { userId },
      include: {
        players: {
          include: {
            player: {
              select: {
                id: true, pseudo: true, realName: true, role: true, league: true,
                currentTeam: true, status: true, photoUrl: true, age: true,
                soloqStats: { select: { currentRank: true, peakLp: true, winrate: true } },
                proStats: { select: { kda: true, dpm: true, globalScore: true } },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return NextResponse.json(lists);
  } catch (error) {
    logger.error("Error fetching lists", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch lists" },
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
    const parsed = createListSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, color, playerIds } = parsed.data;

    const list = await db.playerList.create({
      data: {
        userId,
        name: name.slice(0, 100),
        description: description?.slice(0, 500) || null,
        color: color || "#E94560",
        players: {
          create:
            playerIds?.map((pid: string) => ({ playerId: pid })) || [],
        },
      },
      include: {
        players: {
          include: {
            player: {
              include: {
                soloqStats: true,
                proStats: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    logger.error("Error creating list", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to create list" },
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
    const parsed = updateListSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, name, description, color, addPlayerIds, removePlayerIds } = parsed.data;

    const existing = await db.playerList.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.slice(0, 100);
    if (description !== undefined) updateData.description = description?.slice(0, 500) || null;
    if (color !== undefined) updateData.color = color;

    const updated = await db.playerList.update({
      where: { id },
      data: {
        ...updateData,
        players: {
          create: addPlayerIds?.map((pid: string) => ({ playerId: pid })) || [],
          deleteMany: removePlayerIds?.map((pid: string) => ({
            playerId: pid,
          })) || [],
        },
      },
      include: {
        players: {
          include: {
            player: {
              include: {
                soloqStats: true,
                proStats: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("Error updating list", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to update list" },
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
    const parsed = deleteListSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = parsed.data;

    const existing = await db.playerList.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    await db.playerList.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting list", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to delete list" },
      { status: 500 }
    );
  }
}

