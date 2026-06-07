"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: string;
  progress: number;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  abandoned: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function PlayerDevelopmentPlans({ playerId }: { playerId: string }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  async function fetchPlans() {
    try {
      const res = await fetch(`/api/development-plans?playerId=${playerId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch {
      toast.error("Failed to load development plans");
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

  if (plans.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="w-10 h-10 mx-auto text-text-muted mb-3" />
        <p className="text-sm text-text-body">No development plans yet</p>
        <p className="text-xs text-text-muted mt-1">
          Create a plan to track this player&apos;s growth objectives
        </p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <Link href="/dashboard/development/new">Create Plan</Link>
        </Button>
      </div>
    );
  }

  const activePlans = plans.filter((p) => p.status === "active");
  const completedPlans = plans.filter((p) => p.status === "completed");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary-accent" />
          <span className="text-sm font-medium text-text-heading">Development Plans</span>
          <Badge variant="outline" className="text-xs h-5">
            {activePlans.length} active
          </Badge>
          {completedPlans.length > 0 && (
            <Badge variant="outline" className="text-xs h-5 bg-green-500/10 text-green-400">
              {completedPlans.length} done
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="border-border bg-surface-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-text-heading">{plan.title}</h4>
                <Badge
                  variant="outline"
                  className={`text-[10px] h-4 px-1.5 ${STATUS_COLORS[plan.status] || ""}`}
                >
                  {plan.status}
                </Badge>
              </div>
              {plan.description && (
                <p className="text-xs text-text-body mb-2">{plan.description}</p>
              )}
              <div className="flex items-center gap-3 mb-2">
                {plan.targetDate && (
                  <span className="flex items-center gap-1 text-[10px] text-text-muted">
                    <Calendar className="w-3 h-3" />
                    {new Date(plan.targetDate).toLocaleDateString()}
                  </span>
                )}
                <span className="text-[10px] text-text-muted">
                  {new Date(plan.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={plan.progress} className="h-1.5 flex-1" />
                <span className="text-xs font-bold text-text-heading w-8 text-right">
                  {plan.progress}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full" asChild>
        <Link href="/dashboard/development/new">
          <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
          Add Plan
        </Link>
      </Button>
    </div>
  );
}
