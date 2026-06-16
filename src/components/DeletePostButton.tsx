'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function DeletePostButton({
  postId,
  redirectTo = '/community',
}: {
  postId: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/posts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ postId }),
      });
      const result = await res.json();

      if (result.success) {
        router.push(result.redirectTo || redirectTo);
      } else {
        alert(result.error || '삭제 실패');
        setIsDeleting(false);
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
      setIsDeleting(false);
    }
  };

  return (
    <Button variant="danger" size="sm" onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? '삭제 중...' : '삭제'}
    </Button>
  );
}
