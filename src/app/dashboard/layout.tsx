import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | LeagueScout",
  description: "Your personalized scouting command center. Track players, manage your pipeline, and discover prospects.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
