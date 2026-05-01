"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, ArrowRight } from "lucide-react";

interface CompareBarProps {
  children: (props: {
    isSelected: (id: string) => boolean;
    toggleSelection: (id: string, name: string) => void;
  }) => React.ReactNode;
}

export default function CompareBar({ children }: CompareBarProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Map<string, string>>(new Map());

  const isSelected = useCallback(
    (id: string) => selected.has(id),
    [selected]
  );

  const toggleSelection = useCallback((id: string, name: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 2) {
        next.set(id, name);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(new Map());
  }, []);

  const handleCompare = useCallback(() => {
    if (selected.size !== 2) return;
    const ids = Array.from(selected.keys()).join(",");
    router.push(`/compare?players=${ids}`);
  }, [selected, router]);

  const selectedNames = Array.from(selected.values());

  return (
    <>
      {children({ isSelected, toggleSelection })}

      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-medium text-text-heading shrink-0">
                {selected.size}/2 selected
              </span>
              <span className="text-sm text-text-muted truncate hidden sm:inline">
                {selectedNames.join(" vs ")}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="border-border text-text-subtle hover:bg-surface-hover hover:text-text-heading"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleCompare}
                disabled={selected.size !== 2}
                className="bg-primary-accent text-text-heading hover:bg-primary-accent/90 disabled:opacity-50"
              >
                Compare
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function CompareCheckbox({
  playerId,
  playerName,
  isSelected,
  toggleSelection,
}: {
  playerId: string;
  playerName: string;
  isSelected: boolean;
  toggleSelection: (id: string, name: string) => void;
}) {
  return (
    <label className="absolute top-3 left-3 z-10 flex items-center gap-2 cursor-pointer bg-background/90 backdrop-blur rounded-lg px-2 py-1 border border-border shadow-sm hover:bg-surface-hover transition-colors">
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => toggleSelection(playerId, playerName)}
      />
      <span className="text-xs font-medium text-text-heading">Compare</span>
    </label>
  );
}
