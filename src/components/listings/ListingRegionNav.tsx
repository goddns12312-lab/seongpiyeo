import Link from 'next/link';
import { getAdjacentRegions } from '@/lib/adjacent-regions';

interface ListingRegionNavProps {
  currentRegion: string;
  regionListingCounts: Record<string, number>;
  premiumPrice?: number;
  monthlyRent?: number;
}

const CATEGORY_LINKS = [
  { href: '/pc-bangs/sale', label: '매매 매물' },
  { href: '/pc-bangs/rent', label: '임대 매물' },
  { href: '/pc-bangs/transfer', label: '양도양수 매물' },
] as const;

export function ListingRegionNav({
  currentRegion,
  regionListingCounts,
  premiumPrice,
  monthlyRent,
}: ListingRegionNavProps) {
  const currentCount = regionListingCounts[currentRegion] || 0;
  const adjacentRegions = getAdjacentRegions(currentRegion).filter(
    (region) => (regionListingCounts[region] || 0) > 0
  );

  const topRegions = Object.entries(regionListingCounts)
    .filter(([region, count]) => region !== currentRegion && count >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([region]) => region);

  const relatedRegions = [
    ...new Set([...adjacentRegions, ...topRegions.filter((r) => !adjacentRegions.includes(r))]),
  ].slice(0, 6);

  return (
    <nav
      aria-label="지역 및 카테고리 매물 탐색"
      className="mt-8 bg-bg-secondary rounded-lg border border-border-light p-6"
    >
      <h2 className="text-lg font-bold text-text-primary mb-4">다른 매물 둘러보기</h2>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
            현재 지역
          </p>
          <Link
            href={`/pc-bangs/${encodeURIComponent(currentRegion)}`}
            className="inline-flex items-center gap-2 text-gold-dark dark:text-gold font-semibold hover:underline"
          >
            {currentRegion} 성인PC 매물 {currentCount}건 전체 보기
          </Link>
        </div>

        {relatedRegions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
              다른 지역
            </p>
            <ul className="flex flex-wrap gap-2">
              {relatedRegions.map((region) => (
                <li key={region}>
                  <Link
                    href={`/pc-bangs/${encodeURIComponent(region)}`}
                    className="inline-block px-3 py-1.5 text-sm rounded-lg border border-border-light text-text-secondary hover:border-gold hover:text-gold transition-colors"
                  >
                    {region} ({regionListingCounts[region]})
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
            거래 유형
          </p>
          <ul className="flex flex-wrap gap-2">
            {CATEGORY_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-block px-3 py-1.5 text-sm rounded-lg border border-border-light text-text-secondary hover:border-gold hover:text-gold transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
            {premiumPrice && premiumPrice > 0 ? (
              <li>
                <Link
                  href="/pc-bangs/sale"
                  className="inline-block px-3 py-1.5 text-sm rounded-lg border border-border-light text-text-secondary hover:border-gold hover:text-gold transition-colors"
                >
                  권리금 {premiumPrice}만원대 매물
                </Link>
              </li>
            ) : null}
            {monthlyRent && monthlyRent > 0 ? (
              <li>
                <Link
                  href="/pc-bangs/rent"
                  className="inline-block px-3 py-1.5 text-sm rounded-lg border border-border-light text-text-secondary hover:border-gold hover:text-gold transition-colors"
                >
                  월세 {monthlyRent}만원대 임대
                </Link>
              </li>
            ) : null}
          </ul>
        </div>

        <Link href="/pc-bangs" className="inline-block text-sm text-text-secondary hover:text-gold">
          ← 전국 매물 목록
        </Link>
      </div>
    </nav>
  );
}
