"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StarRating from "./StarRating";
import { getChampionIconUrl } from "@/lib/game-assets";

interface ClipCardProps {
  clip: {
    id: string;
    playerName: string;
    playerRole: string;
    champion: string | null;
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

export default function ClipCard({ clip, userVote, onVote, canVote = true, onOpen }: ClipCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleVote(score: number) {
    setLoading(true);
    await onVote(clip.id, score);
    setLoading(false);
  }

  const thumb = clip.champion ? getChampionIconUrl(clip.champion) : "";

  return (
    <Card className="bg-card border-border overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer group">
      <div className="relative bg-black aspect-[4/3] flex items-center justify-center" onClick={onOpen}>
        {thumb ? (
          <img
            src={thumb}
            alt={clip.champion || "champion"}
            className="w-20 h-20 object-contain rounded-lg"
            loading="lazy"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-surface flex items-center justify-center">
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
        {clip.champion && (
          <p className="text-[10px] text-primary-accent text-center font-medium">{clip.champion}</p>
        )}
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
