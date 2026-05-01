import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Draft Board | LeagueScout",
  description: "Plan your roster with our draft board tool. Organize picks by role and priority.",
};

export default function DraftBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
