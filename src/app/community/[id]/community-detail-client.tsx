'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import DeletePostButton from '@/components/DeletePostButton';

interface Props {
  postId: string;
  redirectTo?: string;
}

export default function CommunityDetailClient({ postId, redirectTo = '/community' }: Props) {
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/check-post-permission/${postId}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.canEdit) setCanEdit(true);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [postId]);

  if (isLoading || !canEdit) {
    return null;
  }

  return (
    <div className="flex gap-2 ml-4">
      <Link href={`/community/${postId}/edit`}>
        <Button variant="secondary" size="sm">수정</Button>
      </Link>
      <DeletePostButton postId={postId} redirectTo={redirectTo} />
    </div>
  );
}
