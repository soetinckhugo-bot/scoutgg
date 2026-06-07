"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Trophy, XCircle, Minus, Loader2, BarChart3 } from "lucide-react";

interface DigestSummary {
  summary: {
    total: number;
    wins: number;
    losses: number;
    draws: number;
    winrate: number;
  };
  weeklyTrend: Array<{
    label: string;
    wins: number;
    losses: number;
    draws: number;
  }>;
}

export default function ScrimDigestWidget() {
  const [data, setData] = useState<DigestSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDigest();
  }, []);

  async function fetchDigest() {
    try {
      const res = await fetch("/api/scrims/digest");
      if (!res.ok) throw new Error("Failed");
      const digest = await res.json();
      setData(digest);
    } catch {
      // Silently fail — widget is non-critical
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!data || data.summary.total === 0) {
    return (
      <div className="text-center py-6">
        <BarChart3 className="w-8 h-8 mx-auto text-text-muted mb-2" />
        <p className="text-xs text-text-body">No scrim data yet</p>
        <p className="text-xs text-text-muted mt-0.5">
          Log scrims to see your analytics here
        </p>
      </div>
    );
  }

  const { summary, weeklyTrend } = data;
  const currentWeek = weeklyTrend[weeklyTrend.length - 1];

  return (
    <div className="space-y-3">
      {/* Mini summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card rounded-lg p-2.5 text-center border border-border">
          <div className="text-lg font-bold text-text-heading">{summary.winrate}%</div>
          <div className="text-[10px] text-text-muted">Winrate</div>
        </div>
        <div className="bg-card rounded-lg p-2.5 text-center border border-border">
          <div className="text-lg font-bold text-green-500">{summary.wins}</div>
          <div className="text-[10px] text-text-muted">Wins</div>
        </div>
        <div className="bg-card rounded-lg p-2.5 text-center border border-border">
          <div className="text-lg font-bold text-red-500">{summary.losses}</div>
          <div className="text-[10px] text-text-muted">Losses</div>
        </div>
      </div>

      {/* This week */}
      {currentWeek && currentWeek.wins + currentWeek.losses + currentWeek.draws > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">This week</span>
            <span className="text-xs font-medium text-text-heading">
              {currentWeek.wins + currentWeek.losses + currentWeek.draws} games
            </span>
          </div>
          <div className="flex items-center gap-1.5 h-2">
            {currentWeek.wins > 0 && (
              <div
                className="h-full bg-green-500 rounded-full"
                style={{
                  width: `${(currentWeek.wins / (currentWeek.wins + currentWeek.losses + currentWeek.draws)) * 100}%`,
                }}
              />
            )}
            {currentWeek.draws > 0 && (
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{
                  width: `${(currentWeek.draws / (currentWeek.wins + currentWeek.losses + currentWeek.draws)) * 100}%`,
                }}
              />
            )}
            {currentWeek.losses > 0 && (
              <div
                className="h-full bg-red-500 rounded-full"
                style={{
                  width: `${(currentWeek.losses / (currentWeek.wins + currentWeek.losses + currentWeek.draws)) * 100}%`,
                }}
              />
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-green-500">
              <Trophy className="w-3 h-3" /> {currentWeek.wins}
            </span>
            <span className="flex items-center gap-1 text-yellow-500">
              <Minus className="w-3 h-3" /> {currentWeek.draws}
            </span>
            <span className="flex items-center gap-1 text-red-500">
              <XCircle className="w-3 h-3" /> {currentWeek.losses}
            </span>
          </div>
        </div>
      )}

      {/* View full */}
      <Link
        href="/dashboard/scrims/digest"
        className="block text-center text-xs text-primary-accent hover:text-primary-accent/80 font-medium transition-colors"
      >
        View full analytics →
      </Link>
    </div>
  );
}
