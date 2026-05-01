export default function TierlistsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-9 w-40 bg-card rounded-md animate-pulse mb-2" />
        <div className="h-5 w-72 bg-card rounded-md animate-pulse" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 w-full bg-card rounded-md animate-pulse" />
        ))}
      </div>
    </div>
  );
}

