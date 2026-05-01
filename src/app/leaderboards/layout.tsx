import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboards | LeagueScout",
  description: "League of Legends player leaderboards ranked by LP, winrate, KDA, DPM, and more. Filter by league and role.",
  openGraph: {
    title: "Leaderboards | LeagueScout",
    description: "League of Legends player leaderboards ranked by LP, winrate, KDA, DPM, and more.",
    type: "website",
  },
};

export default function LeaderboardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
