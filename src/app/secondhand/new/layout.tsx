import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: '중고물품 판매 등록',
  description: 'PC방 관련 중고물품을 판매하세요. 안전하고 빠른 거래 플랫폼에서 필요한 장비를 구매/판매할 수 있습니다.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: '중고물품 판매 등록',
    description: 'PC방 관련 중고물품을 판매하세요.',
    type: 'website',
    url: `${SITE_CONFIG.url}/secondhand/new`,
    siteName: SITE_CONFIG.businessName,
  },
};

export default function SecondhandNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
