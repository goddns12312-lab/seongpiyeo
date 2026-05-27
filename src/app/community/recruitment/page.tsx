'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PostCard } from '@/components/community/PostCard';
import { Button } from '@/components/ui/Button';
import { CATEGORY_LABELS } from '@/types';

export default function RecruitmentPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(nickname)')
        .eq('category', 'recruitment')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setPosts(data || []);
      setLoading(false);
    };

    fetchPosts();
  }, []);

  return (
    <div className="bg-bg-primary">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gold/10 to-gold-light/10 border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              👔 구인구직
            </h1>
            <p className="text-lg text-text-secondary mb-6">
              PC방 관련 일자리를 찾거나 인력을 모집하세요
            </p>
            <Link href="/community/new?category=recruitment">
              <Button variant="primary" size="lg">
                채용공고 올리기
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12">
            <div className="bg-bg-secondary/50 border border-border-light rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gold mb-2">{posts.length}</div>
              <div className="text-text-secondary">채용공고</div>
            </div>
            <div className="bg-bg-secondary/50 border border-border-light rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gold mb-2">24H</div>
              <div className="text-text-secondary">신속한 응답</div>
            </div>
            <div className="bg-bg-secondary/50 border border-border-light rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gold mb-2">100%</div>
              <div className="text-text-secondary">안전거래</div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Postings */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            채용공고 목록
          </h2>
          <div className="flex gap-2">
            <Link href="/community/recruitment">
              <Button variant="primary">전체</Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-secondary">
            로딩 중...
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-bg-secondary border border-border-light rounded-lg p-8 inline-block">
              <p className="text-text-secondary mb-4">
                현재 게시된 채용공고가 없습니다.
              </p>
              <Link href="/community/new?category=recruitment">
                <Button variant="primary">
                  첫 채용공고 올리기
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* How to Use */}
      <section className="bg-bg-secondary border-t border-border-light py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-text-primary mb-8 text-center">
            이용 방법
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                채용공고 등록
              </h3>
              <p className="text-text-secondary">
                구인구직 카테고리에서 채용공고를 작성하고 등록합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                지원자 연락
              </h3>
              <p className="text-text-secondary">
                지원자들과 댓글로 커뮤니케이션하고 면접을 진행합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                채용 완료
              </h3>
              <p className="text-text-secondary">
                적합한 인력을 찾아 성공적으로 채용을 완료합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
