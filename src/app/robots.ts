import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://LeagueScout.gg";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/login",
          "/register",
          "/settings",
          "/dashboard",
          "/watchlist",
          "/lists",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
