"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
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
import { ArrowLeft, Save, Trash2, Trophy, XCircle, Minus } from "lucide-react";
import { toast } from "sonner";

interface Scrim {
  id: string;
  date: string;
  opponent: string;
  result: "WIN" | "LOSS" | "DRAW";
  compAlly: string | null;
  compEnemy: string | null;
  notes: string | null;
}

export default function ScrimDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [scrim, setScrim] = useState<Scrim | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Scrim>>({});

  useEffect(() => {
    if (!id) return;
    fetchScrim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchScrim() {
    try {
      const res = await fetch(`/api/scrims/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setScrim(data);
      setForm(data);
    } catch {
      toast.error("Scrim not found");
      router.push("/dashboard/scrims");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/scrims/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Scrim updated");
      router.push("/dashboard/scrims");
    } catch {
      toast.error("Failed to save scrim");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this scrim?")) return;
    try {
      const res = await fetch(`/api/scrims/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Scrim deleted");
      router.push("/dashboard/scrims");
    } catch {
      toast.error("Failed to delete scrim");
    }
  }

  const resultIcon: Record<string, React.ReactNode> = {
    WIN: <Trophy className="w-5 h-5 text-green-500" />,
    LOSS: <XCircle className="w-5 h-5 text-red-500" />,
    DRAW: <Minus className="w-5 h-5 text-yellow-500" />,
  };

  if (loading) {
    return <div className="text-center py-12 text-text-muted">Loading...</div>;
  }

  if (!scrim) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/scrims">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="text-red-500" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>

      <Card className="border-border bg-surface-hover">
        <CardHeader>
          <div className="flex items-center gap-3">
            {resultIcon[form.result || scrim.result]}
            <div>
              <CardTitle className="text-text-heading">{scrim.opponent}</CardTitle>
              <p className="text-sm text-text-muted">
                {new Date(scrim.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date ? form.date.split("T")[0] : ""}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="bg-card border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="result">Result</Label>
              <Select
                value={form.result || scrim.result}
                onValueChange={(v) => setForm({ ...form, result: v as "WIN" | "LOSS" | "DRAW" })}
              >
                <SelectTrigger className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WIN">Win</SelectItem>
                  <SelectItem value="LOSS">Loss</SelectItem>
                  <SelectItem value="DRAW">Draw</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opponent">Opponent</Label>
            <Input
              id="opponent"
              value={form.opponent || ""}
              onChange={(e) => setForm({ ...form, opponent: e.target.value })}
              className="bg-card border-border"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="compAlly">Your Composition</Label>
              <Input
                id="compAlly"
                value={form.compAlly || ""}
                onChange={(e) => setForm({ ...form, compAlly: e.target.value })}
                className="bg-card border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compEnemy">Enemy Composition</Label>
              <Input
                id="compEnemy"
                value={form.compEnemy || ""}
                onChange={(e) => setForm({ ...form, compEnemy: e.target.value })}
                className="bg-card border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes || ""}
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
              onClick={handleSave}
              disabled={saving}
              className="bg-primary-accent hover:bg-primary-accent/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
