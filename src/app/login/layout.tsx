import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | LeagueScout",
  description: "Sign in to your LeagueScout account to access your watchlist, favorites, and premium scouting reports.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
