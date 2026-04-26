"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SyncStatsButtonProps {
  playerId: string;
}

export default function SyncStatsButton({ playerId }: SyncStatsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/riot/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId }),
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      toast.success("SoloQ stats synced from Riot API");
      window.location.reload();
    } catch (error) {
      console.error("Failed to sync stats:", error);
      toast.error("Failed to sync stats");
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isLoading}
      className="h-8 px-2 text-xs border-[#E9ECEF] dark:border-gray-700 hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b] dark:text-white"
    >
      <RefreshCw
        className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`}
      />
      {isLoading ? "Syncing..." : "Sync Stats"}
    </Button>
  );
}
