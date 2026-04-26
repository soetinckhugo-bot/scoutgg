import { Skeleton } from "./skeleton";

export function PlayerCardSkeleton() {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14 rounded" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <Skeleton className="h-8 w-full rounded" />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="p-4 space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-8 w-20" />
    </div>
  );
}
