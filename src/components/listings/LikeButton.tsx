'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth';
import Link from 'next/link';

interface LikeButtonProps {
  listingId: string;
  initialLiked?: boolean;
}

export function LikeButton({ listingId, initialLiked = false }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const session = getSession();
    setUser(session);
  }, []);

  const handleToggleLike = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const supabase = createClient();

      if (liked) {
        // 좋아요 제거
        await supabase
          .from('favorites')
          .delete()
          .eq('listing_id', listingId)
          .eq('user_id', user.id);
        setLiked(false);
      } else {
        // 좋아요 추가
        await supabase
          .from('favorites')
          .insert([
            {
              listing_id: listingId,
              user_id: user.id,
            },
          ]);
        setLiked(true);
      }
    } catch (err) {
      console.error('좋아요 처리 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Link href="/login">
        <button className="px-4 py-2 bg-gold/10 border border-gold/30 text-gold rounded-lg hover:bg-gold/20 transition flex items-center gap-2">
          ❤️ 좋아요
        </button>
      </Link>
    );
  }

  return (
    <button
      onClick={handleToggleLike}
      disabled={loading}
      className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
        liked
          ? 'bg-red-500/20 border border-red-500 text-red-300 hover:bg-red-500/30'
          : 'bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20'
      } disabled:opacity-50`}
    >
      {liked ? '❤️' : '🤍'} {liked ? '좋아요 취소' : '좋아요'}
    </button>
  );
}
