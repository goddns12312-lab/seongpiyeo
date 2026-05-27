import { ListingCard } from './ListingCard';
import { Listing, ListingImage } from '@/types';

interface ListingGridProps {
  listings: (Listing & { listing_images?: ListingImage[] })[];
  isLoading?: boolean;
}

export function ListingGrid({ listings, isLoading }: ListingGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
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
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-border-accent mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-text-secondary text-sm">등록된 매물이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} images={listing.listing_images} />
      ))}
    </div>
  );
}
