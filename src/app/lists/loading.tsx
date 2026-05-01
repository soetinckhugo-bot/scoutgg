export default function ListsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-9 w-32 bg-card rounded-md animate-pulse mb-2" />
        <div className="h-5 w-64 bg-card rounded-md animate-pulse" />
      </div>

      <div className="h-10 w-48 bg-card rounded-md animate-pulse mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 bg-card rounded-md animate-pulse" />
        ))}
      </div>
    </div>
  );
}

