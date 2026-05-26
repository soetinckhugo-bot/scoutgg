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
    youtubeId: string;
    totalVotes: number;
    avgScore: number;
  };
  userVote?: number;
  onVote: (clipId: string, score: number) => void;
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
      <div className="relative aspect-video bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${clip.youtubeId}?rel=0`}
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
