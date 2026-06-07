"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Save, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ROLE_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface Player {
  id: string;
  pseudo: string;
  role: string;
  league: string;
  photoUrl: string | null;
}

const CRITERIA = [
  { key: "mechanics", label: "Mechanics", description: "Individual skill, micro play, execution" },
  { key: "macro", label: "Macro", description: "Map awareness, objective control, rotations" },
  { key: "attitude", label: "Attitude", description: "Mentality, tilt resistance, work ethic" },
  { key: "communication", label: "Communication", description: "Shotcalling, info sharing, team coordination" },
];

export default function NewReviewPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();

  const [form, setForm] = useState({
    playerId: "",
    week: currentWeek,
    year: currentYear,
    mechanics: 3,
    macro: 3,
    attitude: 3,
    communication: 3,
    notes: "",
    goals: "",
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
      const res = await fetch("/api/player-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Review saved");
      router.push("/dashboard/reviews");
    } catch {
      toast.error("Failed to save review");
    } finally {
      setSaving(false);
    }
  }

  function setCriteria(key: string, value: number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const scoreColors: Record<number, string> = {
    0: "text-red-500",
    1: "text-red-400",
    2: "text-orange-400",
    3: "text-yellow-400",
    4: "text-emerald-400",
    5: "text-green-500",
  };

  const avg = Math.round((form.mechanics + form.macro + form.attitude + form.communication) / 4 * 10) / 10;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/reviews">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Reviews
        </Link>
      </Button>

      <Card className="border-border bg-surface-hover">
        <CardHeader>
          <CardTitle className="text-text-heading">Weekly Player Review</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Player + Week */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-2">
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
                <Label>Week {currentYear}</Label>
                <Select
                  value={String(form.week)}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, week: parseInt(v ?? String(currentWeek)) }))}
                >
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 53 }, (_, i) => i + 1).map((w) => (
                      <SelectItem key={w} value={String(w)}>
                        Week {w} {w === currentWeek ? "(current)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Average Score */}
            <div className="flex items-center justify-center gap-2 py-3 bg-card rounded-xl border border-border">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-2xl font-bold text-text-heading">{avg}</span>
              <span className="text-sm text-text-muted">/ 5</span>
            </div>

            {/* Criteria Sliders */}
            <div className="space-y-5">
              {CRITERIA.map((c) => {
                const value = form[c.key as keyof typeof form] as number;
                return (
                  <div key={c.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{c.label}</Label>
                      <span className={`text-sm font-bold ${scoreColors[value]}`}>{value}/5</span>
                    </div>
                    <p className="text-xs text-text-muted">{c.description}</p>
                    <Slider
                      value={[value]}
                      onValueChange={(vals) => setCriteria(c.key, Array.isArray(vals) ? vals[0] : vals)}
                      min={0}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted px-1">
                      <span>0</span>
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Observations, points forts, points à travailler..."
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="bg-card border-border"
              />
            </div>

            {/* Goals */}
            <div className="space-y-2">
              <Label htmlFor="goals">Goals for Next Week</Label>
              <Textarea
                id="goals"
                placeholder="Objectifs à atteindre pour la semaine prochaine..."
                value={form.goals}
                onChange={(e) => setForm((prev) => ({ ...prev, goals: e.target.value }))}
                rows={3}
                className="bg-card border-border"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/reviews">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary-accent hover:bg-primary-accent/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Review"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
}
