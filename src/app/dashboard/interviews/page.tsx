"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, MessageSquare, Star, Calendar, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ROLE_COLORS } from "@/lib/constants";

interface InterviewNote {
  id: string;
  playerId: string;
  date: string;
  interviewer: string | null;
  notes: string | null;
  impression: string | null;
  verdict: string | null;
  rating: number | null;
  createdAt: string;
  player: {
    id: string;
    pseudo: string;
    role: string;
    photoUrl: string | null;
  };
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

export default function InterviewsPage() {
  const [notes, setNotes] = useState<InterviewNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      const res = await fetch("/api/interview-notes");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setNotes(data.notes || []);
    } catch {
      toast.error("Failed to load interview notes");
    } finally {
      setLoading(false);
    }
  }

  const filtered = notes.filter((n) =>
    n.player.pseudo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Interview Notes</h1>
          <p className="text-sm text-text-muted mt-1">
            Track recruitment interviews and candidate evaluations
          </p>
        </div>
        <Button asChild className="bg-primary-accent hover:bg-primary-accent/90">
          <Link href="/dashboard/interviews/new">
            <Plus className="w-4 h-4 mr-2" />
            New Interview
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
            <MessageSquare className="w-12 h-12 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-heading mb-1">No interviews yet</h3>
            <p className="text-sm text-text-muted mb-4">
              Log interviews to track candidate evaluations
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/interviews/new">Log first interview</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((note) => (
            <Card
              key={note.id}
              className="border-border bg-surface-hover hover:border-border-hover transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary-accent/15 flex items-center justify-center text-primary-accent font-bold text-sm">
                      {note.player.pseudo[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-text-heading">{note.player.pseudo}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-4 px-1 ${ROLE_COLORS[note.player.role] || ""}`}
                        >
                          {note.player.role}
                        </Badge>
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(note.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {note.impression && impressionConfig[note.impression] && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${impressionConfig[note.impression].color}`}
                        >
                          {impressionConfig[note.impression].label}
                        </Badge>
                      )}
                      {note.verdict && verdictConfig[note.verdict] && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${verdictConfig[note.verdict].color}`}
                        >
                          {verdictConfig[note.verdict].label}
                        </Badge>
                      )}
                      {note.interviewer && (
                        <span className="text-xs text-text-muted">
                          by {note.interviewer}
                        </span>
                      )}
                    </div>
                    {note.notes && (
                      <p className="text-xs text-text-body line-clamp-2">{note.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {note.rating && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold text-text-heading">{note.rating}</span>
                        <span className="text-xs text-text-muted">/5</span>
                      </div>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/players/${note.playerId}`}>
                        Profile
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
