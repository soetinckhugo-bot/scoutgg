import { db } from "@/lib/server/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/clips/StarRating";
import { Trophy } from "lucide-react";

export const metadata = {
  title: "Hall of Fame — LeagueScout",
  description: "Archive of the best clips of the month.",
};

function getEmbedUrl(platform: string, videoId: string): string {
  if (platform === "tiktok") {
    return `https://www.tiktok.com/embed/${videoId}`;
  }
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

export default async function HallOfFamePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;

  const clips = await db.clip.findMany({
    where: { isWinner: true, ...(month ? { monthPeriod: month } : {}) },
    include: { votes: { select: { score: true } } },
    orderBy: { monthPeriod: "desc" },
  });

  const clipsWithStats = clips.map((clip) => {
    const totalVotes = clip.votes.length;
    const avgScore = totalVotes > 0
      ? clip.votes.reduce((sum, v) => sum + v.score, 0) / totalVotes
      : 0;
    return { ...clip, totalVotes, avgScore: Math.round(avgScore * 10) / 10 };
  });

  const months = Array.from(new Set(clips.map((c) => c.monthPeriod))).sort().reverse();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h1 className="text-3xl font-bold text-text-heading tracking-tight">
              Hall of Fame
            </h1>
          </div>
          <p className="text-text-body text-sm">
            Winning clips, month after month.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {months.map((m) => (
            <a
              key={m}
              href={`/clips/hall-of-fame?month=${m}`}
              className={`text-xs px-3 py-1 rounded-full border ${
                month === m
                  ? "bg-primary-accent text-text-heading border-primary-accent"
                  : "border-border text-text-body hover:bg-surface-hover"
              }`}
            >
              {m}
            </a>
          ))}
        </div>

        {clipsWithStats.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-8 w-8 text-text-muted mx-auto mb-3" />
            <p className="text-text-body text-lg">No winners yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {clipsWithStats.map((clip) => (
              <Card key={clip.id} className="bg-card border-border overflow-hidden">
                <div className="relative bg-black" style={{ paddingBottom: "177.78%" }}>
                  <iframe
                    src={getEmbedUrl(clip.platform, clip.videoId)}
                    title={clip.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs bg-surface-hover text-text-body">
                      {clip.monthPeriod}
                    </Badge>
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-surface-hover text-text-body">
                      {clip.playerRole}
                    </Badge>
                    <span className="text-sm font-semibold text-text-heading truncate">
                      {clip.playerName}
                    </span>
                  </div>
                  <h3 className="text-sm text-text-body line-clamp-2">{clip.title}</h3>
                  <div className="flex items-center gap-2">
                    <StarRating value={Math.round(clip.avgScore)} readonly size={16} />
                    <span className="text-xs text-text-muted">
                      {clip.avgScore}/5 · {clip.totalVotes} votes
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
