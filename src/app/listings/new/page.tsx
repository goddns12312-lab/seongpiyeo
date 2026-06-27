import { Metadata } from 'next';
import { ListingFormNew } from '@/components/listings/ListingFormNew';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: '매물 등록',
  description: '성인PC 매물을 등록하고 판매하세요. 빠르고 안전한 거래를 경험해보세요.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: '매물 등록',
    description: '성인PC 매물을 등록하고 판매하세요.',
    type: 'website',
    url: `${SITE_CONFIG.url}/pc-bangs/new`,
    siteName: SITE_CONFIG.businessName,
  },
};

export default function NewListingPage() {
  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text-primary mb-8">새 매물 등록</h1>
        <ListingFormNew />
      </div>
    </div>
  );
}
