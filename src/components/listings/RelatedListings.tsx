'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, formatDate } from '@/lib/utils';

interface RelatedListing {
  id: string;
  title: string;
  region: string;
  district?: string;
  monthly_rent?: number;
  deposit?: number;
  premium_price?: number;
  main_image_url?: string;
  created_at: string;
}

interface RelatedListingsProps {
  listings: RelatedListing[];
  currentRegion: string;
  currentDistrict?: string;
}

export function RelatedListings({
  listings,
  currentRegion,
  currentDistrict,
}: RelatedListingsProps) {
  if (!listings || listings.length === 0) {
    return null;
  }

  const getPrice = (listing: RelatedListing): string => {
    if (listing.premium_price) return `권리금 ${formatPrice(listing.premium_price)}만`;
    if (listing.deposit) return `보증금 ${formatPrice(listing.deposit)}만`;
    if (listing.monthly_rent) return `월세 ${formatPrice(listing.monthly_rent)}만`;
    return '상담';
  };

  const locationDisplay = currentDistrict
    ? `${currentRegion} ${currentDistrict}`
    : currentRegion;

  return (
    <section className="mt-8 bg-bg-secondary rounded-lg border border-border-light p-6">
      <h2 className="text-xl font-bold text-text-primary mb-6">
        {locationDisplay} 다른 매물
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/listings/${listing.id}`}
            className="group bg-bg-primary rounded-lg border border-border-light overflow-hidden hover:border-gold transition-colors"
          >
            {/* Image */}
            <div className="relative w-full aspect-video bg-bg-tertiary overflow-hidden">
              {listing.main_image_url ? (
                <Image
                  src={listing.main_image_url}
                  alt={listing.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-text-secondary opacity-20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Title */}
              <h3 className="font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-gold transition-colors">
                {listing.title}
              </h3>

              {/* Price */}
              <p className="text-sm font-bold text-gold mb-2">
                {getPrice(listing)}
              </p>

              {/* Location */}
              <p className="text-xs text-text-secondary mb-3">
                {listing.district ? `${listing.region} ${listing.district}` : listing.region}
              </p>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>{formatDate(listing.created_at, 'relative')}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View More Link */}
      {listings.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Link
            href={`/listings?region=${encodeURIComponent(currentRegion)}${
              currentDistrict ? `&district=${encodeURIComponent(currentDistrict)}` : ''
            }`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold hover:bg-opacity-10 rounded-lg transition-colors"
          >
            {locationDisplay} 전체 매물 보기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </section>
  );
}
