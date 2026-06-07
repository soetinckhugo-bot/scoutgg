"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Loader2, TrendingUp } from "lucide-react";
import { ROLE_COLORS } from "@/lib/constants";

interface RecentReview {
  id: string;
  week: number;
  year: number;
  mechanics: number;
  macro: number;
  attitude: number;
  communication: number;
  player: {
    id: string;
    pseudo: string;
    role: string;
    photoUrl: string | null;
  };
}

export default function RecentReviews() {
  const [reviews, setReviews] = useState<RecentReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecent();
  }, []);

  async function fetchRecent() {
    try {
      const res = await fetch("/api/player-reviews/recent");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 4) return "text-green-500";
    if (score >= 3) return "text-yellow-400";
    if (score >= 2) return "text-orange-400";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-6">
        <TrendingUp className="w-8 h-8 mx-auto text-text-muted mb-2" />
        <p className="text-xs text-text-body">No reviews yet</p>
        <p className="text-xs text-text-muted mt-0.5">
          Weekly player reviews will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {reviews.slice(0, 5).map((review) => {
        const avg =
          Math.round(
            ((review.mechanics + review.macro + review.attitude + review.communication) / 4) * 10
          ) / 10;

        return (
          <Link
            key={review.id}
            href={`/players/${review.player.id}`}
            className="block px-4 py-3 hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-heading">
                  {review.player.pseudo}
                </span>
                {review.player.role && (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] h-3.5 px-0.5 ${ROLE_COLORS[review.player.role] || ""}`}
                  >
                    {review.player.role}
                  </Badge>
                )}
              </div>
              <span className={`text-sm font-bold ${scoreColor(avg)}`}>{avg}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Progress value={(avg / 5) * 100} className="h-1.5" />
              </div>
              <span className="text-[10px] text-text-muted shrink-0">
                W{review.week}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
