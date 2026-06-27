import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';
import { buildOgImageEntry, getOgImageUrl } from '@/lib/seo-assets';
import { formatSeoCount } from '@/lib/seo-metadata';
import { createPublicClient } from '@/lib/supabase/public';

const LISTING_CATEGORIES = {
  rent: {
    label: '임대',
    description: '성인PC 임대 매물, 월세로 운영할 수 있는 PC방 가게',
    keywords: ['PC방 임대', '임대 매물', '월세 운영'],
  },
  sale: {
    label: '매매',
    description: '성인PC 매매 매물, 권리금으로 인수할 수 있는 PC방 가게',
    keywords: ['PC방 매매', '권리금', '인수'],
  },
  transfer: {
    label: '양도양수',
    description: '성인PC 양도양수, 기존 사업을 인수인계할 수 있는 PC방',
    keywords: ['양도양수', '인수인계', '기존 사업'],
  },
};

type ListingCategory = keyof typeof LISTING_CATEGORIES;

function isCategoryValid(category: string): category is ListingCategory {
  return category in LISTING_CATEGORIES;
}

interface Props {
  params: Promise<{ category: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { category } = await params;

  // Validate category
  if (!isCategoryValid(category)) {
    return {
      title: '카테고리를 찾을 수 없습니다',
      robots: { index: false, follow: false },
    };
  }

  const info = LISTING_CATEGORIES[category];
  const supabase = createPublicClient();
  const priceField = category === 'rent' ? 'monthly_rent' : 'premium_price';

  const { count } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gt(priceField, 0);

  const listingCount = count || 0;
  const countLabel = formatSeoCount(listingCount);
  const title = `성인PC ${info.label} 매물 ${countLabel} | 권리금·월세·양도양수`;
  const description = info.description;
  const keywords = [
    '성인PC',
    '성인피씨',
    '성인피시',
    ...info.keywords,
  ];
  const url = createCanonicalUrl(`/pc-bangs/${category}`);

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
      },
    },
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: SITE_CONFIG.businessName,
      locale: 'ko_KR',
      images: [buildOgImageEntry(title)],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getOgImageUrl()],
    },
  };
}

export default function ListingCategoryLayout({ children }: Props) {
  return children;
}
