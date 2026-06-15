import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ region: string; category: string }>;
}

// 가격 타입별 라벨
const PRICE_TYPE_LABELS: Record<string, string> = {
  lease: '임대',
  sale: '매매',
  transfer: '양도양수',
};

function buildTitle(region: string, category: string, count: number): string {
  const categoryLabel = PRICE_TYPE_LABELS[category] || category;
  return `${region} 성인PC ${categoryLabel} 매물 ${count}개`;
}

function buildDescription(region: string, category: string, count: number): string {
  const categoryLabel = PRICE_TYPE_LABELS[category] || category;
  return `${region} 성인PC ${categoryLabel} 매물 ${count}개를 확인하세요. 최신 매물과 조건을 비교할 수 있습니다.`.slice(0, 160);
}

function buildKeywords(region: string, category: string): string {
  const categoryLabel = PRICE_TYPE_LABELS[category] || category;
  return [
    `${region} 성인PC ${categoryLabel}`,
    `${region} PC방 ${categoryLabel}`,
    `${region} PC방 매물`,
    `성인PC ${categoryLabel}`,
    '성피요',
  ].join(', ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region, category } = await params;
  const decodedRegion = decodeURIComponent(region);
  const decodedCategory = decodeURIComponent(category);
  const supabase = await createClient();

  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('region', decodedRegion)
    .eq('price_type', decodedCategory)
    .eq('status', 'active');

  const listingCount = count || 0;

  // Thin Content 정책 적용
  // 0개: noindex + nofollow
  if (listingCount === 0) {
    return {
      title: `${decodedRegion} PC방 매물`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // 1~2개: noindex (하지만 follow)
  if (listingCount < 3) {
    return {
      title: buildTitle(decodedRegion, decodedCategory, listingCount),
      description: buildDescription(decodedRegion, decodedCategory, listingCount),
      robots: {
        index: false,
        follow: true,
      },
      alternates: {
        canonical: `${SITE_CONFIG.url}/listings/region/${encodeURIComponent(decodedRegion)}/category/${encodeURIComponent(decodedCategory)}`,
      },
    };
  }

  // 3개 이상: index + 상세 메타데이터
  const title = buildTitle(decodedRegion, decodedCategory, listingCount);
  const description = buildDescription(decodedRegion, decodedCategory, listingCount);
  const keywords = buildKeywords(decodedRegion, decodedCategory);

  return {
    title,
    description,
    keywords,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/listings/region/${encodeURIComponent(decodedRegion)}/category/${encodeURIComponent(decodedCategory)}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_CONFIG.url}/listings/region/${encodeURIComponent(decodedRegion)}/category/${encodeURIComponent(decodedCategory)}`,
      siteName: SITE_CONFIG.businessName,
      images: [
        {
          url: `${SITE_CONFIG.url}/423432.png`,
          width: 1200,
          height: 630,
          alt: `${decodedRegion} PC방 ${PRICE_TYPE_LABELS[decodedCategory]} - 성피요`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/423432.png`],
    },
  };
}

export default async function ListingsRegionCategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
