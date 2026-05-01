import PlayerCardSkeleton from "@/components/PlayerCardSkeleton";

export default function CompareLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-9 w-48 bg-card rounded-md animate-pulse mb-2" />
        <div className="h-5 w-96 bg-card rounded-md animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlayerCardSkeleton />
        <PlayerCardSkeleton />
      </div>
    </div>
  );
}

