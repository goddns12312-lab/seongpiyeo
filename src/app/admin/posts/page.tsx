'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Post, CATEGORY_LABELS } from '@/types';

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const session = getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const supabase = createClient();

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/');
        return;
      }

      await fetchPosts();
    };

    checkAdmin();
  }, [router]);

  const fetchPosts = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      setPosts(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleHide = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from('posts')
      .update({ status: 'hidden' })
      .eq('id', id);

    fetchPosts();
  };

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text-primary mb-8">게시글 관리</h1>

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
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-border-light hover:bg-bg-tertiary transition-colors">
                  <td className="px-6 py-3 text-text-primary line-clamp-1">{post.title}</td>
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
                    {post.status === 'active' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleHide(post.id)}
                      >
                        숨김
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
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
