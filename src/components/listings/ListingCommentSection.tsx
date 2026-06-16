'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSession } from '@/lib/auth-session';
import Link from 'next/link';

interface ListingComment {
  id: string;
  listing_id: string;
  user_id: string | null;
  nickname: string;
  content: string;
  status: string;
  created_at: string;
}

interface ListingCommentSectionProps {
  listingId: string;
  initialComments: ListingComment[];
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return '방금';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export default function ListingCommentSection({
  listingId,
  initialComments,
}: ListingCommentSectionProps) {
  const [comments, setComments] = useState<ListingComment[]>(initialComments);
  const [content, setContent] = useState('');
  const [user, setUser] = useState<{ id: string; nickname: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/listings/comments?listingId=${listingId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.comments)) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error('댓글 불러오기 실패:', err);
    } finally {
      setIsFetching(false);
    }
  }, [listingId]);

  useEffect(() => {
    setUser(getSession());
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/listings/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          listingId,
          content: content.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '댓글 등록 실패');
        return;
      }

      if (data.comment) {
        setComments((prev) => [...prev, data.comment as ListingComment]);
        setContent('');
      }
    } catch (err) {
      console.error('예외 발생:', err);
      setError('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-bg-secondary border border-border-light rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">💬</span>
        <h3 className="text-sm font-semibold text-text-primary">
          댓글 {comments.length}개
        </h3>
      </div>

      {isFetching ? (
        <p className="text-xs text-text-muted py-4 text-center">댓글 불러오는 중...</p>
      ) : comments.length > 0 ? (
        <div className="space-y-3 border-t border-border-light pt-4">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span className="font-medium text-gold">{comment.nickname}</span>
                <span>·</span>
                <span>{formatRelativeTime(comment.created_at)}</span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed break-words">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted py-4 text-center">아직 댓글이 없습니다.</p>
      )}

      <div className="border-t border-border-light pt-4 space-y-3">
        {!user ? (
          <div className="bg-bg-primary rounded p-3 text-center">
            <p className="text-xs text-text-secondary mb-2">
              댓글을 작성하려면 로그인이 필요합니다.
            </p>
            <Link
              href="/login"
              className="inline-block bg-gold text-bg-primary px-3 py-1 rounded text-xs font-medium hover:bg-gold-light transition"
            >
              로그인하기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="댓글을 입력하세요..."
              rows={2}
              className="w-full bg-bg-tertiary border border-border-light rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold resize-none"
              disabled={isLoading}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !content.trim()}
                className="bg-gold text-bg-primary px-4 py-1.5 rounded text-xs font-medium hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? '등록 중...' : '댓글 등록'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
