import { Metadata, notFound } from 'next';
import { createClient } from '@/lib/supabase/server';
import { SITE_CONFIG } from '@/lib/site';
import { SecondhandDetailClient } from './secondhand-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

function buildSecondhandSeoTitle(item: any): string {
  const { region, title, price } = item;
  const priceStr = price ? `${price}만원` : '';
  const titlePart = title || '중고 상품';

  let seoTitle = `${region} ${titlePart}`;
  if (priceStr) {
    seoTitle += ` | ${priceStr}`;
  }

  // 60자 제한
  if (seoTitle.length > 60) {
    seoTitle = `${region} ${titlePart}`;
  }

  return seoTitle;
}

function buildSecondhandSeoDescription(item: any): string {
  const { region, title, price, description } = item;
  const priceStr = price ? `${price}만원` : '협의';

  if (description && description.length > 100) {
    return description.substring(0, 160);
  }

  return `${region}에서 판매하는 ${title}. 가격: ${priceStr}. 중고 물품 거래 플랫폼 성피요.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = SITE_CONFIG.url;
  const supabase = await createClient();

  try {
    const { data: items, error } = await supabase
      .from('listings')
      .select('id, title, description, price, region, status, created_at, main_image_url')
      .eq('id', id)
      .eq('status', 'active')
      .limit(1);

    if (error) {
      console.error('[generateMetadata] Supabase error:', error);
      return {
        title: '상품을 찾을 수 없습니다',
        robots: { index: false, follow: false },
      };
    }

    const item = items?.[0];

    if (!item || item.status === 'deleted') {
      console.warn('[generateMetadata] Item not found:', { id });
      return {
        title: '상품을 찾을 수 없습니다',
        robots: { index: false, follow: false },
      };
    }

    const title = buildSecondhandSeoTitle(item);
    const description = buildSecondhandSeoDescription(item);
    const ogImage = item.main_image_url || `${baseUrl}/og-secondhand.png`;

    return {
      title,
      description,
      keywords: ['중고거래', '중고장터', item.region, item.title, '성피요', '성인PC'],
      authors: [{ name: SITE_CONFIG.businessName }],
      creator: SITE_CONFIG.businessName,
      publisher: SITE_CONFIG.businessName,
      robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
          index: true,
          follow: true,
          noimageindex: false,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      alternates: {
        canonical: `${baseUrl}/secondhand/${id}`,
      },
      openGraph: {
        title: `${title} | ${SITE_CONFIG.businessName}`,
        description,
        type: 'article',
        url: `${baseUrl}/secondhand/${id}`,
        locale: 'ko_KR',
        siteName: SITE_CONFIG.businessName,
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
        publishedTime: item.created_at,
        section: '중고거래',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | ${SITE_CONFIG.businessName}`,
        description,
        images: [ogImage],
      },
    };
  } catch (err) {
    console.error('[generateMetadata] Exception:', err);
    return {
      title: '상품을 찾을 수 없습니다',
      robots: { index: false, follow: false },
    };
  }
}

export default async function SecondhandDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { data: items, error } = await supabase
      .from('listings')
      .select('id, title, description, price, region, status, created_at, main_image_url, view_count, deposit, monthly_rent, price_type, district, address, floor, facilities, available_date, business_license, administrative_record')
      .eq('id', id)
      .eq('status', 'active')
      .limit(1);

    if (error) {
      console.error('[SecondhandDetailPage] Supabase error:', error);
      notFound();
    }

    const item = items?.[0];

    if (!item || item.status === 'deleted') {
      console.warn('[SecondhandDetailPage] Item not found:', { id });
      notFound();
    }

    return <SecondhandDetailClient item={item} listingId={id} />;
  } catch (err) {
    console.error('[SecondhandDetailPage] Exception:', err);
    notFound();
  }
}
