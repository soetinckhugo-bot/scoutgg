import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { PlayerUpdateSchema } from "@/lib/schemas";
import { requireAdmin } from "@/lib/server/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = await db.player.findUnique({
      where: { id },
      include: {
        soloqStats: true,
        proStats: true,
        reports: true,
        vods: true,
      },
    });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    return NextResponse.json(player);
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player" },
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
    const parsed = PlayerUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const player = await db.player.update({
      where: { id },
      data: {
        ...(body.pseudo !== undefined && { pseudo: body.pseudo }),
        ...(body.realName !== undefined && { realName: body.realName }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.nationality !== undefined && { nationality: body.nationality }),
        ...(body.age !== undefined && { age: body.age }),
        ...(body.currentTeam !== undefined && { currentTeam: body.currentTeam }),
        ...(body.league !== undefined && { league: body.league }),
        ...(body.tier !== undefined && { tier: body.tier }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.opggUrl !== undefined && { opggUrl: body.opggUrl }),
        ...(body.golggUrl !== undefined && { golggUrl: body.golggUrl }),
        ...(body.lolprosUrl !== undefined && { lolprosUrl: body.lolprosUrl }),
        ...(body.leaguepediaUrl !== undefined && {
          leaguepediaUrl: body.leaguepediaUrl,
        }),
        ...(body.twitterUrl !== undefined && { twitterUrl: body.twitterUrl }),
        ...(body.twitchUrl !== undefined && { twitchUrl: body.twitchUrl }),
        ...(body.riotId !== undefined && { riotId: body.riotId }),
        ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.behaviorTags !== undefined && { behaviorTags: body.behaviorTags }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
      },
    });

    return NextResponse.json(player);
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
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

    await db.player.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting player:", error);
    return NextResponse.json(
      { error: "Failed to delete player" },
      { status: 500 }
    );
  }
}
