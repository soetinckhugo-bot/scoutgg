"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Target,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { ROLE_COLORS } from "@/lib/constants";

interface Plan {
  id: string;
  playerId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: string;
  progress: number;
  createdAt: string;
  player: {
    id: string;
    pseudo: string;
    role: string;
    photoUrl: string | null;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: {
    label: "Active",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: <Target className="w-3 h-3" />,
  },
  completed: {
    label: "Completed",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  abandoned: {
    label: "Abandoned",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export default function DevelopmentPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const res = await fetch("/api/development-plans");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch {
      toast.error("Failed to load development plans");
    } finally {
      setLoading(false);
    }
  }

  async function updatePlan(id: string, updates: Partial<Plan>) {
    setUpdating(id);
    try {
      const res = await fetch("/api/development-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setPlans((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
      toast.success("Plan updated");
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setUpdating(null);
    }
  }

  const filtered = plans.filter((p) => {
    const matchesSearch = p.player.pseudo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group by player
  const byPlayer = new Map<string, Plan[]>();
  for (const p of filtered) {
    const existing = byPlayer.get(p.playerId) || [];
    existing.push(p);
    byPlayer.set(p.playerId, existing);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Development Plans</h1>
          <p className="text-sm text-text-muted mt-1">
            Track player growth with structured objectives
          </p>
        </div>
        <Button asChild className="bg-primary-accent hover:bg-primary-accent/90">
          <Link href="/dashboard/development/new">
            <Plus className="w-4 h-4 mr-2" />
            New Plan
          </Link>
        </Button>
      </div>

      <Card className="border-border bg-surface-hover">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Search player..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "ALL")}>
              <SelectTrigger className="w-full sm:w-[160px] bg-card border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
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
            <Target className="w-12 h-12 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-heading mb-1">No plans yet</h3>
            <p className="text-sm text-text-muted mb-4">
              Create development plans to track your players&apos; growth
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/development/new">Create first plan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(byPlayer.entries()).map(([playerId, playerPlans]) => {
            const player = playerPlans[0].player;
            const activePlans = playerPlans.filter((p) => p.status === "active");
            const completedPlans = playerPlans.filter((p) => p.status === "completed");

            return (
              <Card key={playerId} className="border-border bg-surface-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-accent/15 flex items-center justify-center text-primary-accent font-bold text-sm">
                        {player.pseudo[0]?.toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base text-text-heading">{player.pseudo}</CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-4 px-1 ${ROLE_COLORS[player.role] || ""}`}
                          >
                            {player.role}
                          </Badge>
                          <span className="text-xs text-text-muted">
                            {activePlans.length} active · {completedPlans.length} completed
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/players/${playerId}`}>
                        Profile
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {playerPlans.map((plan) => {
                    const status = STATUS_CONFIG[plan.status] || STATUS_CONFIG.active;
                    const isUpdating = updating === plan.id;

                    return (
                      <div
                        key={plan.id}
                        className={`p-4 rounded-lg border border-border/50 bg-card transition-opacity ${
                          isUpdating ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-text-heading">{plan.title}</h4>
                              <Badge
                                variant="outline"
                                className={`text-[10px] h-4 px-1.5 flex items-center gap-1 ${status.color}`}
                              >
                                {status.icon}
                                {status.label}
                              </Badge>
                            </div>
                            {plan.description && (
                              <p className="text-xs text-text-body mb-2">{plan.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-text-muted">
                              {plan.targetDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(plan.targetDate).toLocaleDateString()}
                                </span>
                              )}
                              <span>Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Progress controls */}
                          <div className="w-full sm:w-48 shrink-0 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-text-muted">Progress</span>
                              <span className="text-xs font-bold text-text-heading">
                                {plan.progress}%
                              </span>
                            </div>
                            <Slider
                              value={[plan.progress]}
                              onValueChange={(vals) => {
                                const v = Array.isArray(vals) ? vals[0] : vals;
                                setPlans((prev) =>
                                  prev.map((p) =>
                                    p.id === plan.id ? { ...p, progress: v } : p
                                  )
                                );
                              }}
                              onValueCommitted={(vals) => {
                                const v = Array.isArray(vals) ? vals[0] : vals;
                                updatePlan(plan.id, { progress: v });
                              }}
                              min={0}
                              max={100}
                              step={5}
                              disabled={isUpdating || plan.status !== "active"}
                              className="w-full"
                            />
                            <Select
                              value={plan.status}
                              onValueChange={(v) => updatePlan(plan.id, { status: v ?? undefined })}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="h-7 text-xs bg-surface-hover border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="abandoned">Abandoned</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
