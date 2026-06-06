import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';
import {
  buildCategoryTitle,
  buildCategoryDescription,
  buildCategoryKeywords,
  COMMUNITY_CATEGORIES,
} from '@/lib/community-categories';

interface Props {
  params: Promise<{ category: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;

  // Validate category exists
  if (!COMMUNITY_CATEGORIES[category as keyof typeof COMMUNITY_CATEGORIES]) {
    return {
      title: '카테고리를 찾을 수 없습니다 | 성피요',
      robots: { index: false, follow: false },
    };
  }

  const title = buildCategoryTitle(category);
  const description = buildCategoryDescription(category);
  const keywords = buildCategoryKeywords(category);
  const url = createCanonicalUrl(`/community/category/${category}`);

  return {
    title,
    description,
    keywords: keywords.split(', '),
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

export default function CategoryLayout({ children }: Props) {
  return children;
}
