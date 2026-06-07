import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { SITE_CONFIG } from '@/lib/site';
import { createClient } from '@/lib/supabase/server';
import ExchangeDetailClient from './exchange-detail-client';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const supabase = await createClient();
    const { data: posts } = await supabase
      .from('posts')
      .select('id, title, content, category, created_at, status')
      .eq('id', params.id)
      .eq('category', 'exchange')
      .limit(1);

    const post = posts?.[0];

    if (!post || post.status === 'deleted' || post.status !== 'active') {
      notFound();
    }

    const cleanContent = (post.content || '')
      .replace(/<[^>]*>/g, '')
      .replace(/\n/g, ' ')
      .trim();
    const description = cleanContent.substring(0, 160);
    const url = `${SITE_CONFIG.url}/exchange-info/${params.id}`;

    return {
      title: `${post.title} | 환수정보`,
      description: description || '성인PC 환수율 및 운영정보 게시글',
      keywords: ['성인PC', '환수정보', '운영정보', post.title],
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
            url: `${SITE_CONFIG.url}/og-image.png`,
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
        images: [`${SITE_CONFIG.url}/og-image.png`],
      },
    };
  } catch (error) {
    console.error('[generateMetadata] 오류:', error);
    notFound();
  }
}

export default async function DetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', params.id)
    .eq('category', 'exchange')
    .limit(1);

  const post = posts?.[0];

  if (error || !post || post.status !== 'active') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back Button */}
        <Link href="/exchange-info" className="inline-flex items-center text-gold hover:text-gold-light mb-6">
          ← 목록으로
        </Link>

        {/* Content */}
        <article>
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl font-bold text-text-primary flex-1">{post.title}</h1>
            <ExchangeDetailClient postId={params.id} />
          </div>

          <div className="flex flex-wrap gap-4 text-text-secondary text-sm mb-8 pb-8 border-b border-border-light">
            <span>작성자: 작성자</span>
            <span>작성일: {new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
            <span>조회수: {post.view_count || 0}</span>
            <span>댓글: 0</span>
          </div>

          <div className="prose prose-invert max-w-none mb-12 text-text-secondary">
            {(post.content || '').split('\n').map((line: string, idx: number) => (
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
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
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
        </article>

        <Script
          id={`article-schema-${params.id}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              '@id': `${SITE_CONFIG.url}/exchange-info/${params.id}`,
              headline: post.title,
              description: (post.content || '').substring(0, 160),
              author: {
                '@type': 'Person',
                name: '작성자',
              },
              datePublished: post.created_at,
              dateModified: post.created_at,
              url: `${SITE_CONFIG.url}/exchange-info/${params.id}`,
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
                  name: '환수정보',
                  item: `${SITE_CONFIG.url}/exchange-info`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: post.title,
                  item: `${SITE_CONFIG.url}/exchange-info/${params.id}`,
                },
              ],
            }),
          }}
        />
      </div>
    </div>
  );
}
