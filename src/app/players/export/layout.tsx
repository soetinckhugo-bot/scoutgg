import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Export Player Card | LeagueScout",
  description: "Generate and export custom League of Legends player identity cards and analysis cards for social media.",
  openGraph: {
    title: "Export Player Card | LeagueScout",
    description: "Generate and export custom League of Legends player identity cards and analysis cards.",
    type: "website",
  },
};

export default function ExportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
