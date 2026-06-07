"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Star, Calendar, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ROLE_COLORS } from "@/lib/constants";

interface Review {
  id: string;
  playerId: string;
  week: number;
  year: number;
  mechanics: number;
  macro: number;
  attitude: number;
  communication: number;
  notes: string | null;
  goals: string | null;
  createdAt: string;
  player: {
    id: string;
    pseudo: string;
    role: string;
    photoUrl: string | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

const CRITERIA = [
  { key: "mechanics", label: "MEC", color: "bg-blue-500" },
  { key: "macro", label: "MAC", color: "bg-violet-500" },
  { key: "attitude", label: "ATT", color: "bg-emerald-500" },
  { key: "communication", label: "COM", color: "bg-amber-500" },
];

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    try {
      const res = await fetch("/api/player-reviews");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  const filtered = reviews.filter((r) =>
    r.player.pseudo.toLowerCase().includes(search.toLowerCase())
  );

  // Group by player
  const byPlayer = new Map<string, Review[]>();
  for (const r of filtered) {
    const existing = byPlayer.get(r.playerId) || [];
    existing.push(r);
    byPlayer.set(r.playerId, existing);
  }

  const scoreColor = (score: number) => {
    if (score >= 4) return "text-green-500";
    if (score >= 3) return "text-yellow-400";
    if (score >= 2) return "text-orange-400";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Weekly Reviews</h1>
          <p className="text-sm text-text-muted mt-1">
            Track player development with structured weekly evaluations
          </p>
        </div>
        <Button asChild className="bg-primary-accent hover:bg-primary-accent/90">
          <Link href="/dashboard/reviews/new">
            <Plus className="w-4 h-4 mr-2" />
            New Review
          </Link>
        </Button>
      </div>

      <Card className="border-border bg-surface-hover">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-text-muted">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-border bg-surface-hover">
          <CardContent className="py-12 text-center">
            <Star className="w-12 h-12 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-heading mb-1">No reviews yet</h3>
            <p className="text-sm text-text-muted mb-4">
              Start tracking your players&apos; weekly progress
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/reviews/new">Create first review</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(byPlayer.entries()).map(([playerId, playerReviews]) => {
            const player = playerReviews[0].player;
            const latest = playerReviews[0];
            const avg =
              Math.round(
                ((latest.mechanics + latest.macro + latest.attitude + latest.communication) / 4) *
                  10
              ) / 10;

            return (
              <Card
                key={playerId}
                className="border-border bg-surface-hover hover:border-border-hover transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Player info */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary-accent/15 flex items-center justify-center text-primary-accent font-bold text-sm">
                        {player.pseudo[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text-heading">{player.pseudo}</p>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-4 px-1 ${ROLE_COLORS[player.role] || ""}`}
                          >
                            {player.role}
                          </Badge>
                          <span className="text-xs text-text-muted">
                            {playerReviews.length} review{playerReviews.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Latest review scores */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Week {latest.week}, {latest.year}
                        </span>
                        <span className={`text-sm font-bold ${scoreColor(avg)}`}>{avg}/5</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {CRITERIA.map((c) => {
                          const score = latest[c.key as keyof Review] as number;
                          return (
                            <div key={c.key} className="text-center">
                              <div className="text-[10px] text-text-muted mb-1">{c.label}</div>
                              <div className={`text-sm font-bold ${scoreColor(score)}`}>
                                {score}
                              </div>
                              <Progress
                                value={(score / 5) * 100}
                                className="h-1 mt-1"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/players/${playerId}?tab=staff`)}
                      >
                        Profile
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* Previous reviews mini list */}
                  {playerReviews.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-text-muted mb-2">Previous reviews</p>
                      <div className="flex items-center gap-3 overflow-x-auto pb-1">
                        {playerReviews.slice(1, 5).map((r) => {
                          const prevAvg =
                            Math.round(
                              ((r.mechanics + r.macro + r.attitude + r.communication) / 4) * 10
                            ) / 10;
                          return (
                            <div
                              key={r.id}
                              className="shrink-0 text-center px-2 py-1.5 bg-card rounded border border-border"
                            >
                              <div className="text-[10px] text-text-muted">
                                W{r.week}
                              </div>
                              <div className={`text-sm font-bold ${scoreColor(prevAvg)}`}>
                                {prevAvg}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
