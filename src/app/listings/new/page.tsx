import { Metadata } from 'next';
import { ListingFormNew } from '@/components/listings/ListingFormNew';

export const metadata: Metadata = {
  title: '매물 등록',
  description: '새로운 PC방 매물을 등록하세요.',
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
