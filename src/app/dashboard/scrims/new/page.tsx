"use client";

import { useState } from "react";
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
import { ArrowLeft, Save, Trophy, XCircle, Minus } from "lucide-react";
import { toast } from "sonner";

export default function NewScrimPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    opponent: "",
    result: "WIN" as "WIN" | "LOSS" | "DRAW",
    compAlly: "",
    compEnemy: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.opponent.trim()) {
      toast.error("Opponent is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/scrims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: new Date(form.date).toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Scrim logged");
      router.push("/dashboard/scrims");
    } catch {
      toast.error("Failed to create scrim");
    } finally {
      setSaving(false);
    }
  }

  const resultIcon: Record<string, React.ReactNode> = {
    WIN: <Trophy className="w-4 h-4 text-green-500" />,
    LOSS: <XCircle className="w-4 h-4 text-red-500" />,
    DRAW: <Minus className="w-4 h-4 text-yellow-500" />,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/scrims">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Scrims
        </Link>
      </Button>

      <Card className="border-border bg-surface-hover">
        <CardHeader>
          <CardTitle className="text-text-heading">Log New Scrim</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="bg-card border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="result">Result</Label>
                <Select
                  value={form.result}
                  onValueChange={(v) => setForm({ ...form, result: v as "WIN" | "LOSS" | "DRAW" })}
                >
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WIN">
                      <span className="flex items-center gap-2">
                        {resultIcon.WIN} Win
                      </span>
                    </SelectItem>
                    <SelectItem value="LOSS">
                      <span className="flex items-center gap-2">
                        {resultIcon.LOSS} Loss
                      </span>
                    </SelectItem>
                    <SelectItem value="DRAW">
                      <span className="flex items-center gap-2">
                        {resultIcon.DRAW} Draw
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opponent">Opponent</Label>
              <Input
                id="opponent"
                placeholder="Team name..."
                value={form.opponent}
                onChange={(e) => setForm({ ...form, opponent: e.target.value })}
                required
                className="bg-card border-border"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="compAlly">Your Composition</Label>
                <Input
                  id="compAlly"
                  placeholder="e.g. Renekton, Lee Sin, Azir..."
                  value={form.compAlly}
                  onChange={(e) => setForm({ ...form, compAlly: e.target.value })}
                  className="bg-card border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compEnemy">Enemy Composition</Label>
                <Input
                  id="compEnemy"
                  placeholder="e.g. Ornn, Sejuani, Viktor..."
                  value={form.compEnemy}
                  onChange={(e) => setForm({ ...form, compEnemy: e.target.value })}
                  className="bg-card border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Draft strategy, early game issues, shotcalling, team fights..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={5}
                className="bg-card border-border"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/scrims">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary-accent hover:bg-primary-accent/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Scrim"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
