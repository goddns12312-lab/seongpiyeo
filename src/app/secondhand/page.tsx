'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth-session';
import { createClient } from '@/lib/supabase/client';

const REGIONS = ['전체', '서울', '경기', '인천', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

type SortType = 'latest' | 'price_asc' | 'price_desc';

export default function SecondhandPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('전체');
  const [sortBy, setSortBy] = useState<SortType>('latest');

  useEffect(() => {
    const session = getSession();
    setUser(session);
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data, error } = await supabase
        .from('secondhand_items')
        .select('id, title, description, price, region, status, created_at, main_image_url')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(150);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!user) {
      router.push('/login?redirect=/secondhand');
    } else {
      router.push('/secondhand/new');
    }
  };

  // 클라이언트 측 필터링 및 정렬
  const filteredItems = items
    .filter(item => {
      const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || (item.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchRegion = regionFilter === '전체' || item.region === regionFilter;
      return matchSearch && matchRegion;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="bg-bg-primary min-h-screen">
      {/* 히어로 영역 */}
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

      {/* 필터/검색 영역 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {/* 검색창 */}
          <div className="relative">
            <input
              type="text"
              placeholder="물품명, 설명으로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-secondary border border-border-light rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-gold transition-colors"
            />
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* 필터 및 정렬 */}
          <div className="flex gap-3 flex-wrap">
            {/* 지역 필터 */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-bg-secondary border border-border-light rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-gold transition-colors text-sm"
            >
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>

            {/* 정렬 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('latest')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'latest'
                    ? 'bg-gold text-bg-primary'
                    : 'bg-bg-secondary border border-border-light text-text-primary hover:border-gold'
                }`}
              >
                최신순
              </button>
              <button
                onClick={() => setSortBy('price_asc')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'price_asc'
                    ? 'bg-gold text-bg-primary'
                    : 'bg-bg-secondary border border-border-light text-text-primary hover:border-gold'
                }`}
              >
                낮은가격순
              </button>
              <button
                onClick={() => setSortBy('price_desc')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'price_desc'
                    ? 'bg-gold text-bg-primary'
                    : 'bg-bg-secondary border border-border-light text-text-primary hover:border-gold'
                }`}
              >
                높은가격순
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 카드 그리드 */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="text-center py-12 text-text-secondary">로딩 중...</div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-bg-secondary border border-border-light rounded-xl p-12 text-center">
            <p className="text-text-secondary text-lg">등록된 물품이 없습니다.</p>
            <p className="text-text-muted text-sm mt-2">다른 조건으로 검색해보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => (
              <Link key={item.id} href={`/secondhand/${item.id}`}>
                <div className="bg-bg-secondary border border-border-light rounded-xl overflow-hidden hover:border-gold hover:shadow-hover transition-all group cursor-pointer h-full flex flex-col">
                  {/* 이미지 4:3 비율 */}
                  <div className="relative w-full aspect-[4/3] bg-bg-tertiary overflow-hidden">
                    {item.main_image_url ? (
                      <img
                        src={item.main_image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                        <div className="w-12 h-12 rounded-full bg-bg-primary flex items-center justify-center text-2xl">📦</div>
                        <p className="text-text-muted text-xs">이미지 없음</p>
                      </div>
                    )}
                    {/* 상태 배지 */}
                    <div className="absolute top-3 left-3">
                      {item.status === 'sold' ? (
                        <span className="bg-gray-600 text-white text-xs px-2.5 py-1 rounded-full font-bold">판매완료</span>
                      ) : item.status === 'reserved' ? (
                        <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-bold">예약중</span>
                      ) : (
                        <span className="bg-green-600 text-white text-xs px-2.5 py-1 rounded-full font-bold">판매중</span>
                      )}
                    </div>
                  </div>

                  {/* 정보 섹션 */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-text-primary font-semibold mb-2 line-clamp-2 text-sm">{item.title}</h3>
                    </div>
                    <div>
                      <p className="text-gold font-bold text-lg mb-3">{item.price.toLocaleString()}만원</p>
                      <div className="flex items-center justify-between text-xs text-text-muted border-t border-border-light pt-3">
                        <span>📍 {item.region}</span>
                        <span>{new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
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
