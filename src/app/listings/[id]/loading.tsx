export default function ListingDetailLoading() {
  return (
    <div className="bg-bg-primary min-h-screen">
      <div className="max-w-full mx-auto px-4 lg:px-8 py-6">
        {/* Breadcrumb Skeleton */}
        <div className="flex gap-2 mb-6 animate-pulse">
          <div className="h-4 bg-bg-tertiary rounded w-16"></div>
          <div className="h-4 bg-bg-tertiary rounded w-16"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery Skeleton */}
            <div className="bg-gradient-to-br from-bg-card to-bg-light border border-border-light rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-video bg-bg-tertiary"></div>
              <div className="p-4 flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-bg-tertiary rounded w-16"></div>
                ))}
              </div>
            </div>

            {/* Title & Basic Info Skeleton */}
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-bg-tertiary rounded w-3/4"></div>
              <div className="flex gap-4">
                <div className="h-6 bg-bg-tertiary rounded w-24"></div>
                <div className="h-6 bg-bg-tertiary rounded w-24"></div>
              </div>
            </div>

            {/* Price Info Skeleton */}
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-bg-tertiary rounded w-1/2"></div>
              <div className="h-6 bg-bg-tertiary rounded w-1/3"></div>
              <div className="h-4 bg-bg-tertiary rounded w-1/2"></div>
            </div>

            {/* Description Skeleton */}
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-bg-tertiary rounded w-full"></div>
              <div className="h-4 bg-bg-tertiary rounded w-full"></div>
              <div className="h-4 bg-bg-tertiary rounded w-2/3"></div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Contact Card Skeleton */}
            <div className="bg-gradient-to-br from-bg-card to-bg-light border border-border-light rounded-lg p-4 space-y-4 animate-pulse">
              <div className="h-10 bg-bg-tertiary rounded"></div>
              <div className="h-10 bg-bg-tertiary rounded"></div>
              <div className="h-10 bg-bg-tertiary rounded"></div>
            </div>

            {/* Info Box Skeleton */}
            <div className="bg-gradient-to-br from-bg-card to-bg-light border border-border-light rounded-lg p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-bg-tertiary rounded"></div>
              <div className="h-4 bg-bg-tertiary rounded"></div>
              <div className="h-4 bg-bg-tertiary rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
