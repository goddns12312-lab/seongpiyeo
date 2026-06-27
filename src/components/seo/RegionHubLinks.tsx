import Link from 'next/link';

type RegionHubLinksProps = {
  regions: Array<{ region: string; count: number }>;
  title?: string;
  className?: string;
};

export function RegionHubLinks({
  regions,
  title = '지역별 매물 확인',
  className = '',
}: RegionHubLinksProps) {
  if (regions.length === 0) return null;

  return (
    <section className={`bg-bg-secondary border border-border-light rounded-lg p-8 ${className}`.trim()}>
      <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">{title}</h2>
      <nav aria-label="지역별 매물" className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {regions.map(({ region, count }) => (
          <Link
            key={region}
            href={`/pc-bangs/${encodeURIComponent(region)}`}
            className="block p-4 bg-bg-tertiary hover:bg-gold/20 border border-border-light hover:border-gold rounded-lg text-center transition-colors"
          >
            <span className="font-semibold text-text-primary hover:text-gold">
              {region}
            </span>
            <span className="block text-xs text-text-secondary mt-1">{count}건</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
