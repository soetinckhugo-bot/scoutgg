"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface RatingData {
  ratings: Array<{
    id: string;
    userId: string;
    mechanics: number;
    macro: number;
    attitude: number;
    potential: number;
    notes: string | null;
  }>;
  count: number;
  average: {
    mechanics: number;
    macro: number;
    attitude: number;
    potential: number;
    overall: number;
  } | null;
}

const ATTRIBUTES = [
  { key: "mechanics", label: "Mechanics" },
  { key: "macro", label: "Macro" },
  { key: "attitude", label: "Attitude" },
  { key: "potential", label: "Potential" },
] as const;

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-colors"
        >
          <Star
            className={`h-5 w-5 ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-[#E9ECEF] dark:text-gray-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= value
              ? "fill-amber-400 text-amber-400"
              : "text-[#E9ECEF] dark:text-gray-600"
          }`}
        />
      ))}
    </div>
  );
}

export default function PlayerRatings({ playerId }: { playerId: string }) {
  const [data, setData] = useState<RatingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [myRating, setMyRating] = useState({
    mechanics: 0,
    macro: 0,
    attitude: 0,
    potential: 0,
    notes: "",
  });

  useEffect(() => {
    fetchRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  async function fetchRatings() {
    try {
      const res = await fetch(`/api/players/${playerId}/ratings`);
      if (!res.ok) throw new Error("Failed");
      const d = await res.json();
      setData(d);
      // If user has a rating, populate it
      const mine = d.ratings[0];
      if (mine) {
        setMyRating({
          mechanics: mine.mechanics,
          macro: mine.macro,
          attitude: mine.attitude,
          potential: mine.potential,
          notes: mine.notes || "",
        });
      }
    } catch {
      toast.error("Failed to load ratings");
    } finally {
      setLoading(false);
    }
  }

  async function saveRating() {
    setSaving(true);
    try {
      const res = await fetch(`/api/players/${playerId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(myRating),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchRatings();
      setEditing(false);
      toast.success("Rating saved");
    } catch {
      toast.error("Failed to save rating");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#E94560]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Average Rating */}
      {data?.average && (
        <Card className="border-[#E9ECEF] dark:border-gray-700 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-[#0f172a]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-[#1A1A2E] dark:text-white">
                  {data.average.overall.toFixed(1)}
                  <span className="text-lg text-[#6C757D] dark:text-gray-400 font-normal">
                    /5
                  </span>
                </div>
                <div className="text-xs text-[#6C757D] dark:text-gray-400 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {data.count} rating{data.count !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-right space-y-1">
                {ATTRIBUTES.map((attr) => (
                  <div key={attr.key} className="flex items-center gap-2">
                    <span className="text-xs text-[#6C757D] dark:text-gray-400 w-16 text-right">
                      {attr.label}
                    </span>
                    <StarDisplay
                      value={
                        data.average?.[attr.key as keyof typeof data.average] || 0
                      }
                    />
                    <span className="text-xs font-medium text-[#1A1A2E] dark:text-white w-6">
                      {data.average?.[attr.key as keyof typeof data.average]?.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Rating */}
      <Card className="border-[#E9ECEF] dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">My Rating</CardTitle>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="h-8 text-xs"
              >
                {data?.ratings[0] ? "Edit" : "Rate"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              {ATTRIBUTES.map((attr) => (
                <div
                  key={attr.key}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-[#1A1A2E] dark:text-white">
                    {attr.label}
                  </span>
                  <StarInput
                    value={myRating[attr.key as keyof typeof myRating] as number}
                    onChange={(v) =>
                      setMyRating((prev) => ({ ...prev, [attr.key]: v }))
                    }
                  />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <Textarea
                  value={myRating.notes}
                  onChange={(e) =>
                    setMyRating((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Why this rating?"
                  rows={2}
                  maxLength={500}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={saveRating}
                  disabled={saving}
                  className="bg-[#1A1A2E] text-white hover:bg-[#16213E]"
                >
                  {saving ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : data?.ratings[0] ? (
            <div className="space-y-2">
              {ATTRIBUTES.map((attr) => (
                <div
                  key={attr.key}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-[#6C757D] dark:text-gray-400">
                    {attr.label}
                  </span>
                  <StarDisplay
                    value={
                      data.ratings[0][
                        attr.key as keyof (typeof data.ratings)[0]
                      ] as number
                    }
                  />
                </div>
              ))}
              {data.ratings[0].notes && (
                <p className="text-sm text-[#6C757D] dark:text-gray-400 mt-2 italic">
                  &ldquo;{data.ratings[0].notes}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Star className="h-8 w-8 text-[#E9ECEF] dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-[#6C757D] dark:text-gray-400">
                You haven&apos;t rated this player yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
