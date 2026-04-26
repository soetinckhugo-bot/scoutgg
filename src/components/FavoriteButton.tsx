"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  const checkFavoriteStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const favorites = await res.json();
        const favorited = favorites.some(
          (f: { playerId: string }) => f.playerId === playerId
        );
        setIsFavorited(favorited);
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  }, [playerId]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  const toggleFavorite = async () => {
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
          toast.success("Added to watchlist");
        } else {
          toast.error("Failed to update watchlist");
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
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
        className="p-1.5 rounded-full bg-white/90 dark:bg-[#0f172a]/90 hover:bg-white dark:hover:bg-[#0f172a] shadow-sm border border-[#E9ECEF] dark:border-gray-700 transition-colors disabled:opacity-50"
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            isFavorited
              ? "fill-[#E94560] text-[#E94560]"
              : "text-[#6C757D] hover:text-[#E94560]"
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
          ? "border-[#E94560] text-[#E94560] hover:bg-[#E94560]/10"
          : "border-[#E9ECEF] text-[#6C757D] hover:text-[#E94560] hover:border-[#E94560]"
      }`}
    >
      <Heart
        className={`h-4 w-4 ${isFavorited ? "fill-[#E94560]" : ""}`}
      />
      {isFavorited ? "Favorited" : "Add to Watchlist"}
    </Button>
  );
}

