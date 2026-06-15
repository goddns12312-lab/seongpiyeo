'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LISTING_LIST_SELECT } from '@/lib/listing-queries';

const LISTING_CATEGORIES = {
  rent: { label: '임대', color: 'text-blue-500' },
  sale: { label: '매매', color: 'text-green-500' },
  transfer: { label: '양도양수', color: 'text-purple-500' },
};

type ListingCategory = keyof typeof LISTING_CATEGORIES;

function isCategoryValid(category: string): category is ListingCategory {
  return category in LISTING_CATEGORIES;
}

export default function ListingCategoryPage({ params }: { params: { category: string } }) {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const category = params.category as ListingCategory;
  const categoryInfo = LISTING_CATEGORIES[category];

  useEffect(() => {
    fetchListings();
  }, [category]);

  const fetchListings = async () => {
    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase not initialized');

      const priceType = category === 'rent' ? 'monthly_rent' : 'premium_price';

      const { data, error } = await supabase
        .from('listings')
        .select(LISTING_LIST_SELECT, { count: 'exact' })
        .eq('status', 'active')
        .gt(priceType, 0)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!categoryInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">카테고리를 찾을 수 없습니다.</p>
          <Link href="/listings">
            <button className="text-gold hover:text-gold/80 font-semibold">
              ← 매물 목록으로 돌아가기
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {/* Navigation */}
        <Link href="/listings" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors">
          <span>←</span>
          <span>매물 목록으로</span>
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-bg-secondary to-bg-tertiary rounded-xl p-6 lg:p-8 mb-8">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-2">성인PC 매물</p>
          <h1 className={`text-3xl lg:text-4xl font-bold mb-2 ${categoryInfo.color}`}>
            {categoryInfo.label}
          </h1>
          <p className="text-text-secondary">
            성인PC {categoryInfo.label} 매물을 한눈에 확인할 수 있습니다.
          </p>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-12 text-text-secondary">로딩 중...</div>
        ) : listings.length === 0 ? (
          <div className="bg-bg-secondary border border-border-light rounded-xl p-12 text-center">
            <p className="text-text-secondary text-lg mb-4">아직 {categoryInfo.label} 매물이 없습니다.</p>
            <Link href="/listings">
              <button className="text-gold hover:text-gold/80 font-semibold">
                전체 매물 보기 →
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <div className="bg-bg-secondary border border-border-light rounded-lg overflow-hidden hover:border-gold hover:shadow-lg transition-all cursor-pointer">
                  {/* Image */}
                  <div className="relative w-full aspect-video bg-bg-tertiary overflow-hidden">
                    {listing.main_image_url ? (
                      <img
                        src={listing.main_image_url}
                        alt={listing.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-secondary">
                        📷
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    {/* Price */}
                    <p className="text-gold font-bold text-lg mb-2">
                      {category === 'rent' && listing.monthly_rent
                        ? `월세 ${listing.monthly_rent.toLocaleString()}만원`
                        : category === 'sale' && listing.premium_price
                        ? `권리금 ${listing.premium_price.toLocaleString()}만원`
                        : '문의'}
                    </p>

                    {/* Title */}
                    <h3 className="text-text-primary font-semibold line-clamp-2 hover:text-gold transition-colors mb-2">
                      {listing.title}
                    </h3>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-text-muted text-xs">
                      <span>📍 {listing.region}</span>
                      <span>조회 {listing.view_count || 0}</span>
                    </div>
                    <p className="text-text-muted text-xs mt-1">
                      {new Date(listing.created_at).toLocaleDateString('ko-KR')}
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
