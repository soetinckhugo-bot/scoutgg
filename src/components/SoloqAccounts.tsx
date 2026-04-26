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

  function addAccount() {
    if (!newRiotId.includes("#")) {
      toast.error("Please use format: GameName#TagLine");
      return;
    }
    setNewRiotId("");
    setShowAdd(false);
    toast.success("Account added (not persisted yet)");
  }

  const hasData = soloqStats && (soloqStats.currentRank || soloqStats.peakLp > 0);

  return (
    <div className="space-y-3">
      {hasData ? (
        <div className="rounded-lg border border-[#2A2D3A] overflow-hidden">
          <div className="bg-[#1A1F2E] p-3">
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className="text-center min-w-[60px]">
                <div className="text-xs font-bold text-[#E9ECEF] tabular-nums">
                  {soloqStats!.currentRank.split(" ")[0]}
                </div>
                <div className="text-xs text-[#6C757D] tabular-nums">{soloqStats!.peakLp} LP</div>
              </div>

              {/* Account Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#E9ECEF] text-sm truncate">
                    {riotId ? riotId.split("#")[0] : "Main Account"}
                  </span>
                  {riotId && riotId.includes("#") && (
                    <span className="text-xs text-[#6C757D]">#{riotId.split("#")[1]}</span>
                  )}
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                </div>
                <div className="text-xs text-[#6C757D] tabular-nums">
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
        <div className="rounded-lg border border-[#2A2D3A] bg-[#1A1F2E] p-4 text-center">
          <p className="text-sm text-[#6C757D]">No SoloQ stats available.</p>
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
                className="flex-1 bg-[#1A1F2E] border border-[#2A2D3A] rounded px-3 py-2 text-sm text-[#E9ECEF] placeholder-[#6C757D]"
              />
              <button
                onClick={addAccount}
                className="bg-[#E94560] text-white px-3 py-2 rounded text-sm font-medium hover:bg-[#d63d56] transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="text-[#6C757D] hover:text-[#E9ECEF] px-3 py-2 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full border border-[#2A2D3A] text-[#6C757D] hover:text-[#E9ECEF] rounded px-3 py-2 text-sm transition-colors flex items-center justify-center gap-2"
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
