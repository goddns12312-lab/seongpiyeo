import Link from 'next/link';
import {
  type GuideEntry,
  GUIDE_CATEGORY_LABELS,
  getGuideHref,
  getGuideDisplayTitle,
} from '@/lib/guide-content';

interface ListingGuideLinksProps {
  guides: GuideEntry[];
  region?: string;
}

export function ListingGuideLinks({ guides, region }: ListingGuideLinksProps) {
  if (!guides.length) return null;

  return (
    <section className="mt-8 bg-bg-secondary rounded-lg border border-border-light p-6">
      <h2 className="text-xl font-bold text-text-primary mb-2">매매 전 꼭 보는 가이드</h2>
      <p className="text-sm text-text-secondary mb-5">
        이 매물을 검토할 때 함께 읽어보면 좋은 창업·계약·법규 정보입니다.
      </p>

      <ul className="space-y-3">
        {guides.map((guide) => {
          const categoryLabel = GUIDE_CATEGORY_LABELS[guide.category] || guide.category;
          const title = getGuideDisplayTitle(guide, region);

          return (
            <li key={guide.id}>
              <Link
                href={getGuideHref(guide.id)}
                className="group flex items-start gap-3 rounded-lg border border-border-light bg-bg-primary px-4 py-3 hover:border-gold transition-colors"
              >
                <span className="shrink-0 mt-0.5 rounded bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold-dark dark:text-gold">
                  {categoryLabel}
                </span>
                <span className="text-sm font-medium text-text-primary group-hover:text-gold transition-colors leading-snug">
                  {title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/guide" className="text-sm font-semibold text-gold-dark dark:text-gold hover:underline">
          가이드 전체보기 →
        </Link>
        <Link href="/faq" className="text-sm text-text-secondary hover:text-gold">
          자주 묻는 질문
        </Link>
      </div>
    </section>
  );
}
