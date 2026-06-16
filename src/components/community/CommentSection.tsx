'use client';

import { FormEvent, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, AuthSession } from '@/lib/auth-session';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';
import { Comment } from '@/types';

type CommentWithProfile = Comment & {
  parent_id?: string | null;
  profiles?: { nickname: string };
};

interface CommentSectionProps {
  postId: string;
  initialComments: CommentWithProfile[];
}

export function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentWithProfile[]>(initialComments);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AuthSession | null>(null);

  useEffect(() => {
    setUser(getSession());
  }, []);

  const { roots, repliesByParent } = useMemo(() => {
    const roots: CommentWithProfile[] = [];
    const repliesByParent = new Map<string, CommentWithProfile[]>();
    for (const c of comments) {
      if (c.parent_id) {
        const list = repliesByParent.get(c.parent_id) || [];
        list.push(c);
        repliesByParent.set(c.parent_id, list);
      } else {
        roots.push(c);
      }
    }
    return { roots, repliesByParent };
  }, [comments]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/posts/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          postId,
          content: content.trim(),
          parentId: replyTo || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments([...comments, data.comment]);
        setContent('');
        setReplyTo(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderComment = (comment: CommentWithProfile, isReply = false) => (
    <div
      key={comment.id}
      className={`bg-bg-secondary border border-border-light rounded-lg p-4 ${isReply ? 'ml-6 mt-2' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-text-primary font-semibold text-sm">
          {comment.profiles?.nickname || '익명'}
        </span>
        <span className="text-text-secondary text-xs">{formatDateTime(comment.created_at)}</span>
      </div>
      <p className="text-text-primary text-sm">{comment.content}</p>
      {user && !isReply && (
        <button
          type="button"
          onClick={() => setReplyTo(comment.id)}
          className="text-xs text-gold mt-2 hover:underline"
        >
          답글
        </button>
      )}
      {(repliesByParent.get(comment.id) || []).map((r) => renderComment(r, true))}
    </div>
  );

  return (
    <div className="mt-8">
      <h2 className="text-text-primary font-semibold text-lg mb-6">댓글 ({comments.length})</h2>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 bg-bg-secondary border border-border-light rounded-lg p-4">
          {replyTo && (
            <p className="text-xs text-gold mb-2">
              답글 작성 중{' '}
              <button type="button" onClick={() => setReplyTo(null)} className="underline">
                취소
              </button>
            </p>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
            rows={3}
            className="w-full px-3 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold resize-none mb-3"
            required
          />
          <Button variant="primary" isLoading={loading} type="submit" size="sm">
            {replyTo ? '답글 작성' : '댓글 작성'}
          </Button>
        </form>
      ) : (
        <div className="mb-8 bg-bg-secondary border border-border-light rounded-lg p-4 text-center">
          <p className="text-text-secondary text-sm">댓글을 작성하려면 로그인이 필요합니다.</p>
        </div>
      )}

      <div className="space-y-4">
        {roots.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">아직 댓글이 없습니다.</p>
        ) : (
          roots.map((c) => renderComment(c))
        )}
      </div>
    </div>
  );
}
