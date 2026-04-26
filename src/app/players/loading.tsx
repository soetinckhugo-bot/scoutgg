import PlayerCardSkeleton from "@/components/PlayerCardSkeleton";

export default function PlayersLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-9 w-32 bg-muted rounded-md animate-pulse mb-2" />
        <div className="h-5 w-96 bg-muted rounded-md animate-pulse" />
      </div>

      <div className="mb-6 space-y-4">
        <div className="h-10 w-full max-w-md bg-muted rounded-md animate-pulse" />
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-10 bg-muted rounded-md animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 w-12 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-14 bg-muted rounded-md animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 w-14 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-12 bg-muted rounded-md animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 w-20 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="h-6 w-14 bg-muted rounded-md animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 w-16 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <PlayerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

