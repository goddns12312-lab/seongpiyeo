import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/server';
import { PostCard } from '@/components/community/PostCard';
import { Button } from '@/components/ui/Button';
import { CATEGORY_LABELS } from '@/types';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: 'PC방 창업 커뮤니티 | 성인PC 사업정보 공유 | 성피요',
  description: '성인PC방 창업자들이 모여 경험과 정보를 공유하는 커뮤니티. 창업팁, 인테리어, 장비정보, 자유로운 질문과 답변을 나누는 공간입니다.',
  keywords: ['PC방커뮤니티', 'PC방창업정보', '성인PC사업', '피씨방운영팁', 'PC방인테리어', 'PC방장비', '사업정보공유'],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/community`,
  },
  openGraph: {
    title: 'PC방 창업 커뮤니티 | 성피요',
    description: '성인PC방 창업자들을 위한 경험 공유 및 정보 커뮤니티',
    type: 'website',
    url: `${SITE_CONFIG.url}/community`,
    locale: 'ko_KR',
    images: [
      {
        url: `${SITE_CONFIG.url}/423432.png`,
        width: 1200,
        height: 630,
        alt: '성피요 PC방 커뮤니티',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PC방 창업 커뮤니티',
    description: '성인PC방 창업 정보 커뮤니티',
    images: [`${SITE_CONFIG.url}/423432.png`],
  },
};

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function CommunityPage({ searchParams }: Props) {
  const params = await searchParams;
  const filterCategory = params.category as keyof typeof CATEGORY_LABELS | undefined;

  const supabase = await createClient();

  let query = supabase
    .from('posts')
    .select('*, profiles(nickname)')
    .order('created_at', { ascending: false });

  // 카테고리 필터링
  if (filterCategory) {
    query = query.eq('category', filterCategory);
  }

  const { data: posts } = await query;

  // Group posts by category
  const postsByCategory: Record<string, typeof posts> = {};
  posts?.forEach((post) => {
    if (!postsByCategory[post.category]) {
      postsByCategory[post.category] = [];
    }
    postsByCategory[post.category].push(post);
  });

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_CONFIG.url}/community`,
    name: 'PC방 창업 커뮤니티 | 성인PC 정보공유',
    description: '성인PC방 창업자들이 모여 경험과 정보를 공유하는 커뮤니티',
    url: `${SITE_CONFIG.url}/community`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: (posts?.slice(0, 10) || []).map((post, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE_CONFIG.url}/community/${post.id}`,
        name: post.title,
        description: `${CATEGORY_LABELS[post.category as keyof typeof CATEGORY_LABELS] || post.category}`,
      })),
    },
  };

  return (
    <div className="bg-bg-primary">
      <Script
        id="community-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      {/* Header */}
      <section className="bg-bg-secondary border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-text-primary">PC방 창업 커뮤니티 | 성인PC 정보공유</h1>
            <Link href="/community/new">
              <Button variant="primary">게시글 작성</Button>
            </Link>
          </div>
          <p className="text-text-secondary">
            PC방 관련 정보를 공유하고 경험을 나누세요.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {filterCategory ? (
          // 특정 카테고리만 표시
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              {CATEGORY_LABELS[filterCategory]}
            </h2>

            {postsByCategory[filterCategory] && postsByCategory[filterCategory].length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {postsByCategory[filterCategory].map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <p>게시글이 없습니다.</p>
                <Link href="/community/new">
                  <Button variant="primary" size="lg" className="mt-4">
                    첫 게시글 작성하기
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          // 모든 카테고리 표시
          (Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((category) => (
            <div key={category} className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                {CATEGORY_LABELS[category]}
              </h2>

              {postsByCategory[category] && postsByCategory[category].length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {postsByCategory[category].map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  게시글이 없습니다.
                </div>
              )}

              <div className="border-b border-border-light" />
            </div>
          ))
        )}

        {!filterCategory && (!posts || posts.length === 0) && (
          <div className="text-center py-12 text-text-secondary">
            <p>아직 게시글이 없습니다.</p>
            <Link href="/community/new">
              <Button variant="primary" size="lg" className="mt-4">
                첫 게시글 작성하기
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
