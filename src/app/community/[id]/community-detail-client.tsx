'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import DeletePostButton from '@/components/DeletePostButton';
import { createClient } from '@/lib/supabase/client';

interface Props {
  postId: string;
}

export default function CommunityDetailClient({ postId }: Props) {
  const [canDelete, setCanDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`/api/check-post-permission/${postId}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setCanDelete(data.canDelete);
        }
      } catch (error) {
        console.error('[CommunityDetailClient] 권한 확인 오류:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkPermission();
  }, [postId]);

  if (isLoading) {
    return null;
  }

  if (!canDelete) {
    return null;
  }

  return (
    <div className="flex gap-2 ml-4">
      <Link href={`/community/${postId}/edit`}>
        <Button variant="secondary" size="sm">수정</Button>
      </Link>
      <DeletePostButton postId={postId} />
    </div>
  );
}
