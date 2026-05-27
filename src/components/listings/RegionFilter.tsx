'use client';

import Link from 'next/link';
import { REGIONS } from '@/types';

interface RegionFilterProps {
  selectedRegion: string;
  regionCounts: Record<string, number>;
}

export function RegionFilter({ selectedRegion, regionCounts }: RegionFilterProps) {
  const isAllSelected = selectedRegion === 'all' || !selectedRegion;
  const totalCount = Object.values(regionCounts).reduce((sum, count) => sum + count, 0);

  const getButtonStyles = (region: string) => {
    const isSelected = selectedRegion === region;
    if (isSelected) {
      return 'bg-gradient-to-r from-gold-dark to-gold text-bg-primary border-gold font-semibold shadow-hover hover:shadow-elevated scale-105';
    }
    return 'bg-transparent border border-border-light text-text-secondary hover:border-gold hover:text-gold transition-all hover:shadow-card';
  };

  const getAllButtonStyles = () => {
    if (isAllSelected) {
      return 'bg-gradient-to-r from-gold-dark to-gold text-bg-primary border-gold font-semibold shadow-hover hover:shadow-elevated scale-105';
    }
    return 'bg-transparent border border-border-light text-text-secondary hover:border-gold hover:text-gold transition-all hover:shadow-card';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* 전체 버튼 */}
      <Link href="/listings">
        <button
          className={`px-3 py-1.5 border rounded-lg transition-all text-xs font-medium ${getAllButtonStyles()}`}
        >
          전체 ({totalCount})
        </button>
      </Link>

      {/* 지역별 버튼 (매물이 있는 지역만) */}
      {REGIONS.filter((region) => regionCounts[region] > 0).map((region) => (
        <Link key={region} href={`/listings/region/${encodeURIComponent(region)}`}>
          <button
            className={`px-3 py-1.5 border rounded-lg transition-all text-xs font-medium ${getButtonStyles(region)}`}
          >
            {region} ({regionCounts[region]})
          </button>
        </Link>
      ))}
    </div>
  );
}
