"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Trash2, Edit, Calendar, Trophy, XCircle, Minus } from "lucide-react";
import { toast } from "sonner";

interface Scrim {
  id: string;
  date: string;
  opponent: string;
  result: "WIN" | "LOSS" | "DRAW";
  compAlly: string | null;
  compEnemy: string | null;
  notes: string | null;
  createdAt: string;
}

export default function ScrimsPage() {
  const router = useRouter();
  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchScrims();
  }, []);

  async function fetchScrims() {
    try {
      const res = await fetch("/api/scrims");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setScrims(data.scrims || []);
    } catch {
      toast.error("Failed to load scrims");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this scrim?")) return;
    try {
      const res = await fetch(`/api/scrims/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Scrim deleted");
      setScrims((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to delete scrim");
    }
  }

  const filtered = scrims.filter((s) => {
    const matchesSearch = s.opponent.toLowerCase().includes(search.toLowerCase());
    const matchesResult = resultFilter === "ALL" || s.result === resultFilter;
    return matchesSearch && matchesResult;
  });

  const resultColor: Record<string, string> = {
    WIN: "bg-green-500/10 text-green-500 border-green-500/20",
    LOSS: "bg-red-500/10 text-red-500 border-red-500/20",
    DRAW: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  };

  const resultIcon: Record<string, React.ReactNode> = {
    WIN: <Trophy className="w-3 h-3" />,
    LOSS: <XCircle className="w-3 h-3" />,
    DRAW: <Minus className="w-3 h-3" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Scrim Journal</h1>
          <p className="text-sm text-text-muted mt-1">
            Track your team&apos;s practice matches and performance
          </p>
        </div>
        <Button asChild className="bg-primary-accent hover:bg-primary-accent/90">
          <Link href="/dashboard/scrims/new">
            <Plus className="w-4 h-4 mr-2" />
            New Scrim
          </Link>
        </Button>
      </div>

      <Card className="border-border bg-surface-hover">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Search opponent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card border-border"
              />
            </div>
            <Select value={resultFilter} onValueChange={(v) => setResultFilter(v ?? "ALL")}>
              <SelectTrigger className="w-full sm:w-[160px] bg-card border-border">
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Results</SelectItem>
                <SelectItem value="WIN">Win</SelectItem>
                <SelectItem value="LOSS">Loss</SelectItem>
                <SelectItem value="DRAW">Draw</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-text-muted">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-border bg-surface-hover">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-heading mb-1">No scrims yet</h3>
            <p className="text-sm text-text-muted mb-4">
              Start logging your practice matches to track progress
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/scrims/new">Log your first scrim</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((scrim) => (
            <Card
              key={scrim.id}
              className="border-border bg-surface-hover hover:border-border-hover transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Badge
                      variant="outline"
                      className={`${resultColor[scrim.result]} flex items-center gap-1`}
                    >
                      {resultIcon[scrim.result]}
                      {scrim.result}
                    </Badge>
                    <div>
                      <p className="font-medium text-text-heading">{scrim.opponent}</p>
                      <p className="text-xs text-text-muted">
                        {new Date(scrim.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {scrim.compAlly && (
                    <p className="text-xs text-text-body truncate max-w-[200px]">
                      {scrim.compAlly}
                    </p>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/scrims/${scrim.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-400"
                      onClick={() => handleDelete(scrim.id)}
                    >
                      <Trash2 className="w-4 h-4" />
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
