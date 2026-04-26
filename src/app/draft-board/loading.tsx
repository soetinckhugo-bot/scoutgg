export default function DraftBoardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-9 w-48 bg-muted rounded-md animate-pulse mb-2" />
        <div className="h-5 w-80 bg-muted rounded-md animate-pulse" />
      </div>

      <div className="h-14 w-full bg-muted rounded-md animate-pulse mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-md animate-pulse" />
        ))}
      </div>
    </div>
  );
}

