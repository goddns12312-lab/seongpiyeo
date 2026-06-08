export default function ListingsNewLoading() {
  return (
    <div className="bg-bg-primary min-h-screen">
      <div className="max-w-full mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Title Skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-bg-tertiary rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-bg-tertiary rounded w-2/3"></div>
          </div>

          {/* Form Skeleton */}
          <div className="bg-gradient-to-br from-bg-card to-bg-light border border-border-light rounded-lg p-6 space-y-6 animate-pulse">
            {/* Image Upload Skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-bg-tertiary rounded w-24"></div>
              <div className="h-40 bg-bg-tertiary rounded border-2 border-dashed border-border-light"></div>
            </div>

            {/* Basic Info Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-bg-tertiary rounded w-24"></div>
                  <div className="h-10 bg-bg-tertiary rounded"></div>
                </div>
              ))}
            </div>

            {/* Price Section Skeleton */}
            <div className="space-y-4">
              <div className="h-4 bg-bg-tertiary rounded w-32"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-bg-tertiary rounded w-20"></div>
                    <div className="h-10 bg-bg-tertiary rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-bg-tertiary rounded w-24"></div>
              <div className="h-32 bg-bg-tertiary rounded"></div>
            </div>

            {/* Buttons Skeleton */}
            <div className="flex gap-3 pt-4">
              <div className="h-10 bg-bg-tertiary rounded flex-1"></div>
              <div className="h-10 bg-bg-tertiary rounded flex-1"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
