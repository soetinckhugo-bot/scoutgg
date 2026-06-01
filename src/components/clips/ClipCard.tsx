"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StarRating from "./StarRating";

interface ClipCardProps {
  clip: {
    id: string;
    playerName: string;
    playerRole: string;
    title: string;
    platform: string;
    videoId: string;
    totalVotes: number;
    avgScore: number;
  };
  userVote?: number;
  onVote: (clipId: string, score: number) => void;
  canVote?: boolean;
  onOpen: () => void;
}

function getThumbnailUrl(platform: string, videoId: string): string {
  if (platform === "youtube") {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return "";
}

export default function ClipCard({ clip, userVote, onVote, canVote = true, onOpen }: ClipCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleVote(score: number) {
    setLoading(true);
    await onVote(clip.id, score);
    setLoading(false);
  }

  const thumb = getThumbnailUrl(clip.platform, clip.videoId);

  return (
    <Card className="bg-card border-border overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer group">
      <div className="relative bg-black" style={{ paddingBottom: "133.33%" }} onClick={onOpen}>
        {thumb ? (
          <img
            src={thumb}
            alt={clip.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <span className="text-text-muted text-xs">{clip.platform}</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="text-[10px] bg-surface-hover text-text-body px-1.5 py-0">
            {clip.playerRole}
          </Badge>
          <span className="text-xs font-semibold text-text-heading truncate">
            {clip.playerName}
          </span>
        </div>
        <h3 className="text-xs text-text-body text-center line-clamp-1">{clip.title}</h3>
        <div className="flex items-center justify-center gap-2">
          <StarRating
            value={userVote || Math.round(clip.avgScore)}
            onChange={!loading && canVote ? handleVote : undefined}
            readonly={loading || !canVote}
            size={14}
          />
          <span className="text-[10px] text-text-muted">
            {clip.avgScore > 0 ? `${clip.avgScore}` : "—"} · {clip.totalVotes} votes
          </span>
        </div>
        {!canVote && (
          <p className="text-[10px] text-text-muted text-center">Log in to vote</p>
        )}
      </CardContent>
    </Card>
  );
}
