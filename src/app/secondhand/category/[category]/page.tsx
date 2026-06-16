import Link from 'next/link';
import { fetchSecondhandItems } from '@/lib/secondhand-data';

const SECONDHAND_CATEGORIES = {
  equipment: { label: '장비', color: 'text-blue-500' },
  furniture: { label: '가구', color: 'text-green-500' },
  supplies: { label: '소모품', color: 'text-purple-500' },
  other: { label: '기타', color: 'text-orange-500' },
};

type SecondhandCategory = keyof typeof SECONDHAND_CATEGORIES;

function isCategoryValid(category: string): category is SecondhandCategory {
  return category in SECONDHAND_CATEGORIES;
}

interface Props {
  params: Promise<{ category: string }>;
}

export default async function SecondhandCategoryPage({ params }: Props) {
  const { category } = await params;

  if (!isCategoryValid(category)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">카테고리를 찾을 수 없습니다.</p>
          <Link href="/secondhand">
            <button className="text-gold hover:text-gold/80 font-semibold">
              ← 중고물품 목록으로 돌아가기
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryInfo = SECONDHAND_CATEGORIES[category];
  const items = await fetchSecondhandItems({ category });

  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <Link
          href="/secondhand"
          className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors"
        >
          <span>←</span>
          <span>중고물품 목록으로</span>
        </Link>

        <div className="bg-gradient-to-r from-bg-secondary to-bg-tertiary rounded-xl p-6 lg:p-8 mb-8">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-2">중고물품</p>
          <h1 className={`text-3xl lg:text-4xl font-bold mb-2 ${categoryInfo.color}`}>
            {categoryInfo.label}
          </h1>
          <p className="text-text-secondary">
            PC방 운영에 필요한 중고 {categoryInfo.label}을 구매하고 판매할 수 있습니다.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-bg-secondary border border-border-light rounded-xl p-12 text-center">
            <p className="text-text-secondary text-lg mb-4">아직 {categoryInfo.label} 물품이 없습니다.</p>
            <Link href="/secondhand">
              <button className="text-gold hover:text-gold/80 font-semibold">
                전체 물품 보기 →
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Link key={item.id} href={`/secondhand/${item.id}`}>
                <div className="bg-bg-secondary border border-border-light rounded-lg overflow-hidden hover:border-gold hover:shadow-lg transition-all cursor-pointer">
                  <div className="relative w-full aspect-video bg-bg-tertiary overflow-hidden">
                    {item.main_image_url ? (
                      <img
                        src={item.main_image_url}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-secondary">
                        📦
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-gold font-bold text-lg mb-2">
                      {item.price.toLocaleString()}만원
                    </p>

                    <h3 className="text-text-primary font-semibold line-clamp-2 hover:text-gold transition-colors mb-2">
                      {item.title}
                    </h3>

                    <div className="flex items-center justify-between text-text-muted text-xs">
                      <span>📍 {item.region}</span>
                      <span className="bg-gold/10 text-gold px-2 py-1 rounded">
                        {item.status === 'sold' ? '판매완료' : item.status === 'reserved' ? '예약중' : '판매중'}
                      </span>
                    </div>
                    <p className="text-text-muted text-xs mt-1">
                      {new Date(item.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
