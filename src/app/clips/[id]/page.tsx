import { Metadata } from "next";
import { db } from "@/lib/server/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getChampionIconUrl } from "@/lib/game-assets";
import { Star, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CopyLinkButton from "@/components/clips/CopyLinkButton";

interface Props {
  params: Promise<{ id: string }>;
}

async function getClip(id: string) {
  const clip = await db.clip.findUnique({
    where: { id },
    include: { votes: { select: { score: true } } },
  });
  if (!clip) return null;

  const totalVotes = clip.votes.length;
  const avgScore = totalVotes > 0
    ? clip.votes.reduce((sum, v) => sum + v.score, 0) / totalVotes
    : 0;

  return {
    ...clip,
    totalVotes,
    avgScore: Math.round(avgScore * 10) / 10,
  };
}

async function getRelatedClips(monthPeriod: string, excludeId: string) {
  const clips = await db.clip.findMany({
    where: {
      monthPeriod,
      isActive: true,
      id: { not: excludeId },
    },
    include: { votes: { select: { score: true } } },
  });

  return clips
    .map((clip) => {
      const totalVotes = clip.votes.length;
      const avgScore = totalVotes > 0
        ? clip.votes.reduce((sum, v) => sum + v.score, 0) / totalVotes
        : 0;
      return {
        id: clip.id,
        playerName: clip.playerName,
        playerRole: clip.playerRole,
        champion: clip.champion,
        title: clip.title,
        platform: clip.platform,
        videoId: clip.videoId,
        totalVotes,
        avgScore: Math.round(avgScore * 10) / 10,
        popularity: totalVotes * (Math.round(avgScore * 10) / 10),
      };
    })
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 3);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const clip = await getClip(id);
  if (!clip) {
    return { title: "Clip not found | LeagueScout" };
  }

  const title = `${clip.playerName} — "${clip.title}" | LeagueScout Clip of the Month`;
  const description = `Community clip rated ${clip.avgScore}/5. Watch ${clip.playerName}'s${clip.champion ? ` ${clip.champion}` : ""} highlight.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
      url: `/clips/${clip.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ClipPage({ params }: Props) {
  const { id } = await params;
  const clip = await getClip(id);

  if (!clip) {
    notFound();
  }

  const related = await getRelatedClips(clip.monthPeriod, clip.id);
  const pageUrl = `https://leaguescout.gg/clips/${clip.id}`;

  const embedUrl = clip.platform === "tiktok"
    ? `https://www.tiktok.com/embed/${clip.videoId}`
    : `https://www.youtube.com/embed/${clip.videoId}?rel=0&autoplay=0&vq=hd1080&modestbranding=1&iv_load_policy=3`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: clip.title,
            description: `Community clip by ${clip.playerName}${clip.champion ? ` on ${clip.champion}` : ""}. Rated ${clip.avgScore}/5 by the LeagueScout community.`,
            thumbnailUrl: clip.champion
              ? getChampionIconUrl(clip.champion)
              : `https://img.youtube.com/vi/${clip.videoId}/0.jpg`,
            uploadDate: clip.createdAt.toISOString(),
            contentUrl: `https://leaguescout.gg/clips/${clip.id}`,
            embedUrl: clip.platform === "tiktok"
              ? `https://www.tiktok.com/embed/${clip.videoId}`
              : `https://www.youtube.com/embed/${clip.videoId}`,
            author: {
              "@type": "Person",
              name: clip.playerName,
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: clip.avgScore,
              bestRating: 5,
              ratingCount: clip.totalVotes,
            },
          }),
        }}
      />
      <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Back link */}
        <Link
          href="/clips"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-heading transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clip of the Month
        </Link>

        {/* Video */}
        <div className="relative w-full max-w-sm mx-auto mb-8 rounded-2xl overflow-hidden border border-border bg-black shadow-2xl">
          <div className="relative w-full" style={{ paddingBottom: "177.78%" }}>
            <iframe
              src={embedUrl}
              title={clip.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Info */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-3">
            {clip.champion && (
              <img
                src={getChampionIconUrl(clip.champion)}
                alt={clip.champion}
                className="w-12 h-12 rounded-lg object-contain bg-black border border-border"
              />
            )}
            <div className="text-left">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-surface-hover text-text-body uppercase tracking-wide">
                  {clip.playerRole}
                </Badge>
                <span className="text-lg font-bold text-text-heading">{clip.playerName}</span>
              </div>
              {clip.champion && (
                <p className="text-sm text-primary-accent font-medium">{clip.champion}</p>
              )}
            </div>
          </div>

          <h1 className="text-xl font-bold text-text-heading">{clip.title}</h1>

          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(clip.avgScore)
                      ? "text-tier-s fill-tier-s"
                      : "text-border"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-text-heading">{clip.avgScore}/5</span>
            <span className="text-sm text-text-muted">· {clip.totalVotes} votes</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <CopyLinkButton url={pageUrl} />
            <Button variant="outline" size="sm" className="border-border text-text-body hover:bg-surface-hover" asChild>
              <Link href={`/players?search=${encodeURIComponent(clip.playerName)}`}>
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Discover this player
              </Link>
            </Button>
          </div>
        </div>

        {/* Related clips */}
        {related.length > 0 && (
          <div className="border-t border-border pt-8">
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-wide mb-4 text-center">
              Popular this month
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/clips/${r.id}`}
                  className="group block rounded-xl border border-border bg-card overflow-hidden hover:border-primary-accent/40 transition-colors"
                >
                  <div className="relative aspect-[4/3] bg-[#1A1D29] flex items-center justify-center overflow-hidden">
                    {r.champion ? (
                      <img
                        src={getChampionIconUrl(r.champion)}
                        alt={r.champion}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[10px] text-text-muted uppercase">{r.platform}</span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-text-heading truncate">{r.playerName}</p>
                    <p className="text-[10px] text-text-muted truncate">{r.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-tier-s fill-tier-s" />
                      <span className="text-[10px] text-text-muted">{r.avgScore}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </>
  );
}
