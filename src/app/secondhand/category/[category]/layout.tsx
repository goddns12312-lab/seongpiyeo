import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';

const SECONDHAND_CATEGORIES = {
  equipment: {
    label: '장비',
    description: 'PC방 중고 장비 판매 및 구매. PC, 모니터, 의자 등 PC방 운영에 필요한 장비',
    keywords: ['PC방 장비', '중고 PC', '장비 판매', '운영 장비'],
  },
  furniture: {
    label: '가구',
    description: 'PC방 중고 가구. 의자, 책상, 안마의자 등 PC방 실내 가구',
    keywords: ['PC방 가구', '중고 의자', '게이밍 가구'],
  },
  supplies: {
    label: '소모품',
    description: 'PC방 중고 소모품. 냉장고, 에어컨, 정수기 등 PC방 운영 물품',
    keywords: ['PC방 소모품', '냉장고', '에어컨'],
  },
  other: {
    label: '기타',
    description: 'PC방 관련 기타 중고 물품. 각종 운영 필수 물품 판매',
    keywords: ['PC방 물품', '중고 판매', '기타 장비'],
  },
};

type SecondhandCategory = keyof typeof SECONDHAND_CATEGORIES;

function isCategoryValid(category: string): category is SecondhandCategory {
  return category in SECONDHAND_CATEGORIES;
}

interface Props {
  params: Promise<{ category: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { category } = await params;

  if (!isCategoryValid(category)) {
    return {
      title: '카테고리를 찾을 수 없습니다',
      robots: { index: false, follow: false },
    };
  }

  const info = SECONDHAND_CATEGORIES[category];
  const title = `PC방 중고 ${info.label} | 성인PC 운영 물품`;
  const description = info.description;
  const keywords = ['중고 판매', '중고 물품', 'PC방 운영', ...info.keywords];
  const url = createCanonicalUrl(`/secondhand/category/${category}`);

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
      images: [
        {
          url: `${SITE_CONFIG.url}/og-image.png`,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/og-image.png`],
    },
  };
}

export default function SecondhandCategoryLayout({ children }: Props) {
  return children;
}
