import { db } from "@/lib/server/db";
import type { MetadataRoute } from "next";

export const revalidate = 86400; // Regenerate once per day

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://LeagueScout.gg";

  // Static pages
  const staticPages = [
    { path: "", priority: 1.0, freq: "daily" as const },
    { path: "/players", priority: 0.9, freq: "daily" as const },
    { path: "/prospects", priority: 0.9, freq: "daily" as const },
    { path: "/reports", priority: 0.8, freq: "weekly" as const },
    { path: "/leaderboards", priority: 0.8, freq: "daily" as const },
    { path: "/tierlists", priority: 0.7, freq: "weekly" as const },
    { path: "/compare", priority: 0.7, freq: "weekly" as const },
    { path: "/search", priority: 0.6, freq: "weekly" as const },

    { path: "/about", priority: 0.5, freq: "monthly" as const },
    { path: "/contact", priority: 0.5, freq: "monthly" as const },
    { path: "/similarity", priority: 0.7, freq: "weekly" as const },
    { path: "/draft-board", priority: 0.6, freq: "weekly" as const },
    { path: "/clips", priority: 0.8, freq: "daily" as const },

  ].map(({ path, priority, freq }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }));

  // Dynamic player pages
  const players = await db.player.findMany({
    select: { id: true, updatedAt: true },
  });

  const playerPages = players.map((player) => ({
    url: `${baseUrl}/players/${player.id}`,
    lastModified: player.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic clip pages (gracefully skip if table doesn't exist yet)
  let clipPages: MetadataRoute.Sitemap = [];
  try {
    const clips = await db.clip.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
    });
    clipPages = clips.map((clip) => ({
      url: `${baseUrl}/clips/${clip.id}`,
      lastModified: clip.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Table may not exist during build on fresh environments
  }

  return [...staticPages, ...playerPages, ...clipPages];
}

