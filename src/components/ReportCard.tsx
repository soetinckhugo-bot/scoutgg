"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Star } from "lucide-react";
import ScoutIcon from "./ScoutIcon";

interface Player {
  id: string;
  pseudo: string;
}

interface Report {
  id: string;
  playerId: string;
  title: string;
  content: string;
  strengths: string;
  weaknesses: string;
  verdict: string;
  author: string;
  isPremium: boolean;
  publishedAt: Date;
  player?: Player;
}

interface ReportCardProps {
  report: Report;
  variant?: "free" | "premium" | "preview";
}

export default function ReportCard({
  report,
  variant = "free",
}: ReportCardProps) {
  const playerName = report.player?.pseudo;

  // Locked preview for non-premium users
  if (variant === "preview") {
    return (
      <Card className="border-border relative overflow-hidden">
        <CardContent className="p-4">
          <div className="absolute inset-0 bg-card/80 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <ScoutIcon icon={Lock} size="xl" variant="default" />
              <p className="text-sm font-medium text-text-heading">
                {report.title}
              </p>
              {playerName && (
                <p className="text-xs text-text-body mb-1">{playerName}</p>
              )}
              <p className="text-xs text-text-body mb-3">Premium content</p>
              <Link
                href="/pricing"
                className="inline-flex items-center px-3 py-1.5 bg-primary-accent text-text-heading text-sm rounded-md hover:bg-primary-accent/90"
              >
                Unlock with Scout Pass
              </Link>
            </div>
          </div>
          <div className="opacity-20">
            <h3 className="font-semibold">{report.title}</h3>
            <p className="text-sm text-text-body">
              {report.content.slice(0, 200)}...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full content for free reports OR premium users viewing premium reports
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {report.isPremium ? (
            <ScoutIcon icon={Lock} size="md" variant="accent" />
          ) : (
            <ScoutIcon icon={Star} size="md" variant="success" />
          )}
          <h4 className="font-semibold text-text-heading">{report.title}</h4>
          <Badge
            variant="outline"
            className={report.isPremium ? "border-primary-accent text-primary-accent" : "border-success text-success"}
          >
            {report.verdict}
          </Badge>
        </div>
        <p className="text-sm text-text-body leading-relaxed whitespace-pre-line">
          {report.content}
        </p>
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap gap-2 mb-2">
            {(report.strengths || "").split(",").filter(Boolean).map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="bg-green-100 text-green-800 bg-emerald-500/30 text-emerald-400"
              >
                + {s.trim()}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(report.weaknesses || "").split(",").filter(Boolean).map((w) => (
              <Badge
                key={w}
                variant="secondary"
                className="bg-red-100 text-red-800 bg-primary-accent/30 text-primary-accent"
              >
                - {w.trim()}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-xs text-text-body mt-3">
          by {report.author} • {new Date(report.publishedAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

