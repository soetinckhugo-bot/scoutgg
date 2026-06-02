"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StarRating from "./StarRating";
import CopyLinkButton from "./CopyLinkButton";
import { getChampionIconUrl } from "@/lib/game-assets";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

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
            className="w-full h-full object-contain p-6"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
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
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <CopyLinkButton
            url={`https://leaguescout.gg/clips/${clip.id}`}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[10px] text-text-muted hover:text-text-heading"
          />
          <Link
            href={`/clips/${clip.id}`}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[10px] text-text-muted hover:text-text-heading hover:bg-surface-hover transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Page
          </Link>
        </div>
        {!canVote && (
          <p className="text-[10px] text-text-muted text-center">Log in to vote</p>
        )}
      </CardContent>
    </Card>
  );
}
