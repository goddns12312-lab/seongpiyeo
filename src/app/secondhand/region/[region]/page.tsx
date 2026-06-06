'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface SecondhandItem {
  id: string;
  title: string;
  price: number;
  region: string;
  category: string;
  status: string;
  main_image_url?: string;
  created_at: string;
}

const SECONDHAND_CATEGORIES = {
  equipment: { label: '장비', color: 'text-blue-500' },
  furniture: { label: '가구', color: 'text-green-500' },
  supplies: { label: '소모품', color: 'text-purple-500' },
  other: { label: '기타', color: 'text-orange-500' },
};

export default function SecondhandRegionPage({ params }: { params: { region: string } }) {
  const decodedRegion = decodeURIComponent(params.region);
  const [items, setItems] = useState<SecondhandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchItems();
  }, [decodedRegion]);

  const fetchItems = async () => {
    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase not initialized');

      // 전체 개수 조회
      const { count } = await supabase
        .from('secondhand_items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('region', decodedRegion);

      setTotalCount(count || 0);

      // Thin Content 정책: 콘텐츠 0개면 404
      if (!count || count === 0) {
        notFound();
      }

      // 데이터 조회
      const { data, error } = await supabase
        .from('secondhand_items')
        .select('id, title, price, region, category, status, main_image_url, created_at')
        .eq('status', 'active')
        .eq('region', decodedRegion)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {/* Navigation */}
        <Link href="/secondhand" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors">
          <span>←</span>
          <span>전체 상품 목록으로</span>
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-bg-secondary to-bg-tertiary rounded-xl p-6 lg:p-8 mb-8">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-2">지역별 중고용품</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-2">
            {decodedRegion} 중고 용품
          </h1>
          <p className="text-text-secondary">
            {decodedRegion} 지역의 PC방 운영에 필요한 중고 용품을 구매하고 판매하세요.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-bg-secondary border border-border-light rounded-lg p-4">
            <p className="text-text-secondary text-sm">전체 상품</p>
            <p className="text-2xl font-bold text-gold">{totalCount}개</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-4">
            <p className="text-text-secondary text-sm">지역</p>
            <p className="text-2xl font-bold text-text-primary">{decodedRegion}</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-4">
            <p className="text-text-secondary text-sm">최근 상품</p>
            <p className="text-2xl font-bold text-text-primary">
              {items.length > 0
                ? new Date(items[0].created_at).toLocaleDateString('ko-KR')
                : '-'}
            </p>
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="text-center py-12 text-text-secondary">로딩 중...</div>
        ) : items.length === 0 ? (
          <div className="bg-bg-secondary border border-border-light rounded-xl p-12 text-center">
            <p className="text-text-secondary text-lg mb-4">아직 상품이 없습니다.</p>
            <Link href="/secondhand">
              <button className="text-gold hover:text-gold/80 font-semibold">
                전체 상품 보기 →
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <Link key={item.id} href={`/secondhand/${item.id}`}>
                <div className="bg-bg-secondary border border-border-light rounded-lg overflow-hidden hover:border-gold hover:shadow-lg transition-all cursor-pointer">
                  {/* Image */}
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

                  {/* Info */}
                  <div className="p-4">
                    {/* Price */}
                    <p className="text-gold font-bold text-lg mb-2">
                      {item.price.toLocaleString()}만원
                    </p>

                    {/* Title */}
                    <h3 className="text-text-primary font-semibold line-clamp-2 hover:text-gold transition-colors mb-2">
                      {item.title}
                    </h3>

                    {/* Meta */}
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
