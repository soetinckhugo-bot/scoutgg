"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Search, Pencil, Check, X, Loader2, Star } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import PlayerCard from "@/components/PlayerCard";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Favorite {
  id: string;
  playerId: string;
  notes: string | null;
  player: any;
}

function formatNotes(text: string): React.ReactElement {
  // Simple rich formatting: bold, italic, links, line breaks
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        // Process inline formatting
        const processed = line;

        // Auto-link URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts: (string | React.ReactElement)[] = [];
        let lastIndex = 0;
        let match;
        const matches = Array.from(processed.matchAll(urlRegex));

        if (matches.length === 0) {
          parts.push(processed);
        } else {
          for (const m of matches) {
            const url = m[0];
            const index = m.index!;
            if (index > lastIndex) {
              parts.push(processed.slice(lastIndex, index));
            }
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
              parts.push(url);
            } else {
              parts.push(
                <a
                  key={`${i}-${index}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-accent underline hover:text-primary-accent/90"
                >
                  {url}
                </a>
              );
            }
            lastIndex = index + url.length;
          }
          if (lastIndex < processed.length) {
            parts.push(processed.slice(lastIndex));
          }
        }

        // Bold: **text**
        const bolded = parts.flatMap((part, pi) => {
          if (typeof part !== "string") return part;
          const boldRegex = /\*\*(.+?)\*\*/g;
          const boldParts: (string | React.ReactElement)[] = [];
          let bi = 0;
          let bm;
          const bmatches = Array.from(part.matchAll(boldRegex));
          if (bmatches.length === 0) return part;
          for (const m of bmatches) {
            if (m.index! > bi) boldParts.push(part.slice(bi, m.index!));
            boldParts.push(
              <strong key={`b${pi}-${m.index}`} className="font-semibold">
                {m[1]}
              </strong>
            );
            bi = m.index! + m[0].length;
          }
          if (bi < part.length) boldParts.push(part.slice(bi));
          return boldParts;
        });

        // Italic: *text* (but not **)
        const italicized = bolded.flatMap((part, pi) => {
          if (typeof part !== "string") return part;
          const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
          const italicParts: (string | React.ReactElement)[] = [];
          let ii = 0;
          const imatches = Array.from(part.matchAll(italicRegex));
          if (imatches.length === 0) return part;
          for (const m of imatches) {
            if (m.index! > ii) italicParts.push(part.slice(ii, m.index!));
            italicParts.push(
              <em key={`i${pi}-${m.index}`} className="italic">
                {m[1]}
              </em>
            );
            ii = m.index! + m[0].length;
          }
          if (ii < part.length) italicParts.push(part.slice(ii));
          return italicParts;
        });

        return (
          <p key={i} className="mb-1 last:mb-0">
            {italicized.length > 0 ? italicized : line}
          </p>
        );
      })}
    </>
  );
}

function NoteEditor({
  favorite,
  onUpdate,
}: {
  favorite: Favorite;
  onUpdate: (updated: Favorite) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(favorite.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: favorite.playerId, notes }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      onUpdate(updated);
      setEditing(false);
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(favorite.notes || "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="mt-3 space-y-2">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add scout notes... Use **bold**, *italic*, and paste links."
          className="min-h-[100px] text-sm bg-card border-border text-text-heading placeholder:text-text-muted"
          maxLength={5000}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-3 text-xs bg-surface-elevated hover:bg-secondary text-text-heading min-h-[44px]"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Check className="h-3 w-3 mr-1" />
            )}
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="h-9 px-3 text-xs min-h-[44px]"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          <span className="text-xs text-text-muted ml-auto tabular-nums">
            {notes.length}/5000
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      {favorite.notes ? (
        <div className="text-sm text-text-body bg-card rounded-md p-3">
          {formatNotes(favorite.notes)}
        </div>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setEditing(true)}
        className="h-9 px-2 text-xs text-text-body hover:text-text-heading mt-1 min-h-[44px]"
      >
        <Pencil className="h-3 w-3 mr-1" />
        {favorite.notes ? "Edit notes" : "Add notes"}
      </Button>
    </div>
  );
}

export default function WatchlistPage() {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await fetch("/api/favorites");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFavorites(data);
    } catch (err) {
      console.error("Watchlist fetch error:", err);
      toast.error("Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchFavorites();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchFavorites]);

  const handleUpdate = (updated: Favorite) => {
    setFavorites((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f))
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-accent" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-16">
          <Heart className="h-16 w-16 text-border mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-heading mb-2">
            Sign in to view your watchlist
          </h2>
          <Link href="/login">
            <Button className="bg-surface-elevated text-text-heading hover:bg-secondary">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="h-7 w-7 text-primary-accent" />
          <h1 className="text-3xl font-bold text-text-heading">
            Watchlist
          </h1>
        </div>
        <p className="text-text-body">
          Players you are tracking and scouting
        </p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Your watchlist is empty"
          description="Add players to your watchlist to track their progress and get alerts."
          action={{ label: "Browse players", href: "/players" }}
          className="py-16"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((favorite) => (
            <div key={favorite.id}>
              <PlayerCard
                player={favorite.player}
                showStats
                showFavorite
                variant="default"
              />
              <NoteEditor favorite={favorite} onUpdate={handleUpdate} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

