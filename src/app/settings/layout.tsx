import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | LeagueScout",
  description: "Manage your account settings, subscription, and preferences.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
