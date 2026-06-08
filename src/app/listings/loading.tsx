export default function ListingsLoading() {
  return (
    <div className="bg-bg-primary min-h-screen">
      {/* Header Skeleton */}
      <section className="bg-gradient-to-br from-bg-secondary via-bg-primary to-bg-primary border-b border-border-light">
        <div className="max-w-full mx-auto px-4 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-bg-tertiary rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-bg-tertiary rounded w-1/3"></div>
          </div>
        </div>
      </section>

      {/* Filter Skeleton */}
      <section className="bg-gradient-to-r from-bg-secondary to-bg-tertiary sticky top-16 z-40 border-b border-border-accent">
        <div className="max-w-full mx-auto px-4 lg:px-8 py-3">
          <div className="flex gap-2 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-bg-tertiary rounded px-3 w-20"></div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid Skeleton */}
      <section className="max-w-full mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-bg-card to-bg-light border border-border-light rounded-lg overflow-hidden animate-pulse">
              <div className="h-40 bg-bg-tertiary" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-bg-tertiary rounded w-1/3" />
                <div className="h-4 bg-bg-tertiary rounded w-3/4" />
                <div className="h-6 bg-gold/20 rounded w-1/2" />
                <div className="h-3 bg-bg-tertiary rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
