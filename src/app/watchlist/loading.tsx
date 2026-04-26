import PlayerCardSkeleton from "@/components/PlayerCardSkeleton";

export default function WatchlistLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-7 w-7 bg-muted rounded-full animate-pulse" />
          <div className="h-9 w-32 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="h-5 w-64 bg-muted rounded-md animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <PlayerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

