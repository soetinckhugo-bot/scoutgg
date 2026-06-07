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
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Target, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ROLE_COLORS } from "@/lib/constants";

interface Player {
  id: string;
  pseudo: string;
  role: string;
  league: string;
  photoUrl: string | null;
}

export default function NewDevelopmentPlanPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    playerId: "",
    title: "",
    description: "",
    targetDate: "",
    progress: 0,
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
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/development-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Development plan created");
      router.push("/dashboard/development");
    } catch {
      toast.error("Failed to create plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/development">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Development
        </Link>
      </Button>

      <Card className="border-border bg-surface-hover">
        <CardHeader>
          <CardTitle className="text-text-heading flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-accent" />
            New Development Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Player */}
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

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Objective Title</Label>
              <Input
                id="title"
                placeholder="e.g. Improve vision score to 80+"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
                className="bg-card border-border"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="How will we achieve this? What resources are needed?"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="bg-card border-border"
              />
            </div>

            {/* Target Date + Initial Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, targetDate: e.target.value }))}
                  className="bg-card border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Initial Progress ({form.progress}%)</Label>
                <Slider
                  value={[form.progress]}
                  onValueChange={(vals) =>
                    setForm((prev) => ({
                      ...prev,
                      progress: Array.isArray(vals) ? vals[0] : vals,
                    }))
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="w-full mt-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/development">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary-accent hover:bg-primary-accent/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Create Plan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
