"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SeasonSplitSelectorProps {
  seasons: string[];
  splits: string[];
}

export default function SeasonSplitSelector({ seasons, splits }: SeasonSplitSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSeason = (searchParams?.get("season") ?? "All") as string;
  const currentSplit = (searchParams?.get("split") ?? "Overall") as string;

  const updateParams = (season: string, split: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (season && season !== "All") {
      params.set("season", season);
    } else {
      params.delete("season");
    }
    if (split && split !== "Overall") {
      params.set("split", split);
    } else {
      params.delete("split");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Season */}
      <Select
        value={currentSeason}
        onValueChange={(v) => updateParams(v || "All", currentSplit)}
      >
        <SelectTrigger className="h-8 text-xs bg-card border-border w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Seasons</SelectItem>
          {seasons.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Split */}
      <Select
        value={currentSplit}
        onValueChange={(v) => updateParams(currentSeason, v || "Overall")}
      >
        <SelectTrigger className="h-8 text-xs bg-card border-border w-[110px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Overall">Overall</SelectItem>
          {splits.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
