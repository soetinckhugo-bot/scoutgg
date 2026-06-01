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
}

function getEmbedUrl(platform: string, videoId: string): string {
  if (platform === "tiktok") {
    return `https://www.tiktok.com/embed/${videoId}`;
  }
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

export default function ClipCard({ clip, userVote, onVote }: ClipCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleVote(score: number) {
    setLoading(true);
    await onVote(clip.id, score);
    setLoading(false);
  }

  return (
    <Card className="bg-card border-border overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
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
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs bg-surface-hover text-text-body">
            {clip.playerRole}
          </Badge>
          <span className="text-sm font-semibold text-text-heading truncate">
            {clip.playerName}
          </span>
        </div>
        <h3 className="text-sm text-text-body line-clamp-2">{clip.title}</h3>
        <div className="flex items-center justify-between">
          <StarRating
            value={userVote || Math.round(clip.avgScore)}
            onChange={!loading ? handleVote : undefined}
            readonly={loading}
            size={18}
          />
          <span className="text-xs text-text-muted">
            {clip.avgScore > 0 ? `${clip.avgScore}/5` : "—"} · {clip.totalVotes} vote{clip.totalVotes !== 1 ? "s" : ""}
          </span>
        </div>
        {userVote && (
          <p className="text-xs text-success">Vote enregistré</p>
        )}
      </CardContent>
    </Card>
  );
}
