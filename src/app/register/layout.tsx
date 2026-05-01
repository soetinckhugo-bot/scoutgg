import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | LeagueScout",
  description: "Create your LeagueScout account to start tracking players, saving favorites, and accessing premium scouting reports.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
