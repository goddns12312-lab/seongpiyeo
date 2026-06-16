'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth-session';

export function PostSocialActions({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    setUser(getSession());
    fetch(`/api/posts/social?postId=${postId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setLiked(!!d.liked);
        setBookmarked(!!d.bookmarked);
        setLikeCount(d.likeCount || 0);
      })
      .catch(() => {});
  }, [postId]);

  const toggle = async (action: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/posts/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ postId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === 'like') setLiked(true);
        if (action === 'unlike') setLiked(false);
        if (action === 'bookmark') setBookmarked(true);
        if (action === 'unbookmark') setBookmarked(false);
        if (typeof data.likeCount === 'number') setLikeCount(data.likeCount);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-wrap gap-2 mb-6 text-sm text-text-muted">
        <Link href="/login" className="text-gold hover:underline">로그인</Link>
        <span>하면 좋아요·스크랩을 사용할 수 있습니다</span>
        <span className="ml-auto">♥ {likeCount}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <button
        type="button"
        disabled={loading}
        onClick={() => toggle(liked ? 'unlike' : 'like')}
        className={`px-3 py-1.5 rounded-lg text-sm border transition ${
          liked
            ? 'bg-red-500/15 border-red-500/40 text-red-300'
            : 'bg-bg-secondary border-border-light text-text-secondary hover:border-gold'
        }`}
      >
        {liked ? '♥' : '♡'} 좋아요 {likeCount}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => toggle(bookmarked ? 'unbookmark' : 'bookmark')}
        className={`px-3 py-1.5 rounded-lg text-sm border transition ${
          bookmarked
            ? 'bg-gold/15 border-gold text-gold'
            : 'bg-bg-secondary border-border-light text-text-secondary hover:border-gold'
        }`}
      >
        {bookmarked ? '🔖 스크랩됨' : '🔖 스크랩'}
      </button>
    </div>
  );
}
