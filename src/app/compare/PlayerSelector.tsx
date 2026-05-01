"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, ArrowRight } from "lucide-react";
import { ROLE_COLORS } from "@/lib/constants";
import Image from "next/image";

interface Player {
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  photoUrl: string | null;
  league: string;
  currentTeam: string | null;
}

export default function PlayerSelector() {
  const router = useRouter();
  const [selected, setSelected] = useState<Player[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  const searchPlayers = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.suggestions || []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchPlayers(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchPlayers]);

  const addPlayer = (player: Player) => {
    if (selected.length >= 2) return;
    if (selected.find((p) => p.id === player.id)) return;
    setSelected((prev) => [...prev, player]);
    setQuery("");
    setResults([]);
  };

  const removePlayer = (id: string) => {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCompare = () => {
    if (selected.length !== 2) return;
    const ids = selected.map((p) => p.id).join(",");
    router.push(`/compare?players=${ids}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-heading mb-2">Compare Players</h1>
        <p className="text-text-muted">Select 2 players to compare them head-to-head</p>
      </div>

      {/* Selected Players */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[0, 1].map((idx) => {
          const player = selected[idx];
          return (
            <div
              key={idx}
              className={`rounded-xl border border-border p-4 text-center ${
                player ? "bg-card" : "bg-background border-dashed"
              }`}
            >
              {player ? (
                <div className="relative">
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-border text-text-muted hover:text-text-heading flex items-center justify-center transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {player.photoUrl ? (
                    <Image
                      src={player.photoUrl}
                      alt={player.pseudo}
                      width={48}
                      height={48}
                      className="rounded-full object-cover mx-auto mb-2"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-text-subtle mx-auto mb-2">
                      {(player.pseudo?.[0] ?? "?").toUpperCase()}
                    </div>
                  )}
                  <h3 className="font-semibold text-text-heading text-sm">{player.pseudo}</h3>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Badge className={`text-xs h-4 px-1 ${ROLE_COLORS[player.role] || ""}`}>
                      {player.role}
                    </Badge>
                    <span className="text-xs text-text-muted">{player.league}</span>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  <div className="w-12 h-12 rounded-full bg-surface-hover border border-border flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg text-text-muted">?</span>
                  </div>
                  <p className="text-sm text-text-muted">Player {idx + 1}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Search */}
      {selected.length < 2 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            type="search"
            placeholder="Search player to add..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 bg-surface-hover border-border text-text-heading placeholder:text-text-muted"
          />
        </div>
      )}

      {/* Results */}
      {results.length > 0 && selected.length < 2 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
          {results
            .filter((r) => !selected.find((s) => s.id === r.id))
            .map((player) => (
              <button
                key={player.id}
                onClick={() => addPlayer(player)}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-surface-hover transition-colors text-left"
              >
                {player.photoUrl ? (
                  <Image
                    src={player.photoUrl}
                    alt={player.pseudo}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-text-subtle">
                    {(player.pseudo?.[0] ?? "?").toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-heading">{player.pseudo}</span>
                    <Badge className={`text-xs h-4 px-1 ${ROLE_COLORS[player.role] || ""}`}>
                      {player.role}
                    </Badge>
                  </div>
                  {player.realName && (
                    <p className="text-xs text-text-muted">{player.realName}</p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted" />
              </button>
            ))}
          {results.filter((r) => !selected.find((s) => s.id === r.id)).length === 0 && (
            <div className="px-4 py-3 text-sm text-text-muted">All results already selected</div>
          )}
        </div>
      )}

      {loading && query.trim().length >= 2 && (
        <div className="text-sm text-text-muted mb-4">Loading...</div>
      )}

      {/* Compare Button */}
      <Button
        onClick={handleCompare}
        disabled={selected.length !== 2}
        className="w-full bg-primary-accent text-text-heading hover:bg-primary-accent/90 disabled:opacity-50"
      >
        Compare
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
