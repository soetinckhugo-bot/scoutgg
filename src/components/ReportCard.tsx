"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Star } from "lucide-react";

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
      <Card className="border-[#E9ECEF] dark:border-gray-700 relative overflow-hidden">
        <CardContent className="p-4">
          <div className="absolute inset-0 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <Lock className="h-8 w-8 text-[#6C757D] dark:text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-[#1A1A2E] dark:text-white">
                {report.title}
              </p>
              {playerName && (
                <p className="text-xs text-[#6C757D] dark:text-gray-400 mb-1">{playerName}</p>
              )}
              <p className="text-xs text-[#6C757D] dark:text-gray-400 mb-3">Premium content</p>
              <Link
                href="/pricing"
                className="inline-flex items-center px-3 py-1.5 bg-[#E94560] text-white text-sm rounded-md hover:bg-[#d63d56]"
              >
                Unlock with Scout Pass
              </Link>
            </div>
          </div>
          <div className="opacity-20">
            <h3 className="font-semibold">{report.title}</h3>
            <p className="text-sm text-[#6C757D] dark:text-gray-400">
              {report.content.slice(0, 200)}...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full content for free reports OR premium users viewing premium reports
  return (
    <Card className="border-[#E9ECEF] dark:border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {report.isPremium ? (
            <Lock className="h-4 w-4 text-[#E94560]" />
          ) : (
            <Star className="h-4 w-4 text-[#28A745]" />
          )}
          <h4 className="font-semibold text-[#1A1A2E] dark:text-white">{report.title}</h4>
          <Badge
            variant="outline"
            className={report.isPremium ? "border-[#E94560] text-[#E94560]" : "border-[#28A745] text-[#28A745]"}
          >
            {report.verdict}
          </Badge>
        </div>
        <p className="text-sm text-[#6C757D] dark:text-gray-400 leading-relaxed whitespace-pre-line">
          {report.content}
        </p>
        <div className="mt-3 pt-3 border-t border-[#E9ECEF] dark:border-gray-700">
          <div className="flex flex-wrap gap-2 mb-2">
            {(report.strengths || "").split(",").filter(Boolean).map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
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
                className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              >
                - {w.trim()}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-3">
          by {report.author} • {new Date(report.publishedAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

