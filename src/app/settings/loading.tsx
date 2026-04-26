export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-9 w-32 bg-muted rounded-md animate-pulse mb-2" />
        <div className="h-5 w-64 bg-muted rounded-md animate-pulse" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-md animate-pulse" />
        ))}
      </div>
    </div>
  );
}

