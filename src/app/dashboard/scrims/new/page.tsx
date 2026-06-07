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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Trophy, XCircle, Minus } from "lucide-react";
import { toast } from "sonner";
import { ROLE_COLORS, ROLES } from "@/lib/constants";

const ROLE_LABELS: Record<string, string> = {
  TOP: "TOP",
  JUNGLE: "JGL",
  MID: "MID",
  ADC: "ADC",
  SUPPORT: "SUP",
};

type FormData = {
  date: string;
  opponent: string;
  result: "WIN" | "LOSS" | "DRAW";
  allyTop: string;
  allyJungle: string;
  allyMid: string;
  allyAdc: string;
  allySupport: string;
  enemyTop: string;
  enemyJungle: string;
  enemyMid: string;
  enemyAdc: string;
  enemySupport: string;
  notes: string;
};

export default function NewScrimPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    date: new Date().toISOString().split("T")[0],
    opponent: "",
    result: "WIN",
    allyTop: "",
    allyJungle: "",
    allyMid: "",
    allyAdc: "",
    allySupport: "",
    enemyTop: "",
    enemyJungle: "",
    enemyMid: "",
    enemyAdc: "",
    enemySupport: "",
    notes: "",
  });

  function setField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

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
    <div className="max-w-3xl mx-auto space-y-6">
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date + Result + Opponent */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                  required
                  className="bg-card border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="result">Result</Label>
                <Select
                  value={form.result}
                  onValueChange={(v) => setField("result", v as "WIN" | "LOSS" | "DRAW")}
                >
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WIN">
                      <span className="flex items-center gap-2">{resultIcon.WIN} Win</span>
                    </SelectItem>
                    <SelectItem value="LOSS">
                      <span className="flex items-center gap-2">{resultIcon.LOSS} Loss</span>
                    </SelectItem>
                    <SelectItem value="DRAW">
                      <span className="flex items-center gap-2">{resultIcon.DRAW} Draw</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="opponent">Opponent</Label>
                <Input
                  id="opponent"
                  placeholder="Team name..."
                  value={form.opponent}
                  onChange={(e) => setField("opponent", e.target.value)}
                  required
                  className="bg-card border-border"
                />
              </div>
            </div>

            {/* Your Team Composition */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-text-heading">Your Team Composition</Label>
              <div className="grid grid-cols-5 gap-2">
                {ROLES.map((role) => (
                  <div key={`ally-${role}`} className="space-y-1.5">
                    <Badge
                      variant="outline"
                      className={`w-full justify-center text-[10px] font-bold tracking-wider ${ROLE_COLORS[role]}`}
                    >
                      {ROLE_LABELS[role]}
                    </Badge>
                    <Input
                      placeholder="Champ"
                      value={form[`ally${role}` as keyof FormData]}
                      onChange={(e) => setField(`ally${role}` as keyof FormData, e.target.value)}
                      className="bg-card border-border text-xs text-center"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Enemy Team Composition */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-text-heading">Enemy Team Composition</Label>
              <div className="grid grid-cols-5 gap-2">
                {ROLES.map((role) => (
                  <div key={`enemy-${role}`} className="space-y-1.5">
                    <Badge
                      variant="outline"
                      className={`w-full justify-center text-[10px] font-bold tracking-wider ${ROLE_COLORS[role]}`}
                    >
                      {ROLE_LABELS[role]}
                    </Badge>
                    <Input
                      placeholder="Champ"
                      value={form[`enemy${role}` as keyof FormData]}
                      onChange={(e) => setField(`enemy${role}` as keyof FormData, e.target.value)}
                      className="bg-card border-border text-xs text-center"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Draft strategy, early game issues, shotcalling, team fights..."
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                rows={4}
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
