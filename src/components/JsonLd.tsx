interface JsonLdProps {
  data: Record<string, any> | Record<string, any>[];
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}

export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "LeagueScout",
        url: process.env.NEXTAUTH_URL || "https://LeagueScout.gg",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${
              process.env.NEXTAUTH_URL || "https://LeagueScout.gg"
            }/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "LeagueScout",
        url: process.env.NEXTAUTH_URL || "https://LeagueScout.gg",
        logo: `${
          process.env.NEXTAUTH_URL || "https://LeagueScout.gg"
        }/logo.png`,
        sameAs: [
          "https://twitter.com/LeagueScout",
          "https://discord.gg/LeagueScout",
        ],
      }}
    />
  );
}

export function ProfilePageJsonLd({
  player,
}: {
  player: {
    pseudo: string;
    realName?: string | null;
    role: string;
    league: string;
    currentTeam?: string | null;
    bio?: string | null;
    photoUrl?: string | null;
  };
}) {
  const siteUrl = process.env.NEXTAUTH_URL || "https://LeagueScout.gg";

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        mainEntity: {
          "@type": "Person",
          name: player.pseudo,
          alternateName: player.realName || undefined,
          description:
            player.bio ||
            `${player.pseudo} is a ${player.role} player in ${player.league}.`,
          jobTitle: `${player.role} Player`,
          image: player.photoUrl || undefined,
          memberOf: player.currentTeam
            ? {
                "@type": "SportsTeam",
                name: player.currentTeam,
              }
            : undefined,
          url: `${siteUrl}/players/${player.pseudo}`,
        },
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

