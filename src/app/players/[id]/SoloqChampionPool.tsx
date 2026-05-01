"use client";

import Image from "next/image";
import { getChampionIconUrl } from "@/lib/game-assets";
import { Crown } from "lucide-react";

interface SoloqChampionPoolProps {
  championPool: string;
}

export default function SoloqChampionPool({ championPool }: SoloqChampionPoolProps) {
  const champs = championPool.split(",").map((c) => c.trim()).filter(Boolean);

  if (champs.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-text-muted" />
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Champion Pool
          </span>
        </div>
        <span className="text-xs text-text-muted">{champs.length} unique champions</span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {champs.map((champ) => (
            <div key={champ} className="flex flex-col items-center gap-1.5">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden ring-1 ring-border hover:ring-primary-accent/50 transition-colors">
                <Image
                  src={getChampionIconUrl(champ)}
                  alt={champ}
                  fill
                  sizes="48px"
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <span className="text-[10px] text-text-muted text-center leading-tight truncate w-full">
                {champ}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
