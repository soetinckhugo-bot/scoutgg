import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { PlayerUpdateSchema } from "@/lib/schemas";
import { requireAdmin } from "@/lib/server/auth";
import { logger } from "@/lib/logger";
import { computeProspectScore } from "@/lib/prospect-scoring";

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
    logger.error("Error fetching player:", { error });
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

    await db.player.update({
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
        ...(body.agentTwitterUrl !== undefined && { agentTwitterUrl: body.agentTwitterUrl }),
        ...(body.twitchUrl !== undefined && { twitchUrl: body.twitchUrl }),
        ...(body.riotId !== undefined && { riotId: body.riotId }),
        ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.hasPlayedInMajorLeague !== undefined && { hasPlayedInMajorLeague: body.hasPlayedInMajorLeague }),
        ...(body.peakElo2Years !== undefined && { peakElo2Years: body.peakElo2Years }),
        ...(body.bestProResult !== undefined && { bestProResult: body.bestProResult }),
        ...(body.eyeTestRating !== undefined && { eyeTestRating: body.eyeTestRating }),
        ...(body.behaviorTags !== undefined && { behaviorTags: body.behaviorTags }),
        ...(body.signatureChampion !== undefined && { signatureChampion: body.signatureChampion }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.isProspect !== undefined && { isProspect: body.isProspect }),
      },
    });

    // Fetch updated player with relations for score recalculation
    const player = await db.player.findUnique({
      where: { id },
      include: { proStats: true, soloqStats: true },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found after update" }, { status: 404 });
    }

    // Auto-recalculate prospect score if player is marked as prospect
    if (player.isProspect) {
      try {
        const { total } = computeProspectScore({
          peakLp: player.peakElo2Years ?? 0,
          bestProResult: player.bestProResult,
          currentLeague: player.league,
          proWinrate: player.proStats?.winRate ?? null,
          age: player.age,
          globalScore: player.proStats?.globalScore ?? null,
          eyeTestRating: player.eyeTestRating,
        });
        await db.player.update({
          where: { id },
          data: { prospectScore: total },
        });
        (player as any).prospectScore = total;
      } catch (scoreError) {
        logger.error("Failed to auto-recalculate prospect score", { playerId: id, error: scoreError });
      }
    }

    return NextResponse.json(player);
  } catch (error) {
    logger.error("Error updating player:", { error });
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
    logger.error("Error deleting player:", { error });
    return NextResponse.json(
      { error: "Failed to delete player" },
      { status: 500 }
    );
  }
}
