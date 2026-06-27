'use client';

import Link from 'next/link';
import { getAdjacentRegions } from '@/lib/adjacent-regions';

interface AdjacentRegionsProps {
  currentRegion: string;
  currentListingCount: number;
  regionListingCounts?: Record<string, number>;
}

export function AdjacentRegions({
  currentRegion,
  currentListingCount,
  regionListingCounts = {},
}: AdjacentRegionsProps) {
  // 매물이 5개 이상이면 표시 안 함
  if (currentListingCount >= 5) {
    return null;
  }

  const adjacentRegions = getAdjacentRegions(currentRegion);

  if (adjacentRegions.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 bg-bg-secondary rounded-lg border border-border-light/50 p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        인접 지역 매물도 확인해보세요
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {adjacentRegions.map((region) => {
          const count = regionListingCounts[region] || 0;

          // 인접 지역도 매물이 0개면 표시 안 함
          if (count === 0) {
            return null;
          }

          return (
            <Link
              key={region}
              href={`/pc-bangs?region=${encodeURIComponent(region)}`}
              className="group relative overflow-hidden rounded-lg bg-bg-tertiary border border-border-light hover:border-gold transition-colors p-4 text-center"
            >
              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Content */}
              <div className="relative z-10">
                <p className="font-semibold text-text-primary group-hover:text-gold transition-colors">
                  {region}
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  {count}건의 매물
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Info */}
      <p className="text-xs text-text-muted mt-4 text-center">
        💡 현재 지역의 매물 수가 부족할 때 인접 지역 매물을 보여드립니다.
      </p>
    </section>
  );
}
