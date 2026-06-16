'use client';

import { useEffect } from 'react';

export function PostViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const key = `viewed-post-${postId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    fetch('/api/posts/increment-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId }),
    }).catch(() => {});
  }, [postId]);

  return null;
}
