"use client";

import Image from "next/image";
import { getChampionIconUrl } from "@/lib/game-assets";

interface SoloqChampionPoolProps {
  championPool: string;
}

export default function SoloqChampionPool({ championPool }: SoloqChampionPoolProps) {
  const champs = championPool.split(",").map((c) => c.trim()).filter(Boolean);

  if (champs.length === 0) return null;

  return (
    <div className="rounded-lg border border-[#2A2D3A] overflow-hidden">
      <div className="bg-[#141621] px-3 py-2 border-b border-[#2A2D3A]">
        <span className="text-xs font-semibold text-[#6C757D] uppercase tracking-wider">Champion Pool</span>
      </div>
      <div className="bg-[#1A1F2E] p-3">
        <div className="flex items-center gap-2 flex-wrap">
          {champs.map((champ) => (
            <div key={champ} className="flex items-center gap-1 bg-[#232838] rounded px-2 py-1">
              <div className="relative w-4 h-4 rounded overflow-hidden">
                <Image
                  src={getChampionIconUrl(champ)}
                  alt={champ}
                  fill
                  sizes="16px"
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <span className="text-xs text-[#ADB5BD]">{champ}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
