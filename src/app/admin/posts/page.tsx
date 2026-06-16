'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ensureAdminClient } from '@/lib/admin-client';
import { ADMIN_POST_SELECT } from '@/lib/account-queries';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Post, CATEGORY_LABELS } from '@/types';

const ADMIN_POSTS_LIMIT = 200;

function AdminPostsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdFilter = searchParams.get('user');
  const nicknameFilter = searchParams.get('nickname');

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from('posts')
      .select(ADMIN_POST_SELECT)
      .order('created_at', { ascending: false })
      .limit(ADMIN_POSTS_LIMIT);

    if (userIdFilter) {
      query = query.eq('user_id', userIdFilter);
    }

    const { data } = await query;
    setPosts((data || []) as Post[]);
    setLoading(false);
  }, [userIdFilter]);

  useEffect(() => {
    const init = async () => {
      const { ok } = await ensureAdminClient({ router });
      if (!ok) {
        setLoading(false);
        return;
      }
      await fetchPosts();
    };
    init();
  }, [router, fetchPosts]);

  const handleHide = async (id: string) => {
    const supabase = createClient();
    await supabase.from('posts').update({ status: 'hidden' }).eq('id', id);
    fetchPosts();
  };

  const handlePin = async (postId: string, is_pinned: boolean) => {
    await fetch('/api/admin/posts/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ postId, is_pinned }),
    });
    fetchPosts();
  };

  const handleNotice = async (postId: string, is_notice: boolean) => {
    await fetch('/api/admin/posts/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ postId, is_notice }),
    });
    fetchPosts();
  };

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/admin" className="text-gold hover:text-gold/80 text-sm mb-4 inline-block">
          ← 관리자 홈
        </Link>

        <h1 className="text-3xl font-bold text-text-primary mb-2">게시글 관리</h1>
        {userIdFilter && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <p className="text-text-secondary text-sm">
              <span className="text-gold font-medium">{nicknameFilter || '회원'}</span> 회원 게시글만
              표시 중 ({posts.length}건)
            </p>
            <Link href="/admin/posts" className="text-xs text-text-muted hover:text-gold underline">
              전체 게시글 보기
            </Link>
            <Link href="/admin/users" className="text-xs text-text-muted hover:text-gold underline">
              회원 관리로
            </Link>
          </div>
        )}

        <div className="overflow-x-auto bg-bg-secondary border border-border-light rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light">
                <th className="px-6 py-3 text-left text-text-primary font-semibold">제목</th>
                <th className="px-6 py-3 text-left text-text-primary font-semibold">카테고리</th>
                <th className="px-6 py-3 text-left text-text-primary font-semibold">상태</th>
                <th className="px-6 py-3 text-left text-text-primary font-semibold">등록일</th>
                <th className="px-6 py-3 text-left text-text-primary font-semibold">작업</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const viewHref =
                  post.category === 'exchange'
                    ? `/exchange-info/${post.id}`
                    : `/community/${post.id}`;

                return (
                <tr key={post.id} className="border-b border-border-light hover:bg-bg-tertiary transition-colors">
                  <td className="px-6 py-3 text-text-primary line-clamp-1">
                    <Link href={viewHref} className="hover:text-gold transition-colors" target="_blank">
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant="secondary">
                      {CATEGORY_LABELS[post.category as keyof typeof CATEGORY_LABELS]}
                    </Badge>
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={post.status === 'active' ? 'success' : 'danger'}>
                      {post.status === 'active' ? '공개' : '비공개'}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-text-secondary text-xs">
                    {formatDate(post.created_at)}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      {post.status === 'active' && (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => handlePin(post.id, true)}>
                            고정
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleNotice(post.id, true)}>
                            공지
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleHide(post.id)}>
                            숨김
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            <p>게시글이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPostsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">로딩 중...</div>}>
      <AdminPostsContent />
    </Suspense>
  );
}
