"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StarRating from "./StarRating";

interface ClipPodiumProps {
  clips: {
    id: string;
    playerName: string;
    playerRole: string;
    title: string;
    platform: string;
    videoId: string;
    totalVotes: number;
    avgScore: number;
  }[];
  onOpen: (clip: any) => void;
}

function getThumbnailUrl(platform: string, videoId: string): string {
  if (platform === "youtube") {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return "";
}

export default function ClipPodium({ clips, onOpen }: ClipPodiumProps) {
  if (clips.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10">
      {clips.slice(0, 3).map((clip, i) => {
        const isFirst = i === 0;
        const isSecond = i === 1;
        const rankBg = isFirst
          ? "bg-yellow-500/10 border-yellow-500/30"
          : isSecond
          ? "bg-slate-400/10 border-slate-400/30"
          : "bg-amber-500/10 border-amber-500/30";
        const rankText = isFirst
          ? "text-yellow-500"
          : isSecond
          ? "text-slate-400"
          : "text-amber-400";

        const thumb = getThumbnailUrl(clip.platform, clip.videoId);

        return (
          <Card key={clip.id} className={`border-2 ${rankBg} overflow-hidden cursor-pointer group hover:shadow-lg hover:scale-[1.02] transition-all`} onClick={() => onOpen(clip)}>
            <div className="relative bg-black" style={{ paddingBottom: "133.33%" }}>
              {thumb ? (
                <img src={thumb} alt={clip.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-surface">
                  <span className="text-text-muted text-xs">{clip.platform}</span>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <CardContent className="p-4 space-y-2">
              <div className={`text-2xl font-bold ${rankText} text-center`}>
                #{i + 1}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="text-xs bg-surface-hover text-text-body">
                  {clip.playerRole}
                </Badge>
                <span className="text-sm font-semibold text-text-heading truncate">
                  {clip.playerName}
                </span>
              </div>
              <p className="text-xs text-text-body text-center line-clamp-1">{clip.title}</p>
              <div className="flex items-center justify-center gap-2">
                <StarRating value={Math.round(clip.avgScore)} readonly size={16} />
                <span className="text-xs text-text-muted">
                  {clip.avgScore}/5 · {clip.totalVotes} votes
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
