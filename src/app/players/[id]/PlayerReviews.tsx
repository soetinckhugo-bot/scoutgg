"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, Calendar, Loader2, TrendingUp, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  week: number;
  year: number;
  mechanics: number;
  macro: number;
  attitude: number;
  communication: number;
  notes: string | null;
  goals: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

const CRITERIA = [
  { key: "mechanics", label: "Mechanics", color: "text-blue-400" },
  { key: "macro", label: "Macro", color: "text-violet-400" },
  { key: "attitude", label: "Attitude", color: "text-emerald-400" },
  { key: "communication", label: "Communication", color: "text-amber-400" },
];

export default function PlayerReviews({ playerId }: { playerId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  async function fetchReviews() {
    try {
      const res = await fetch(`/api/player-reviews?playerId=${playerId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      toast.error("Failed to load reviews");
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-10 h-10 mx-auto text-text-muted mb-3" />
        <p className="text-sm text-text-body">No weekly reviews yet</p>
        <p className="text-xs text-text-muted mt-1">
          Create a review to track this player&apos;s development
        </p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <Link href={`/dashboard/reviews/new`}>Create Review</Link>
        </Button>
      </div>
    );
  }

  const latest = reviews[0];
  const latestAvg =
    Math.round(((latest.mechanics + latest.macro + latest.attitude + latest.communication) / 4) * 10) /
    10;

  return (
    <div className="space-y-4">
      {/* Header with avg */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-text-heading">Weekly Reviews</span>
          <Badge variant="outline" className="text-xs h-5">
            {reviews.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Latest avg</span>
          <span className={`text-lg font-bold ${scoreColor(latestAvg)}`}>{latestAvg}</span>
          <span className="text-xs text-text-muted">/5</span>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {reviews.map((review) => {
          const avg =
            Math.round(
              ((review.mechanics + review.macro + review.attitude + review.communication) / 4) * 10
            ) / 10;

          return (
            <Card key={review.id} className="border-border bg-surface-hover">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-xs text-text-muted">
                      Week {review.week}, {review.year}
                    </span>
                    <span className="text-xs text-text-muted">·</span>
                    <span className="text-xs text-text-muted">
                      by {review.user.name || review.user.email}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${scoreColor(avg)}`}>{avg}/5</span>
                </div>

                {/* Criteria bars */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {CRITERIA.map((c) => {
                    const score = review[c.key as keyof Review] as number;
                    return (
                      <div key={c.key} className="text-center">
                        <div className="text-[10px] text-text-muted mb-1">{c.label}</div>
                        <div className={`text-sm font-bold ${c.color}`}>{score}</div>
                        <Progress value={(score / 5) * 100} className="h-1 mt-1" />
                      </div>
                    );
                  })}
                </div>

                {review.notes && (
                  <p className="text-xs text-text-body mt-2 bg-card rounded p-2 border border-border/50">
                    {review.notes}
                  </p>
                )}
                {review.goals && (
                  <div className="mt-2">
                    <span className="text-[10px] font-medium text-primary-accent uppercase tracking-wider">
                      Goals
                    </span>
                    <p className="text-xs text-text-body mt-0.5">{review.goals}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button variant="outline" size="sm" className="w-full" asChild>
        <Link href="/dashboard/reviews/new">
          <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
          Add Review
        </Link>
      </Button>
    </div>
  );
}
