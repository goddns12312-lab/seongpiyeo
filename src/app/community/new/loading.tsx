export default function CommunityNewLoading() {
  return (
    <div className="bg-bg-primary min-h-screen">
      <div className="max-w-full mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Title Skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-bg-tertiary rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-bg-tertiary rounded w-2/3"></div>
          </div>

          {/* Form Skeleton */}
          <div className="bg-gradient-to-br from-bg-card to-bg-light border border-border-light rounded-lg p-6 space-y-6 animate-pulse">
            {/* Category Skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-bg-tertiary rounded w-24"></div>
              <div className="h-10 bg-bg-tertiary rounded"></div>
            </div>

            {/* Title Input Skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-bg-tertiary rounded w-20"></div>
              <div className="h-10 bg-bg-tertiary rounded"></div>
            </div>

            {/* Content Skeleton */}
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
