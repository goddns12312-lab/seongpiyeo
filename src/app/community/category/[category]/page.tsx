'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth';
import { COMMUNITY_CATEGORIES } from '@/lib/community-categories';

export default function CategoryPage({ params }: { params: { category: string } }) {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    fetchPosts();
  }, [params.category]);

  const fetchPosts = async () => {
    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('category', params.category)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const cat = COMMUNITY_CATEGORIES[params.category as keyof typeof COMMUNITY_CATEGORIES];
  if (!cat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">카테고리를 찾을 수 없습니다.</p>
          <Link href="/community">
            <button className="text-gold hover:text-gold/80 font-semibold">
              ← 커뮤니티로 돌아가기
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {/* Navigation */}
        <Link href="/community" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors">
          <span>←</span>
          <span>커뮤니티로</span>
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-bg-secondary to-bg-tertiary rounded-xl p-6 lg:p-8 mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-2">PC방 커뮤니티</p>
              <h1 className={`text-3xl lg:text-4xl font-bold mb-2 ${cat.color}`}>
                {cat.label}
              </h1>
              <p className="text-text-secondary">
                {params.category === 'free' && 'PC방 운영자들이 자유롭게 정보를 공유하는 공간입니다.'}
                {params.category === 'startup' && 'PC방 창업 준비, 사업 경험을 공유하는 공간입니다.'}
                {params.category === 'interior' && 'PC방 인테리어, 시설 개선 정보를 공유하는 공간입니다.'}
                {params.category === 'equipment' && 'PC방 장비, 기자재 선택과 관리 정보를 공유하는 공간입니다.'}
              </p>
            </div>
            {user && (
              <Link href={`/community/new?category=${params.category}`}>
                <button className="bg-gold hover:bg-gold/90 text-bg-primary font-bold px-6 py-3 rounded-lg transition-colors whitespace-nowrap">
                  + 글쓰기
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-text-secondary">로딩 중...</div>
          ) : posts.length === 0 ? (
            <div className="bg-bg-secondary border border-border-light rounded-xl p-12 text-center">
              <p className="text-text-secondary text-lg mb-4">아직 글이 없습니다.</p>
              {user ? (
                <Link href={`/community/new?category=${params.category}`}>
                  <button className="text-gold hover:text-gold/80 font-semibold">
                    첫 번째 글을 작성해보세요 →
                  </button>
                </Link>
              ) : (
                <Link href="/login">
                  <button className="text-gold hover:text-gold/80 font-semibold">
                    로그인 후 글을 작성할 수 있습니다 →
                  </button>
                </Link>
              )}
            </div>
          ) : (
            posts.map(post => (
              <Link key={post.id} href={`/community/${post.id}`}>
                <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary hover:text-gold transition-colors truncate">
                        {post.title}
                      </h3>
                      <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                        <span>조회 {post.view_count || 0}회</span>
                        <span>
                          {new Date(post.created_at).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${cat.color}`}>
                      {cat.label}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Other Categories */}
        <div className="mt-12 pt-8 border-t border-border-light">
          <h2 className="text-2xl font-bold text-text-primary mb-6">다른 카테고리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <Link key={key} href={`/community/category/${key}`}>
                <div className={`bg-bg-secondary border border-border-light rounded-lg p-4 text-center hover:border-gold transition-colors cursor-pointer ${params.category === key ? 'border-gold bg-gold/5' : ''}`}>
                  <h3 className={`font-semibold ${cat.color}`}>{cat.label}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
