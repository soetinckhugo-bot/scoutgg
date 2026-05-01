import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Watchlist | LeagueScout",
  description: "Track your favorite players and get alerts on their status changes and SoloQ progress.",
};

export default function WatchlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
