"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
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
  // variant is kept for API compatibility but no longer locks content
  void variant;

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ScoutIcon icon={Star} size="md" variant="success" />
          <h4 className="font-semibold text-text-heading">{report.title}</h4>
          <Badge
            variant="outline"
            className="border-success text-success"
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

