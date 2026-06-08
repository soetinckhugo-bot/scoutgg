"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star, Calendar, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface InterviewNote {
  id: string;
  date: string;
  interviewer: string | null;
  notes: string | null;
  impression: string | null;
  verdict: string | null;
  rating: number | null;
}

const impressionConfig: Record<string, { label: string; color: string }> = {
  positive: { label: "Positive", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  neutral: { label: "Neutral", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  negative: { label: "Negative", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const verdictConfig: Record<string, { label: string; color: string }> = {
  recommend: { label: "Recommend", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  monitor: { label: "Monitor", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  reject: { label: "Reject", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function PlayerInterviewNotes({ playerId }: { playerId: string }) {
  const [notes, setNotes] = useState<InterviewNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  async function fetchNotes() {
    try {
      const res = await fetch(`/api/interview-notes?playerId=${playerId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setNotes(data.notes || []);
    } catch {
      toast.error("Failed to load interview notes");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-10 h-10 mx-auto text-text-muted mb-3" />
        <p className="text-sm text-text-body">No interview notes yet</p>
        <p className="text-xs text-text-muted mt-1">
          Log an interview to track candidate evaluation
        </p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <Link href="/dashboard/interviews/new">Log Interview</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary-accent" />
          <span className="text-sm font-medium text-text-heading">Interview Notes</span>
          <Badge variant="outline" className="text-xs h-5">
            {notes.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id} className="border-border bg-surface-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(note.date).toLocaleDateString()}
                  </span>
                  {note.interviewer && (
                    <span className="text-xs text-text-muted">by {note.interviewer}</span>
                  )}
                </div>
                {note.rating && (
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-text-heading">{note.rating}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                {note.impression && impressionConfig[note.impression] && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-4 px-1.5 ${impressionConfig[note.impression].color}`}
                  >
                    {impressionConfig[note.impression].label}
                  </Badge>
                )}
                {note.verdict && verdictConfig[note.verdict] && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-4 px-1.5 ${verdictConfig[note.verdict].color}`}
                  >
                    {verdictConfig[note.verdict].label}
                  </Badge>
                )}
              </div>
              {note.notes && (
                <p className="text-xs text-text-body bg-card rounded p-2 border border-border/50">
                  {note.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full" asChild>
        <Link href="/dashboard/interviews/new">
          <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
          Add Interview Note
        </Link>
      </Button>
    </div>
  );
}
