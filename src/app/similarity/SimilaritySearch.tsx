"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, User, Users, Trophy, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface SimilarityResult {
  player: Player & { tier?: string };
  similarity: number;
  breakdown: Record<string, {
    similarity: number;
    weight: number;
    rawA: number;
    rawB: number;
  }>;
}

type ComparisonScope = "league" | "tier" | "all";

export default function SimilaritySearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [comparisonScope, setComparisonScope] = useState<ComparisonScope>("league");
  const [targetPlayer, setTargetPlayer] = useState<Player | null>(null);
  const [similarityResults, setSimilarityResults] = useState<SimilarityResult[]>([]);
  const [mode, setMode] = useState<"scope" | "player">("scope");
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null);

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

  const handleFindSimilar = async () => {
    if (!selectedPlayer) return;

    try {
      const params = new URLSearchParams();
      params.append("playerId", selectedPlayer.id);
      if (mode === "scope") {
        params.append("scope", comparisonScope);
      } else if (mode === "player" && targetPlayer) {
        params.append("targetPlayerId", targetPlayer.id);
        params.append("scope", "all");
      }

      const res = await fetch(`/api/similarity/v2?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSimilarityResults(data.results || []);
      }
    } catch {
      setSimilarityResults([]);
    }
  };

  const getScopeLabel = (scope: ComparisonScope) => {
    switch (scope) {
      case "league": return "Same League";
      case "tier": return "Same Tier";
      case "all": return "All Players";
    }
  };

  const getScopeIcon = (scope: ComparisonScope) => {
    switch (scope) {
      case "league": return <Trophy className="h-3 w-3" />;
      case "tier": return <Users className="h-3 w-3" />;
      case "all": return <Globe className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Select Source Player */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold text-text-heading mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-text-heading" />
          Step 1: Select Player
        </h2>

        {!selectedPlayer ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              type="search"
              placeholder="Search player..."
              aria-label="Search for a player"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-card border-border text-text-heading placeholder:text-text-muted"
            />
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card overflow-hidden z-50">
                {results.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setSelectedPlayer(player);
                      setQuery("");
                      setResults([]);
                    }}
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
                      <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-xs font-bold text-text-muted">
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
                      <p className="text-xs text-text-muted">{player.league} {player.currentTeam && `• ${player.currentTeam}`}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-muted" />
                  </button>
                ))}
              </div>
            )}
            {loading && query.trim().length >= 2 && (
              <div className="mt-2 text-sm text-text-muted">Loading...</div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
            {selectedPlayer.photoUrl ? (
              <Image
                src={selectedPlayer.photoUrl}
                alt={selectedPlayer.pseudo}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-sm font-bold text-text-muted">
                {(selectedPlayer.pseudo?.[0] ?? "?").toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-heading">{selectedPlayer.pseudo}</span>
                <Badge className={`text-xs h-4 px-1 ${ROLE_COLORS[selectedPlayer.role] || ""}`}>
                  {selectedPlayer.role}
                </Badge>
              </div>
              <p className="text-xs text-text-muted">{selectedPlayer.league} {selectedPlayer.currentTeam && `• ${selectedPlayer.currentTeam}`}</p>
            </div>
            <button
              onClick={() => {
                setSelectedPlayer(null);
                setSimilarityResults([]);
              }}
              className="text-text-muted hover:text-text-heading transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E94560] rounded px-2 py-1"
              aria-label="Change selected player"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Select Target */}
      {selectedPlayer && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold text-text-heading mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-text-heading" />
            Step 2: Compare Against
          </h2>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode("scope")}
              aria-pressed={mode === "scope"}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E94560] ${
                mode === "scope"
                  ? "bg-primary text-text-heading-foreground"
                  : "bg-card text-text-muted hover:text-text-heading"
              }`}
            >
              By Scope
            </button>
            <button
              onClick={() => setMode("player")}
              aria-pressed={mode === "player"}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E94560] ${
                mode === "player"
                  ? "bg-primary text-text-heading-foreground"
                  : "bg-card text-text-muted hover:text-text-heading"
              }`}
            >
              Specific Player
            </button>
          </div>

          {mode === "scope" ? (
            <div className="grid grid-cols-3 gap-2">
              {(["league", "tier", "all"] as ComparisonScope[]).map((scope) => (
                <button
                  key={scope}
                  onClick={() => setComparisonScope(scope)}
                  aria-pressed={comparisonScope === scope}
                  aria-label={`Compare by ${getScopeLabel(scope)}`}
                  className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E94560] ${
                    comparisonScope === scope
                      ? "bg-primary text-text-heading-foreground"
                      : "bg-card text-text-muted hover:bg-surface-hover"
                  }`}
                >
                  {getScopeIcon(scope)}
                  {getScopeLabel(scope)}
                </button>
              ))}
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                type="search"
                placeholder="Search target player..."
                aria-label="Search for a target player to compare"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 bg-card border-border text-text-heading placeholder:text-text-muted"
              />
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card overflow-hidden z-50">
                  {results.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => {
                        setTargetPlayer(player);
                        setQuery("");
                        setResults([]);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-surface-hover transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E94560] rounded-lg"
                      aria-label={`Select target player ${player.pseudo}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-xs font-bold text-text-muted">
                        {(player.pseudo?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-heading">{player.pseudo}</span>
                          <Badge className={`text-xs h-4 px-1 ${ROLE_COLORS[player.role] || ""}`}>
                            {player.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted">{player.league}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {targetPlayer && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-card rounded-lg">
                  <span className="text-sm text-text-heading">{targetPlayer.pseudo}</span>
                  <button
                    onClick={() => setTargetPlayer(null)}
                    className="text-text-muted hover:text-text-heading text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E94560] rounded px-1"
                    aria-label="Remove selected target player"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleFindSimilar}
            className="w-full mt-4 bg-primary text-text-heading-foreground hover:bg-primary/90"
          >
            Find Similar Players
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Results */}
      {similarityResults.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold text-text-heading mb-4">
            Similar Players
            <span className="text-sm font-normal text-text-muted ml-2">
              ({getScopeLabel(comparisonScope)} • {similarityResults.length} results)
            </span>
          </h2>
          <div className="space-y-3">
            {similarityResults.map((result) => (
              <div key={result.player.id}>
                <div
                  className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border hover:border-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => router.push(`/players/${result.player.id}`)}
                  tabIndex={0}
                  role="link"
                  aria-label={`View profile of ${result.player.pseudo}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/players/${result.player.id}`);
                    }
                  }}
                >
                  <div className="relative">
                    {result.player.photoUrl ? (
                      <Image
                        src={result.player.photoUrl}
                        alt={result.player.pseudo}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center text-lg font-bold text-text-muted">
                        {(result.player.pseudo?.[0] ?? "?").toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-heading">{result.player.pseudo}</span>
                      <Badge className={`text-xs h-4 px-1 ${ROLE_COLORS[result.player.role] || ""}`}>
                        {result.player.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted">
                      {result.player.league} {result.player.tier && `• ${result.player.tier}`} {result.player.currentTeam && `• ${result.player.currentTeam}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-text-heading">{result.similarity}%</div>
                    <div className="text-xs text-text-muted">similarity</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedBreakdown(expandedBreakdown === result.player.id ? null : result.player.id);
                    }}
                    aria-pressed={expandedBreakdown === result.player.id}
                    aria-expanded={expandedBreakdown === result.player.id}
                    aria-label={`${expandedBreakdown === result.player.id ? 'Collapse' : 'Expand'} similarity breakdown for ${result.player.pseudo}`}
                    className="p-1 text-text-muted hover:text-text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E94560] rounded"
                  >
                    {expandedBreakdown === result.player.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Breakdown */}
                {expandedBreakdown === result.player.id && result.breakdown && (
                  <div className="mt-2 p-4 bg-card rounded-lg border border-border">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                      Metric Breakdown
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {Object.entries(result.breakdown)
                        .sort((a, b) => b[1].weight - a[1].weight)
                        .map(([metric, data]) => (
                          <div
                            key={metric}
                            className="p-2 rounded bg-card border border-border"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-text-muted font-medium">{metric}</span>
                              <span
                                className={`text-xs font-bold ${
                                  data.similarity >= 80
                                    ? "text-green-500"
                                    : data.similarity >= 50
                                    ? "text-yellow-500"
                                    : "text-red-500"
                                }`}
                              >
                                {data.similarity}%
                              </span>
                            </div>
                            <div className="h-1 bg-card rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${data.similarity}%`,
                                  backgroundColor:
                                    data.similarity >= 80
                                      ? "hsl(var(--chart-5))"
                                      : data.similarity >= 50
                                      ? "hsl(var(--chart-2))"
                                      : "hsl(var(--destructive))",
                                }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-text-muted">{data.rawA}</span>
                              <span className="text-xs text-text-muted">{data.rawB}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
