"use client";

import { useState, useEffect } from "react";
import ClipCard from "@/components/clips/ClipCard";
import ClipPodium from "@/components/clips/ClipPodium";
import ParticipateModal from "@/components/clips/ParticipateModal";
import { Star } from "lucide-react";

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

export default function ClipsPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [podium, setPodium] = useState<Clip[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  async function fetchClips() {
    const res = await fetch("/api/clips");
    const data = await res.json();
    setClips(data.clips || []);
    setLoading(false);
  }

  async function fetchPodium() {
    const res = await fetch("/api/clips/leaderboard?minVotes=5");
    const data = await res.json();
    setPodium(data.clips || []);
  }

  useEffect(() => {
    fetchClips();
    fetchPodium();
    const stored = localStorage.getItem("clipVotes");
    if (stored) setUserVotes(JSON.parse(stored));
  }, []);

  async function handleVote(clipId: string, score: number) {
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clipId, score }),
    });
    if (res.ok) {
      const updated = { ...userVotes, [clipId]: score };
      setUserVotes(updated);
      localStorage.setItem("clipVotes", JSON.stringify(updated));
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
              Clips du mois
            </h1>
          </div>
          <p className="text-text-body text-sm">
            Les meilleurs clips de la communauté — vote pour ton préféré !
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <ParticipateModal />
        </div>

        {!loading && <ClipPodium clips={podium} />}

        {loading ? (
          <div className="text-center py-16 text-text-muted">Chargement...</div>
        ) : clips.length === 0 ? (
          <div className="text-center py-16">
            <Star className="h-8 w-8 text-text-muted mx-auto mb-3" />
            <p className="text-text-body text-lg">Aucun clip ce mois-ci.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {clips.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                userVote={userVotes[clip.id]}
                onVote={handleVote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
