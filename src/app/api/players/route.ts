import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/server/db";
import { PlayerCreateSchema } from "@/lib/schemas";
import { requireAdmin } from "@/lib/server/auth";
import { z } from "zod";

const DEFAULT_LIMIT = 50;

const VALID_SORT_FIELDS = [
  "pseudo",
  "peakLp",
  "winrate",
  "totalGames",
  "kda",
  "dpm",
  "cspm",
  "gpm",
  "kpPercent",
  "visionScore",
  "csdAt15",
  "gdAt15",
  "soloKills",
  "poolSize",
  "prospectScore",
] as const;

type SortField = (typeof VALID_SORT_FIELDS)[number];

function buildOrderBy(sort: SortField, order: "asc" | "desc"): any {
  switch (sort) {
    case "pseudo":
      return { pseudo: order };
    case "peakLp":
      return { soloqStats: { peakLp: order } };
    case "winrate":
      return { soloqStats: { winrate: order } };
    case "totalGames":
      return { soloqStats: { totalGames: order } };
    case "kda":
      return { proStats: { kda: order } };
    case "dpm":
      return { proStats: { dpm: order } };
    case "cspm":
      return { proStats: { cspm: order } };
    case "gpm":
      return { proStats: { gpm: order } };
    case "kpPercent":
      return { proStats: { kpPercent: order } };
    case "visionScore":
      return { proStats: { visionScore: order } };
    case "csdAt15":
      return { proStats: { csdAt15: order } };
    case "gdAt15":
      return { proStats: { gdAt15: order } };
    case "soloKills":
      return { proStats: { soloKills: order } };
    case "poolSize":
      return { proStats: { poolSize: order } };
    case "prospectScore":
      return { prospectScore: order };
    default:
      return { pseudo: "asc" };
  }
}

const PlayerQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  sort: z.enum(["pseudo", "peakLp", "winrate", "totalGames", "kda", "dpm", "cspm", "gpm", "kpPercent", "visionScore", "csdAt15", "gdAt15", "soloKills", "poolSize", "prospectScore"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  role: z.string().max(20).optional(),
  league: z.string().max(20).optional(),
  tier: z.string().max(10).optional(),
  minGames: z.coerce.number().min(0).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = PlayerQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const page = Math.max(1, parsed.data.page || 1);
    const limit = Math.min(100, Math.max(1, parsed.data.limit || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;
    const sort = parsed.data.sort || "pseudo";
    const order = parsed.data.order || "asc";
    const role = parsed.data.role;
    const league = parsed.data.league;
    const tier = parsed.data.tier;
    const minGames = parsed.data.minGames || 0;

    const where: any = {};
    if (role) where.role = role;
    if (league) where.league = league;
    if (tier) where.tier = tier;

    const orderBy = buildOrderBy(sort, order);

    const [players, totalCount] = await Promise.all([
      db.player.findMany({
        where,
        select: {
          id: true,
          pseudo: true,
          realName: true,
          role: true,
          league: true,
          currentTeam: true,
          status: true,
          photoUrl: true,
          age: true,
          nationality: true,
          bio: true,
          prospectScore: true,
          isProspect: true,
          contractEndDate: true,
          tier: true,
          opggUrl: true,
          golggUrl: true,
          lolprosUrl: true,
          leaguepediaUrl: true,
          twitterUrl: true,
          agentTwitterUrl: true,
          twitchUrl: true,
          riotId: true,
          hasPlayedInMajorLeague: true,
          peakElo2Years: true,
          bestProResult: true,
          eyeTestRating: true,
          soloqStats: {
            select: {
              currentRank: true,
              peakLp: true,
              winrate: true,
              totalGames: true,
            },
          },
          proStats: {
            select: {
              kda: true,
              dpm: true,
              cspm: true,
              gpm: true,
              kpPercent: true,
              visionScore: true,
              csdAt15: true,
              gdAt15: true,
              soloKills: true,
              poolSize: true,
              gamesPlayed: true,
              globalScore: true,
              tierScore: true,
              winRate: true,
              dthPercent: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.player.count({ where }),
    ]);

    // Client-side filter for minGames (Prisma SQLite doesn't support relation field filtering well)
    let filteredPlayers = players;
    if (minGames > 0) {
      filteredPlayers = players.filter((p) => {
        const games = sort === "totalGames" ? p.soloqStats?.totalGames : p.proStats?.gamesPlayed;
        return (games || 0) >= minGames;
      });
    }

    return NextResponse.json({
      players: filteredPlayers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching players", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const json = await request.json();
    const parsed = PlayerCreateSchema.safeParse(json);

    if (!parsed.success) {
      logger.error("PlayerCreate validation failed", { issues: parsed.error.issues, received: json });
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const player = await db.player.create({
      data: {
        pseudo: body.pseudo,
        realName: body.realName ?? null,
        role: body.role,
        nationality: body.nationality ?? null,
        age: body.age ?? null,
        currentTeam: body.currentTeam ?? null,
        league: body.league,
        tier: body.tier ?? null,
        status: body.status,
        opggUrl: body.opggUrl ?? null,
        golggUrl: body.golggUrl ?? null,
        lolprosUrl: body.lolprosUrl ?? null,
        leaguepediaUrl: body.leaguepediaUrl ?? null,
        twitterUrl: body.twitterUrl ?? null,
        agentTwitterUrl: body.agentTwitterUrl ?? null,
        twitchUrl: body.twitchUrl ?? null,
        riotId: body.riotId ?? null,
        photoUrl: body.photoUrl ?? null,
        bio: body.bio ?? null,
        isFeatured: body.isFeatured ?? false,
        hasPlayedInMajorLeague: body.hasPlayedInMajorLeague ?? false,
        peakElo2Years: body.peakElo2Years ?? null,
        bestProResult: body.bestProResult ?? null,
        eyeTestRating: body.eyeTestRating ?? null,
      },
    });

    // Create empty soloq stats
    await db.soloqStats.create({
      data: {
        playerId: player.id,
        currentRank: "Unranked",
        peakLp: 0,
        winrate: 0,
        totalGames: 0,
        championPool: "",
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    logger.error("Error creating player", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to create player" },
      { status: 500 }
    );
  }
}

