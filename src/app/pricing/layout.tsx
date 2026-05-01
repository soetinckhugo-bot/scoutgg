import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | LeagueScout",
  description: "Choose your LeagueScout plan. From free browsing to professional scouting tools with premium reports, advanced filters, and data export.",
  openGraph: {
    title: "Pricing | LeagueScout",
    description: "Choose your LeagueScout plan. Free, Supporter, Scout Pro, and Consulting options.",
    type: "website",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
