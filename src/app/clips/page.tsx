"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ClipCard from "@/components/clips/ClipCard";
import ClipPodium from "@/components/clips/ClipPodium";
import ClipLightbox from "@/components/clips/ClipLightbox";
import ParticipateModal from "@/components/clips/ParticipateModal";
import { Input } from "@/components/ui/input";
import { Star, Search, TrendingUp, Clock, User, Calendar } from "lucide-react";
import Link from "next/link";

interface Clip {
  id: string;
  playerName: string;
  playerRole: string;
  title: string;
  platform: string;
  videoId: string;
  totalVotes: number;
  avgScore: number;
}

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
const SORTS = [
  { key: "recent", label: "Recent", icon: Clock },
  { key: "popular", label: "Popular", icon: TrendingUp },
  { key: "top", label: "Top Rated", icon: Star },
  { key: "player", label: "Player", icon: User },
];

export default function ClipsPage() {
  const { data: session } = useSession();
  const [clips, setClips] = useState<Clip[]>([]);
  const [podium, setPodium] = useState<Clip[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("");
  const [playerQuery, setPlayerQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [period, setPeriod] = useState("month");
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  async function fetchClips() {
    setLoading(true);
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (playerQuery) params.set("player", playerQuery);
    if (sort) params.set("sort", sort);
    if (period) params.set("period", period);
    const res = await fetch(`/api/clips?${params.toString()}`);
    const data = await res.json();
    setClips(data.clips || []);
    setLoading(false);
  }

  async function fetchPodium() {
    const res = await fetch(`/api/clips/leaderboard?minVotes=5&period=${period}`);
    const data = await res.json();
    setPodium(data.clips || []);
  }

  useEffect(() => {
    fetchClips();
    fetchPodium();
  }, [role, sort, period]);

  useEffect(() => {
    const timer = setTimeout(() => fetchClips(), 300);
    return () => clearTimeout(timer);
  }, [playerQuery]);

  async function handleVote(clipId: string, score: number) {
    if (!session?.user) return;
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clipId, score }),
    });
    if (res.ok) {
      const updated = { ...userVotes, [clipId]: score };
      setUserVotes(updated);
      fetchClips();
      fetchPodium();
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Star className="h-6 w-6 text-primary-accent" />
            <h1 className="text-3xl font-bold text-text-heading tracking-tight">
              Clip of the Month
            </h1>
          </div>
          <p className="text-text-body text-sm">
            The best community clips — vote for your favorite!
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <ParticipateModal />
        </div>

        {!session?.user && (
          <div className="text-center mb-6">
            <p className="text-sm text-text-muted">
              <Link href="/login" className="text-primary-accent hover:underline">Log in</Link> to vote on clips.
            </p>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPeriod("month")}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                period === "month"
                  ? "bg-primary-accent text-text-heading border-primary-accent"
                  : "border-border text-text-body hover:bg-surface-hover"
              }`}
            >
              <Calendar className="h-3 w-3 inline mr-1" />
              This Month
            </button>
            <button
              onClick={() => setPeriod("all")}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                period === "all"
                  ? "bg-primary-accent text-text-heading border-primary-accent"
                  : "border-border text-text-body hover:bg-surface-hover"
              }`}
            >
              All Time
            </button>
          </div>

          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              type="search"
              placeholder="Search player..."
              value={playerQuery}
              onChange={(e) => setPlayerQuery(e.target.value)}
              className="pl-10 bg-card border-border text-text-heading"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setRole("")}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                !role
                  ? "bg-primary-accent text-text-heading border-primary-accent"
                  : "border-border text-text-body hover:bg-surface-hover"
              }`}
            >
              All Roles
            </button>
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  role === r
                    ? "bg-primary-accent text-text-heading border-primary-accent"
                    : "border-border text-text-body hover:bg-surface-hover"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                  sort === s.key
                    ? "bg-surface-hover text-text-heading border-border"
                    : "border-border text-text-body hover:bg-surface-hover"
                }`}
              >
                <s.icon className="h-3 w-3" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {!loading && period === "month" && <ClipPodium clips={podium} onOpen={setSelectedClip} />}

        {loading ? (
          <div className="text-center py-16 text-text-muted">Loading...</div>
        ) : clips.length === 0 ? (
          <div className="text-center py-16">
            <Star className="h-8 w-8 text-text-muted mx-auto mb-3" />
            <p className="text-text-body text-lg">No clips found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {clips.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                userVote={userVotes[clip.id]}
                onVote={handleVote}
                canVote={!!session?.user}
                onOpen={() => setSelectedClip(clip)}
              />
            ))}
          </div>
        )}
      </div>

      <ClipLightbox
        open={!!selectedClip}
        onOpenChange={(open) => !open && setSelectedClip(null)}
        clip={selectedClip}
      />
    </div>
  );
}
