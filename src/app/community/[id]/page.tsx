import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { SITE_CONFIG } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const supabase = await createClient();
    const { data: post } = await supabase
      .from('posts')
      .select('id, title, content, created_at, status')
      .eq('id', params.id)
      .single();

    if (!post || post.status !== 'active') {
      notFound();
    }

    const cleanContent = post.content
      .replace(/<[^>]*>/g, '')
      .replace(/\n/g, ' ')
      .trim();
    const description = cleanContent.substring(0, 160);
    const url = `${SITE_CONFIG.url}/community/${params.id}`;

    return {
      title: `${post.title} | 자유게시판`,
      description: description || '성인PC 관련 정보를 공유하는 커뮤니티 게시글',
      keywords: ['성인PC', '커뮤니티', '정보공유', post.title],
      robots: {
        index: true,
        follow: true,
      },
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: post.title,
        description: description,
        type: 'article',
        url: url,
        siteName: SITE_CONFIG.businessName,
        locale: 'ko_KR',
        publishedTime: post.created_at,
        images: [
          {
            url: `${SITE_CONFIG.url}/og-community.png`,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: description,
        images: [`${SITE_CONFIG.url}/og-community.png`],
      },
    };
  } catch (error) {
    console.error('[generateMetadata] 오류:', error);
    notFound();
  }
}

export default async function DetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, content, created_at, status, category')
    .eq('id', params.id)
    .eq('status', 'active')
    .single();

  if (error || !post) {
    notFound();
  }

  // Get related posts (same category, max 4, exclude current post)
  const { data: relatedPosts } = await supabase
    .from('posts')
    .select('id, title, category, created_at')
    .eq('status', 'active')
    .neq('id', params.id)
    .order('created_at', { ascending: false })
    .limit(4);

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back Button */}
        <Link href="/community" className="inline-flex items-center text-gold hover:text-gold-light mb-6">
          ← 목록으로
        </Link>

        {/* Content */}
        <article>
          <h1 className="text-4xl font-bold text-text-primary mb-4">{post.title}</h1>
          
          <div className="flex flex-wrap gap-4 text-text-secondary text-sm mb-8 pb-8 border-b border-border-light">
            <span>작성자: 작성자</span>
            <span>작성일: {new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
            <span>조회수: 0</span>
            <span>댓글: 0</span>
          </div>

          <div className="prose prose-invert max-w-none mb-12 text-text-secondary">
            {post.content.split('\n').map((line, idx) => (
              <div key={idx}>
                {line.startsWith('## ') ? (
                  <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">
                    {line.replace('## ', '')}
                  </h2>
                ) : line.startsWith('- ') ? (
                  <li className="ml-6 my-2">{line.replace('- ', '')}</li>
                ) : (
                  <p className="my-2">{line}</p>
                )}
              </div>
            ))}
          </div>

          {/* Comment Section */}
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-12">
            <h3 className="text-xl font-bold text-text-primary mb-4">댓글 (0)</h3>

            <div className="space-y-4 mb-6 text-text-secondary text-sm">
              첫 번째 댓글을 달아보세요!
            </div>

            {/* Comment Input */}
            <textarea
              placeholder="댓글을 입력하세요..."
              className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 mb-3"
              rows={3}
            />
            <Button variant="primary">댓글 작성</Button>
          </div>

          {/* Related Posts Widget */}
          {relatedPosts && relatedPosts.length > 0 && (
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">📰 다른 게시글</h2>
              <div className="space-y-3">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/community/${relatedPost.id}`}
                    className="block group p-3 border border-border-light rounded hover:border-gold hover:bg-bg-primary transition-all"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-text-primary font-semibold text-sm line-clamp-2 group-hover:text-gold transition-colors">
                          {relatedPost.title}
                        </h3>
                        <p className="text-text-muted text-xs mt-1">
                          {new Date(relatedPost.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-text-secondary text-xs">
                          조회 0
                        </p>
                        <p className="text-text-secondary text-xs">
                          댓글 0
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/community" className="block mt-4">
                <button className="w-full bg-bg-tertiary hover:bg-gold/10 text-text-primary font-semibold py-2 rounded transition-colors text-sm">
                  전체 게시글 보기
                </button>
              </Link>
            </div>
          )}
        </article>

        <Script
          id={`article-schema-${params.id}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              '@id': `${SITE_CONFIG.url}/community/${params.id}`,
              headline: post.title,
              description: post.content.substring(0, 160),
              author: {
                '@type': 'Person',
                name: '작성자',
              },
              datePublished: post.created_at,
              dateModified: post.created_at,
              url: `${SITE_CONFIG.url}/community/${params.id}`,
              interactionStatistic: [
                {
                  '@type': 'InteractionCounter',
                  interactionType: 'https://schema.org/ViewAction',
                  userInteractionCount: 0,
                },
                {
                  '@type': 'InteractionCounter',
                  interactionType: 'https://schema.org/CommentAction',
                  userInteractionCount: 0,
                },
              ],
            }),
          }}
        />
        <Script
          id={`breadcrumb-schema-${params.id}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: '홈',
                  item: SITE_CONFIG.url,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: '커뮤니티',
                  item: `${SITE_CONFIG.url}/community`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: post.title,
                  item: `${SITE_CONFIG.url}/community/${params.id}`,
                },
              ],
            }),
          }}
        />
      </div>
    </div>
  );
}
