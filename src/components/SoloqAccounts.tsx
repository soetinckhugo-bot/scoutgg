"use client";

import { useState } from "react";
import { Star, Plus, Zap } from "lucide-react";
import { toast } from "sonner";

interface SoloqStats {
  currentRank: string;
  peakLp: number;
  winrate: number;
  totalGames: number;
}

interface SoloqAccountsProps {
  playerId: string;
  riotId?: string | null;
  soloqStats?: SoloqStats | null;
  isAdmin?: boolean;
}

export default function SoloqAccounts({ playerId, riotId, soloqStats, isAdmin }: SoloqAccountsProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newRiotId, setNewRiotId] = useState("");

  async function syncAccount() {
    toast.success("Syncing account...");
    try {
      const res = await fetch(`/api/riot/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      if (res.ok) {
        toast.success("Account synced! Refreshing...");
        window.location.reload();
      } else {
        toast.error("Sync failed");
      }
    } catch {
      toast.error("Sync failed");
    }
  }

  async function addAccount() {
    if (!newRiotId.includes("#")) {
      toast.error("Please use format: GameName#TagLine");
      return;
    }
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riotId: newRiotId.trim() }),
      });
      if (res.ok) {
        toast.success("Account saved! Syncing from Riot API...");
        setNewRiotId("");
        setShowAdd(false);
        // Auto-sync after saving
        const syncRes = await fetch(`/api/riot/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        });
        if (syncRes.ok) {
          toast.success("Stats synced! Refreshing...");
          window.location.reload();
        } else {
          toast.error("Account saved but sync failed. Click Sync to retry.");
          window.location.reload();
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to save account");
      }
    } catch {
      toast.error("Failed to save account");
    }
  }

  const hasData = soloqStats && (soloqStats.currentRank || soloqStats.peakLp > 0);

  return (
    <div className="space-y-3">
      {hasData ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="bg-surface-elevated p-3">
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className="text-center min-w-[60px]">
                <div className="text-xs font-bold text-text-heading tabular-nums">
                  {soloqStats!.currentRank.split(" ")[0]}
                </div>
                <div className="text-xs text-text-muted tabular-nums">{soloqStats!.peakLp} LP</div>
              </div>

              {/* Account Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-heading text-sm truncate">
                    {riotId ? riotId.split("#")[0] : "Main Account"}
                  </span>
                  {riotId && riotId.includes("#") && (
                    <span className="text-xs text-text-muted">#{riotId.split("#")[1]}</span>
                  )}
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                </div>
                <div className="text-xs text-text-muted tabular-nums">
                  {soloqStats!.totalGames} games • {(soloqStats!.winrate * 100).toFixed(0)}% WR
                </div>
              </div>

              {/* Sync button */}
              <button
                onClick={syncAccount}
                className="text-emerald-400 hover:text-emerald-300 h-7 px-2 rounded hover:bg-emerald-500/10 transition-colors"
                title="Sync stats"
              >
                <Zap className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface-elevated p-4 text-center">
          <p className="text-sm text-text-muted">No SoloQ stats available.</p>
          {riotId && (
            <button
              onClick={syncAccount}
              className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline"
            >
              Sync from Riot API
            </button>
          )}
        </div>
      )}

      {/* Add Account */}
      {isAdmin && (
        <div>
          {showAdd ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="GameName#TagLine"
                value={newRiotId}
                onChange={(e) => setNewRiotId(e.target.value)}
                className="flex-1 bg-surface-elevated border border-border rounded px-3 py-2 text-sm text-text-heading placeholder-[#6C757D]"
              />
              <button
                onClick={addAccount}
                className="bg-primary-accent text-text-heading px-3 py-2 rounded text-sm font-medium hover:bg-primary-accent/90 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="text-text-muted hover:text-text-heading px-3 py-2 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full border border-border text-text-muted hover:text-text-heading rounded px-3 py-2 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Account
            </button>
          )}
        </div>
      )}
    </div>
  );
}
