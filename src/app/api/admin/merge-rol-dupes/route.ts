import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    // 1. Fetch all ROL players with their stats
    const rolPlayers = await db.player.findMany({
      where: { league: "ROL" },
      include: {
        proStats: true,
        soloqStats: true,
        reports: true,
        proMatches: true,
        favorites: true,
        ratings: true,
        listItems: true,
        timelineEvents: true,
        proStatsSplits: true,
      },
    });

    // 2. Group by lowercase pseudo
    const byPseudo = new Map<string, typeof rolPlayers>();
    for (const p of rolPlayers) {
      const key = p.pseudo.toLowerCase();
      if (!byPseudo.has(key)) byPseudo.set(key, []);
      byPseudo.get(key)!.push(p);
    }

    const duplicates = [...byPseudo.entries()].filter(([_, list]) => list.length > 1);
    const results: {
      pseudo: string;
      count: number;
      keptId: string;
      keptPseudo: string;
      mergedFrom: string[];
      deletedIds: string[];
      notes: string[];
    }[] = [];

    for (const [pseudoKey, list] of duplicates) {
      // Sort: prefer player with proStats, then photo, then most fields, then newest
      const scored = list.map((p) => {
        let score = 0;
        if (p.proStats) score += 1000;
        if (p.photoUrl) score += 100;
        const filledFields = [
          p.realName, p.nationality, p.currentTeam, p.age,
          p.riotPuuid, p.opggUrl, p.bio,
        ].filter(Boolean).length;
        score += filledFields * 10;
        score += new Date(p.updatedAt).getTime() / 1e12; // tie-breaker: newest
        return { player: p, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const master = scored[0].player;
      const dupes = scored.slice(1).map((s) => s.player);
      const notes: string[] = [];

      // Merge player fields: fill nulls on master from dupes
      const updateData: Record<string, any> = {};
      const fieldsToMerge = [
        "photoUrl", "realName", "nationality", "age", "currentTeam",
        "riotPuuid", "riotId", "opggUrl", "golggUrl", "lolprosUrl",
        "twitterUrl", "agentTwitterUrl", "twitchUrl", "leaguepediaUrl",
        "discordTag", "bio", "behaviorTags", "signatureChampion",
      ] as const;

      for (const field of fieldsToMerge) {
        if (!(master as any)[field]) {
          for (const d of dupes) {
            if ((d as any)[field]) {
              updateData[field] = (d as any)[field];
              break;
            }
          }
        }
      }

      if (Object.keys(updateData).length > 0) {
        await db.player.update({ where: { id: master.id }, data: updateData });
        notes.push(`Merged fields: ${Object.keys(updateData).join(", ")}`);
      }

      // Merge ProStats (1:1) - if master lacks one, reassign dupe's
      for (const d of dupes) {
        if (d.proStats && !master.proStats) {
          await db.proStats.update({
            where: { playerId: d.id },
            data: { playerId: master.id },
          });
          notes.push(`Transferred ProStats from ${d.id}`);
        }
      }

      // Merge SoloqStats (1:1)
      for (const d of dupes) {
        if (d.soloqStats && !master.soloqStats) {
          await db.soloqStats.update({
            where: { playerId: d.id },
            data: { playerId: master.id },
          });
          notes.push(`Transferred SoloqStats from ${d.id}`);
        }
      }

      // Merge relations (1:N) - update playerId
      const relationUpdaters = [
        { name: "Reports", fn: (id: string, dupId: string) => db.report.updateMany({ where: { playerId: dupId }, data: { playerId: id } }) },
        { name: "ProMatches", fn: (id: string, dupId: string) => db.proMatch.updateMany({ where: { playerId: dupId }, data: { playerId: id } }) },
        { name: "TimelineEvents", fn: (id: string, dupId: string) => db.timelineEvent.updateMany({ where: { playerId: dupId }, data: { playerId: id } }) },
        { name: "ProStatsSplits", fn: (id: string, dupId: string) => db.proStatsSplit.updateMany({ where: { playerId: dupId }, data: { playerId: id } }) },
      ];

      for (const d of dupes) {
        for (const updater of relationUpdaters) {
          try {
            const res = await updater.fn(master.id, d.id);
            if (res.count > 0) notes.push(`Transferred ${res.count} ${updater.name} from ${d.id}`);
          } catch (e: any) {
            notes.push(`Failed to transfer ${updater.name} from ${d.id}: ${e.message}`);
          }
        }

        // Favorites (unique userId+playerId) - skip conflicts
        for (const fav of d.favorites) {
          try {
            await db.favorite.update({
              where: { id: fav.id },
              data: { playerId: master.id },
            });
            notes.push(`Transferred Favorite ${fav.id}`);
          } catch {
            await db.favorite.delete({ where: { id: fav.id } });
            notes.push(`Deleted conflicting Favorite ${fav.id}`);
          }
        }

        // PlayerRatings (unique playerId+userId) - skip conflicts
        for (const rating of d.ratings) {
          try {
            await db.playerRating.update({
              where: { id: rating.id },
              data: { playerId: master.id },
            });
            notes.push(`Transferred Rating ${rating.id}`);
          } catch {
            await db.playerRating.delete({ where: { id: rating.id } });
            notes.push(`Deleted conflicting Rating ${rating.id}`);
          }
        }

        // PlayerListItems (unique playerListId+playerId) - skip conflicts
        for (const item of d.listItems) {
          try {
            await db.playerListItem.update({
              where: { id: item.id },
              data: { playerId: master.id },
            });
            notes.push(`Transferred ListItem ${item.id}`);
          } catch {
            await db.playerListItem.delete({ where: { id: item.id } });
            notes.push(`Deleted conflicting ListItem ${item.id}`);
          }
        }
      }

      // Delete duplicates
      const deletedIds: string[] = [];
      for (const d of dupes) {
        try {
          await db.player.delete({ where: { id: d.id } });
          deletedIds.push(d.id);
        } catch (e: any) {
          notes.push(`Failed to delete ${d.id}: ${e.message}`);
        }
      }

      results.push({
        pseudo: pseudoKey,
        count: list.length,
        keptId: master.id,
        keptPseudo: master.pseudo,
        mergedFrom: dupes.map((d) => d.pseudo),
        deletedIds,
        notes,
      });
    }

    // Verification: count ROL players without ProStats
    const rolWithoutStats = await db.player.count({
      where: { league: "ROL", proStats: null },
    });

    const totalRol = await db.player.count({ where: { league: "ROL" } });

    return NextResponse.json({
      success: true,
      duplicatesFound: duplicates.length,
      duplicatesMerged: results.length,
      totalRol,
      rolWithoutStats,
      details: results,
    });
  } catch (error: any) {
    logger.error("ROL merge error:", { error });
    return NextResponse.json(
      { error: error.message || "Merge failed" },
      { status: 500 }
    );
  }
}
