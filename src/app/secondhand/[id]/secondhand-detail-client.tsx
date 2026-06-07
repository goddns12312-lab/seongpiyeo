'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { deleteSecondhandItem } from '@/lib/actions';
import { createClient } from '@/lib/supabase/client';

export interface SecondhandItem {
  id: string;
  title: string;
  description: string;
  price: number;
  region: string;
  status: string;
  created_at: string;
  user_id?: string;
  main_image_url?: string;
}

interface Props {
  item: SecondhandItem;
  listingId: string;
}

export function SecondhandDetailClient({ item, listingId }: Props) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  const mainImage = item.main_image_url;

  // 권한 확인
  useEffect(() => {
    async function checkPermission() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`/api/check-listing-permission/${listingId}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setCanDelete(data.canDelete);
        }
      } catch (error) {
        console.error('[SecondhandDetailClient] 권한 확인 오류:', error);
      } finally {
        setIsCheckingPermission(false);
      }
    }

    checkPermission();
  }, [listingId]);

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
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl lg:text-4xl font-bold text-text-primary leading-tight flex-1">{item.title}</h1>
                {!isCheckingPermission && canDelete && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/secondhand/${item.id}/edit`}>
                      <Button variant="secondary" size="sm">수정</Button>
                    </Link>
                    <DeleteSecondhandButton itemId={item.id} />
                  </div>
                )}
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
            </div>

            {/* 상세 설명 */}
            <div className="bg-bg-secondary border border-border-light rounded-xl p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">상세정보</h2>
              <div className="prose prose-invert max-w-none text-text-secondary">
                {(item.description || '').split('\n').map((line, idx) => (
                  <p key={idx} className="mb-2">{line || ' '}</p>
                ))}
              </div>
            </div>
          </div>

          {/* 우측: 사이드바 (sticky) (1/3) */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            {/* 가격 카드 */}
            <div className="bg-gradient-to-b from-gold/10 to-gold/5 border border-gold/30 rounded-xl p-6 space-y-4 mb-6">
              <p className="text-text-muted text-sm font-medium">판매가격</p>
              <p className="text-4xl font-bold text-gold">{(item.price || 0).toLocaleString()}만원</p>
              <div className="space-y-3 pt-4 border-t border-gold/20">
                <Button variant="primary" className="w-full" disabled={isDeleting}>
                  구매 문의
                </Button>
              </div>
            </div>

            {/* 판매자 정보 */}
            <div className="bg-bg-secondary border border-border-light rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-text-primary">판매자 정보</h3>
              <div className="space-y-3 text-sm text-text-secondary">
                <p>이름: 미확인</p>
                <p>지역: {item.region}</p>
                <p>등록일: {new Date(item.created_at).toLocaleDateString('ko-KR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// DeleteSecondhandButton 컴포넌트
function DeleteSecondhandButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    const result = await deleteSecondhandItem(itemId);

    if (result.success) {
      router.push('/secondhand');
    } else {
      alert(result.error || '삭제 실패');
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="danger"
      size="sm"
      disabled={isDeleting}
      onClick={handleDelete}
    >
      {isDeleting ? '삭제 중...' : '삭제'}
    </Button>
  );
}
