'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth-session';
import type { SecondhandListItem } from '@/lib/secondhand-data';

const REGIONS = ['전체', '서울', '경기', '인천', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

type Props = {
  initialItems: SecondhandListItem[];
  searchQuery: string;
  regionFilter: string;
  sortBy: string;
};

export default function SecondhandPageClient({
  initialItems,
  searchQuery,
  regionFilter,
  sortBy,
}: Props) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    setUser(getSession());
  }, []);

  const handleAddItem = () => {
    if (!user) router.push('/login?redirect=/secondhand');
    else router.push('/secondhand/new');
  };

  return (
    <div className="bg-bg-primary min-h-screen">
      <div className="bg-gradient-to-b from-bg-secondary to-bg-primary border-b border-border-light py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-2">PC방 중고거래</p>
              <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-3">중고장터</h1>
              <p className="text-text-secondary text-base lg:text-lg">PC방 관련 중고 물품을 거래하는 공간입니다.</p>
            </div>
            <button
              onClick={handleAddItem}
              className="bg-gold hover:bg-gold/90 text-bg-primary font-bold px-6 py-3 rounded-xl transition-colors shrink-0"
            >
              + 물품 올리기
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <form action="/secondhand" method="get" className="space-y-4">
          <input
            type="search"
            name="q"
            defaultValue={searchQuery}
            placeholder="물품명, 설명으로 검색..."
            className="w-full bg-bg-secondary border border-border-light rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-gold"
          />
          <div className="flex gap-3 flex-wrap">
            <select
              name="region"
              defaultValue={regionFilter}
              className="bg-bg-secondary border border-border-light rounded-lg px-4 py-2 text-text-primary text-sm"
            >
              {REGIONS.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <select
              name="sort"
              defaultValue={sortBy}
              className="bg-bg-secondary border border-border-light rounded-lg px-4 py-2 text-text-primary text-sm"
            >
              <option value="latest">최신순</option>
              <option value="price_asc">낮은가격순</option>
              <option value="price_desc">높은가격순</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-gold text-bg-primary rounded-lg text-sm font-semibold">
              적용
            </button>
          </div>
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {initialItems.length === 0 ? (
          <div className="bg-bg-secondary border border-border-light rounded-xl p-12 text-center">
            <p className="text-text-secondary text-lg">등록된 물품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {initialItems.map((item) => (
              <Link key={item.id} href={`/secondhand/${item.id}`}>
                <div className="bg-bg-secondary border border-border-light rounded-xl overflow-hidden hover:border-gold transition-all h-full">
                  <div className="relative w-full aspect-[4/3] bg-bg-tertiary">
                    {item.main_image_url ? (
                      <img src={item.main_image_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-text-primary font-semibold mb-2 line-clamp-2 text-sm">{item.title}</h3>
                    <p className="text-gold font-bold text-lg mb-2">{item.price.toLocaleString()}만원</p>
                    <p className="text-xs text-text-muted">📍 {item.region}</p>
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
