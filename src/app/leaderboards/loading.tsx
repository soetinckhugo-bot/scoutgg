export default function LeaderboardsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-9 w-48 bg-card rounded-md animate-pulse mb-2" />
        <div className="h-5 w-80 bg-card rounded-md animate-pulse" />
      </div>

      <div className="h-10 w-full max-w-md bg-card rounded-md animate-pulse mb-6" />

      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-14 w-full bg-card rounded-md animate-pulse" />
        ))}
      </div>
    </div>
  );
}

