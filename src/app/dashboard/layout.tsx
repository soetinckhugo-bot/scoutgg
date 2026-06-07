import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Hub | LeagueScout",
  description: "Your coaching & scouting command center. Track players, manage your pipeline, discover prospects, and collaborate with your staff.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
