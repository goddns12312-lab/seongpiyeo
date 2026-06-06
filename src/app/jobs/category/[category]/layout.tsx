import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';

const JOB_CATEGORIES = {
  recruitment: {
    label: '구인',
    description: '성인PC 알바, 직원 채용 공고. 기술자, 관리자, 서빙 등 다양한 직무',
    keywords: ['PC방 구인', '구인공고', 'PC방 알바', '채용'],
  },
  job_seeker: {
    label: '구직',
    description: '성인PC 직원 구하기, 일자리 찾기. PC방 업계 채용정보',
    keywords: ['PC방 구직', '직업 찾기', '채용정보'],
  },
};

type JobCategory = keyof typeof JOB_CATEGORIES;

function isCategoryValid(category: string): category is JobCategory {
  return category in JOB_CATEGORIES;
}

interface Props {
  params: Promise<{ category: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { category } = await params;

  if (!isCategoryValid(category)) {
    return {
      title: '카테고리를 찾을 수 없습니다 | 성피요',
      robots: { index: false, follow: false },
    };
  }

  const info = JOB_CATEGORIES[category];
  const title = `성인PC ${info.label} | PC방 구인구직 정보 | 성피요`;
  const description = info.description;
  const keywords = ['성인PC', '성인피씨', '구인구직', ...info.keywords];
  const url = createCanonicalUrl(`/jobs/category/${category}`);

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

export default function JobCategoryLayout({ children }: Props) {
  return children;
}
