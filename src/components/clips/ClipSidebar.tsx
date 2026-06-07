"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { getChampionIconUrl } from "@/lib/game-assets";
import StarRating from "./StarRating";

interface SidebarClip {
  id: string;
  playerName: string;
  playerRole: string;
  champion: string | null;
  title: string;
  totalVotes: number;
  avgScore: number;
  platform: string;
  videoId: string;
}

interface ClipSidebarProps {
  clips: SidebarClip[];
  title?: string;
  onOpen: (clip: SidebarClip) => void;
  activeClipId?: string;
}

export default function ClipSidebar({ clips, title = "Popular This Month", onOpen, activeClipId }: ClipSidebarProps) {
  const sorted = [...clips]
    .sort((a, b) => {
      const scoreA = a.totalVotes * a.avgScore;
      const scoreB = b.totalVotes * b.avgScore;
      return scoreB - scoreA;
    })
    .slice(0, 5);

  if (sorted.length === 0) return null;

  return (
    <Card className="border-border bg-card sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-text-heading uppercase tracking-wide">
          <TrendingUp className="w-4 h-4 text-primary-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map((clip, i) => (
          <button
            key={clip.id}
            onClick={() => onOpen(clip)}
            className={`w-full text-left p-2 rounded-lg transition-colors hover:bg-surface-hover flex items-center gap-3 ${
              activeClipId === clip.id ? "bg-primary-accent/10 ring-1 ring-primary-accent/30" : ""
            }`}
          >
            <span className="text-sm font-bold text-text-muted w-5 text-center">{i + 1}</span>
            <div className="w-10 h-10 rounded-lg bg-[#1A1D29] flex items-center justify-center shrink-0 overflow-hidden">
              {clip.champion ? (
                <Image
                  src={getChampionIconUrl(clip.champion)}
                  alt={clip.champion}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <span className="text-[10px] text-text-muted uppercase">{clip.platform.slice(0, 2)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] h-4 px-1 border-border text-text-muted">
                  {clip.playerRole}
                </Badge>
                <span className="text-sm font-semibold text-text-heading truncate">{clip.playerName}</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <StarRating value={Math.round(clip.avgScore)} readonly size={10} />
                <span className="text-[10px] text-text-muted">
                  {clip.avgScore}/5 · {clip.totalVotes}
                </span>
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
