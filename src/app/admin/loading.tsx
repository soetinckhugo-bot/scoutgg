export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-9 w-32 bg-card rounded-md animate-pulse mb-2" />
        <div className="h-5 w-48 bg-card rounded-md animate-pulse" />
      </div>

      <div className="h-10 w-96 bg-card rounded-md animate-pulse mb-8" />

      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 bg-card rounded-md animate-pulse" />
        ))}
      </div>
    </div>
  );
}

