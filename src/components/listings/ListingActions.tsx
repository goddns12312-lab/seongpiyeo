'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { deleteListing } from '@/lib/actions';
import { Button } from '@/components/ui/Button';

interface ListingActionsProps {
  listingId: string;
  userId: string;
}

export function ListingActions({ listingId, userId }: ListingActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const session = getSession();
    setIsOwner(!!session && (session.id === userId || session.role === 'admin'));
  }, [userId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteListing(listingId);
      if (result.error) {
        alert('삭제 실패: ' + result.error);
        setIsDeleting(false);
        return;
      }

      alert('매물이 삭제되었습니다.');
      router.push('/listings');
    } catch (err) {
      console.error('Delete error:', err);
      alert('삭제 중 오류가 발생했습니다.');
      setIsDeleting(false);
    }
  };

  if (!isHydrated) {
    return <div className="h-8" />;
  }

  return (
    <>
      {isOwner && (
        <div className="flex gap-2">
          <Link href={`/listings/${listingId}/edit`}>
            <Button variant="secondary" size="sm">
              수정
            </Button>
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1 bg-red-900/20 border border-red-900 text-red-200 text-sm rounded hover:bg-red-900/30 transition"
          >
            삭제
          </button>
        </div>
      )}

      {isOwner && showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-text-primary mb-2">매물 삭제</h3>
            <p className="text-text-secondary mb-6">
              이 매물을 삭제하시겠습니까? 삭제된 매물은 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded hover:bg-bg-secondary transition"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-900/30 border border-red-900 text-red-200 rounded hover:bg-red-900/40 disabled:opacity-50 transition"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
