import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clip of the Month | LeagueScout",
  description:
    "Discover the best League of Legends community clips. Vote for your favorite plays, watch highlights from pros, and share epic moments.",
  openGraph: {
    title: "Clip of the Month | LeagueScout",
    description:
      "The best LoL community clips — vote for your favorite highlights.",
    type: "website",
    url: "/clips",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clip of the Month | LeagueScout",
    description: "The best LoL community clips — vote for your favorite highlights.",
  },
};

export default function ClipsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
