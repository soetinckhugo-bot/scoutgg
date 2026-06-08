"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, MessageSquare, Star } from "lucide-react";
import { toast } from "sonner";
import { ROLE_COLORS } from "@/lib/constants";

interface Player {
  id: string;
  pseudo: string;
  role: string;
  league: string;
  photoUrl: string | null;
}

export default function NewInterviewPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    playerId: "",
    date: new Date().toISOString().split("T")[0],
    interviewer: "",
    notes: "",
    impression: "neutral" as "positive" | "neutral" | "negative",
    verdict: "monitor" as "recommend" | "monitor" | "reject",
    rating: 3,
  });

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    try {
      const res = await fetch("/api/players?limit=200");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPlayers(data.players || []);
    } catch {
      toast.error("Failed to load players");
    } finally {
      setLoadingPlayers(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.playerId) {
      toast.error("Select a player");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/interview-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Interview note saved");
      router.push("/dashboard/interviews");
    } catch {
      toast.error("Failed to save interview note");
    } finally {
      setSaving(false);
    }
  }

  const impressionColors = {
    positive: "bg-green-500/10 text-green-400 border-green-500/20",
    neutral: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    negative: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const verdictColors = {
    recommend: "bg-green-500/10 text-green-400 border-green-500/20",
    monitor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    reject: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/interviews">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Interviews
        </Link>
      </Button>

      <Card className="border-border bg-surface-hover">
        <CardHeader>
          <CardTitle className="text-text-heading flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-accent" />
            Interview Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Player + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Player</Label>
                <Select
                  value={form.playerId}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, playerId: v ?? "" }))}
                  disabled={loadingPlayers}
                >
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue placeholder={loadingPlayers ? "Loading..." : "Select player..."} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {players.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-4 px-1 ${ROLE_COLORS[p.role] || ""}`}
                          >
                            {p.role}
                          </Badge>
                          {p.pseudo}
                          <span className="text-text-muted text-xs">({p.league})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Interview Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                  className="bg-card border-border"
                />
              </div>
            </div>

            {/* Interviewer */}
            <div className="space-y-2">
              <Label htmlFor="interviewer">Interviewer</Label>
              <Input
                id="interviewer"
                placeholder="Name of the interviewer..."
                value={form.interviewer}
                onChange={(e) => setForm((prev) => ({ ...prev, interviewer: e.target.value }))}
                className="bg-card border-border"
              />
            </div>

            {/* Impression + Verdict + Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Impression</Label>
                <Select
                  value={form.impression}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, impression: (v ?? "neutral") as "positive" | "neutral" | "negative" }))
                  }
                >
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">
                      <Badge variant="outline" className={`text-xs ${impressionColors.positive}`}>Positive</Badge>
                    </SelectItem>
                    <SelectItem value="neutral">
                      <Badge variant="outline" className={`text-xs ${impressionColors.neutral}`}>Neutral</Badge>
                    </SelectItem>
                    <SelectItem value="negative">
                      <Badge variant="outline" className={`text-xs ${impressionColors.negative}`}>Negative</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Verdict</Label>
                <Select
                  value={form.verdict}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, verdict: (v ?? "monitor") as "recommend" | "monitor" | "reject" }))
                  }
                >
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommend">
                      <Badge variant="outline" className={`text-xs ${verdictColors.recommend}`}>Recommend</Badge>
                    </SelectItem>
                    <SelectItem value="monitor">
                      <Badge variant="outline" className={`text-xs ${verdictColors.monitor}`}>Monitor</Badge>
                    </SelectItem>
                    <SelectItem value="reject">
                      <Badge variant="outline" className={`text-xs ${verdictColors.reject}`}>Reject</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Overall Rating</Label>
                <div className="flex items-center gap-1 pt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= form.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-text-muted"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Interview Notes</Label>
              <Textarea
                id="notes"
                placeholder="Key takeaways from the interview..."
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={6}
                className="bg-card border-border"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/interviews">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary-accent hover:bg-primary-accent/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
