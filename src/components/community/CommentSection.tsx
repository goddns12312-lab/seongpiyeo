'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSession, AuthSession } from '@/lib/auth-session';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';
import { Comment } from '@/types';

interface CommentSectionProps {
  postId: string;
  initialComments: (Comment & { profiles?: { nickname: string } })[];
}

export function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AuthSession | null>(null);

  useEffect(() => {
    const session = getSession();
    setUser(session);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) {
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('Comment error:', error);
        return;
      }

      if (data) {
        setComments([...comments, data]);
        setContent('');
      }
    } catch (err) {
      console.error('Comment submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-text-primary font-semibold text-lg mb-6">댓글 ({comments.length})</h2>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 bg-bg-secondary border border-border-light rounded-lg p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요..."
            rows={3}
            className="w-full px-3 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold resize-none mb-3"
            required
          />
          <Button variant="primary" isLoading={loading} type="submit" size="sm">
            댓글 작성
          </Button>
        </form>
      ) : (
        <div className="mb-8 bg-bg-secondary border border-border-light rounded-lg p-4 text-center">
          <p className="text-text-secondary text-sm mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">아직 댓글이 없습니다.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-bg-secondary border border-border-light rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-text-primary font-semibold text-sm">
                  {(comment as any).profiles?.nickname || '익명'}
                </span>
                <span className="text-text-secondary text-xs">
                  {formatDateTime(comment.created_at)}
                </span>
              </div>
              <p className="text-text-primary text-sm">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
