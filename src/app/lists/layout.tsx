import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Lists | LeagueScout",
  description: "Organize players into custom lists for easy tracking and comparison.",
};

export default function ListsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
