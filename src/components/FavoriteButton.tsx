"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useSession } from "next-auth/react";

// Module-level cache so multiple FavoriteButtons on the same page share
// a single /api/favorites request instead of each firing its own.
let favoritesCache: string[] | null = null;
let favoritesPromise: Promise<string[]> | null = null;

async function fetchFavoriteIds(): Promise<string[]> {
  if (favoritesCache) return favoritesCache;
  if (favoritesPromise) return favoritesPromise;

  favoritesPromise = fetch("/api/favorites")
    .then(async (res) => {
      if (!res.ok) throw new Error("Failed to fetch favorites");
      const data = await res.json();
      const ids = Array.isArray(data)
        ? data.map((f: { playerId: string }) => f.playerId)
        : (data.favorites || []).map((f: { playerId: string }) => f.playerId);
      favoritesCache = ids;
      return ids;
    })
    .catch((error) => {
      favoritesPromise = null;
      throw error;
    });

  return favoritesPromise;
}

export function invalidateFavoritesCache() {
  favoritesCache = null;
  favoritesPromise = null;
}

interface FavoriteButtonProps {
  playerId: string;
  variant?: "default" | "small";
}

export default function FavoriteButton({
  playerId,
  variant = "default",
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const checkFavoriteStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const favoriteIds = await fetchFavoriteIds();
      setIsFavorited(favoriteIds.includes(playerId));
    } catch (error) {
      logger.error("Error checking favorite status", { error });
    }
  }, [playerId, isAuthenticated]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add favorites");
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isFavorited) {
        const res = await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        });

        if (res.ok) {
          setIsFavorited(false);
          invalidateFavoritesCache();
          toast.success("Removed from watchlist");
        } else {
          toast.error("Failed to update watchlist");
        }
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        });

        if (res.ok || res.status === 409) {
          setIsFavorited(true);
          invalidateFavoritesCache();
          toast.success("Added to watchlist");
        } else {
          toast.error("Failed to update watchlist");
        }
      }
    } catch (error) {
      logger.error("Error toggling favorite", { error });
      toast.error("Failed to update watchlist");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "small") {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite();
        }}
        disabled={isLoading}
        className="p-1.5 rounded-full bg-background/90 hover:bg-card shadow-sm border border-border transition-colors disabled:opacity-50"
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            isFavorited
              ? "fill-primary-accent text-primary-accent"
              : "text-text-muted hover:text-primary-accent"
          }`}
        />
      </button>
    );
  }

  return (
    <Button
      onClick={toggleFavorite}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className={`gap-2 ${
        isFavorited
          ? "border-primary-accent text-primary-accent hover:bg-primary-accent/10"
          : "border-border text-text-muted hover:text-primary-accent hover:border-primary-accent"
      }`}
    >
      <Heart
        className={`h-4 w-4 ${isFavorited ? "fill-primary-accent" : ""}`}
      />
      {isFavorited ? "Favorited" : "Add to Watchlist"}
    </Button>
  );
}

