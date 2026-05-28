'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth';

export default function SecondhandDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    fetchItem();
  }, [params.id]);

  const fetchItem = async () => {
    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data, error } = await supabase
        .from('secondhand_items')
        .select('*, secondhand_images(url, order_num)')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setItem(data);
    } catch (error) {
      console.error('Failed to fetch item:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-text-secondary">로딩 중...</div>;
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary text-lg mb-4">물품을 찾을 수 없습니다.</p>
          <Link href="/secondhand" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 font-medium">
            ← 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const images = (item.secondhand_images || []).sort((a: any, b: any) => a.order_num - b.order_num);
  const mainImage = images.length > 0 ? images[selectedImageIndex]?.url : item.main_image_url;
  const isOwner = user && user.id === item.user_id;

  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {/* 네비게이션 */}
        <Link href="/secondhand" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors">
          <span>←</span>
          <span>목록으로</span>
        </Link>

        {/* 2열 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* 좌측: 이미지 + 설명 (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 헤더 카드 */}
            <div className="bg-bg-secondary border border-border-light rounded-xl p-6 space-y-4">
              {/* 제목 */}
              <div>
                <h1 className="text-2xl lg:text-4xl font-bold text-text-primary leading-tight">{item.title}</h1>
              </div>

              {/* 메타 정보 그리드 */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border-light">
                <div>
                  <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">지역</p>
                  <p className="text-text-primary font-semibold">📍 {item.region}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">상태</p>
                  <p className="text-text-primary font-semibold">
                    {item.status === 'sold' ? '판매완료' : item.status === 'reserved' ? '예약중' : '판매중'}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">게시일</p>
                  <p className="text-text-primary font-semibold text-sm">{new Date(item.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
              </div>
            </div>

            {/* 이미지 영역 */}
            <div className="space-y-4">
              {/* 메인 이미지 */}
              <div className="relative w-full bg-bg-tertiary rounded-xl overflow-hidden aspect-video">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={item.title}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                    <div className="w-16 h-16 rounded-full bg-bg-primary flex items-center justify-center text-4xl">📦</div>
                    <p className="text-text-muted text-sm">이미지 없음</p>
                  </div>
                )}
              </div>

              {/* 썸네일 갤러리 */}
              {images.length > 0 && (
                <div className="grid grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                  {images.map((img: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === idx ? 'border-gold' : 'border-border-light'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`이미지 ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 상세 설명 */}
            <div className="bg-bg-secondary border border-border-light rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <span className="w-1 h-6 bg-gold rounded-full"></span>
                상품 설명
              </h2>
              <div className="text-text-primary whitespace-pre-wrap leading-relaxed text-base">
                {item.description || '설명이 없습니다.'}
              </div>
            </div>
          </div>

          {/* 우측: 정보 카드 (1/3) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              {/* 가격 카드 */}
              <div className="bg-bg-secondary border border-border-light rounded-xl p-6">
                <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-2">가격</p>
                <p className="text-4xl font-bold text-gold">{item.price.toLocaleString()}만원</p>
              </div>

              {/* 정보 카드 */}
              <div className="bg-bg-secondary border border-border-light rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-text-primary">상품 정보</h3>

                <div className="space-y-3 pb-4 border-b border-border-light">
                  <div>
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">지역</p>
                    <p className="text-text-primary font-semibold">📍 {item.region}</p>
                  </div>

                  <div>
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">상태</p>
                    <p className="text-text-primary font-semibold">
                      {item.status === 'sold' ? '판매완료' : item.status === 'reserved' ? '예약중' : '판매중'}
                    </p>
                  </div>

                  <div>
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">게시일</p>
                    <p className="text-text-primary font-semibold">{new Date(item.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-3">
                <button className="w-full bg-gold hover:bg-gold/90 text-bg-primary font-bold py-3 rounded-lg transition-colors">
                  📞 판매자에게 문의
                </button>

                {isOwner && (
                  <div className="flex gap-2">
                    <button className="flex-1 bg-bg-secondary border border-border-light hover:border-gold text-text-primary font-semibold py-2 rounded-lg transition-colors text-sm">
                      수정
                    </button>
                    <button className="flex-1 bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400 font-semibold py-2 rounded-lg transition-colors text-sm">
                      삭제
                    </button>
                  </div>
                )}

                <Link href="/secondhand" className="block">
                  <button className="w-full bg-bg-secondary border border-border-light hover:border-gold text-text-primary font-bold py-3 rounded-lg transition-colors">
                    ← 목록으로
                  </button>
                </Link>
              </div>

              {/* 추가 정보 */}
              <div className="text-center pt-4 border-t border-border-light text-text-muted text-xs">
                <p>게시일: {new Date(item.created_at).toLocaleDateString('ko-KR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
