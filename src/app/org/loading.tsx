export default function OrgLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-9 w-48 bg-card rounded-md animate-pulse mb-2" />
        <div className="h-5 w-72 bg-card rounded-md animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-card rounded-md animate-pulse" />
          <div className="h-64 bg-card rounded-md animate-pulse" />
        </div>
        <div className="h-64 bg-card rounded-md animate-pulse" />
      </div>
    </div>
  );
}

