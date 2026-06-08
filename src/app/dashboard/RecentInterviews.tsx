"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Star, Loader2, Calendar } from "lucide-react";
import { ROLE_COLORS } from "@/lib/constants";

interface InterviewNote {
  id: string;
  date: string;
  interviewer: string | null;
  impression: string | null;
  verdict: string | null;
  rating: number | null;
  player: {
    id: string;
    pseudo: string;
    role: string;
    photoUrl: string | null;
  };
}

const verdictColors: Record<string, string> = {
  recommend: "text-green-400",
  monitor: "text-blue-400",
  reject: "text-red-400",
};

export default function RecentInterviews() {
  const [notes, setNotes] = useState<InterviewNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecent();
  }, []);

  async function fetchRecent() {
    try {
      const res = await fetch("/api/interview-notes/recent");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setNotes(data.notes || []);
    } catch {
      // Silently fail
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

  if (notes.length === 0) {
    return (
      <div className="text-center py-6">
        <MessageSquare className="w-8 h-8 mx-auto text-text-muted mb-2" />
        <p className="text-xs text-text-body">No interviews yet</p>
        <p className="text-xs text-text-muted mt-0.5">
          Interview notes will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {notes.slice(0, 5).map((note) => (
        <Link
          key={note.id}
          href={`/players/${note.player.id}`}
          className="block px-4 py-3 hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-heading">
                {note.player.pseudo}
              </span>
              {note.player.role && (
                <Badge
                  variant="secondary"
                  className={`text-[10px] h-3.5 px-0.5 ${ROLE_COLORS[note.player.role] || ""}`}
                >
                  {note.player.role}
                </Badge>
              )}
            </div>
            {note.rating && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-text-heading">{note.rating}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-text-muted">
              <Calendar className="w-3 h-3" />
              {new Date(note.date).toLocaleDateString()}
            </span>
            {note.verdict && (
              <span className={`text-[10px] font-medium ${verdictColors[note.verdict] || "text-text-muted"}`}>
                {note.verdict.charAt(0).toUpperCase() + note.verdict.slice(1)}
              </span>
            )}
            {note.interviewer && (
              <span className="text-[10px] text-text-muted">by {note.interviewer}</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
