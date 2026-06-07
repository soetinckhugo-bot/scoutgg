"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Loader2, Calendar } from "lucide-react";
import { ROLE_COLORS } from "@/lib/constants";

interface Plan {
  id: string;
  title: string;
  targetDate: string | null;
  progress: number;
  player: {
    id: string;
    pseudo: string;
    role: string;
    photoUrl: string | null;
  };
}

export default function ActiveDevelopmentPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const res = await fetch("/api/development-plans/recent");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-6">
        <Target className="w-8 h-8 mx-auto text-text-muted mb-2" />
        <p className="text-xs text-text-body">No active plans</p>
        <p className="text-xs text-text-muted mt-0.5">
          Create development plans for your players
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {plans.slice(0, 5).map((plan) => (
        <Link
          key={plan.id}
          href={`/players/${plan.player.id}`}
          className="block px-4 py-3 hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-heading truncate max-w-[120px]">
                {plan.player.pseudo}
              </span>
              {plan.player.role && (
                <Badge
                  variant="secondary"
                  className={`text-[10px] h-3.5 px-0.5 ${ROLE_COLORS[plan.player.role] || ""}`}
                >
                  {plan.player.role}
                </Badge>
              )}
            </div>
            {plan.targetDate && (
              <span className="flex items-center gap-1 text-[10px] text-text-muted">
                <Calendar className="w-3 h-3" />
                {new Date(plan.targetDate).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-xs text-text-body mb-1.5 line-clamp-1">{plan.title}</p>
          <div className="flex items-center gap-2">
            <Progress value={plan.progress} className="h-1.5 flex-1" />
            <span className="text-[10px] font-bold text-text-heading w-6 text-right">
              {plan.progress}%
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
