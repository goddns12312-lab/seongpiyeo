import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createPublicClient } from '@/lib/supabase/public';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { getBannerImageUrl, getOptimizedImageUrl } from '@/lib/image-url';
import { Listing, Banner, REGIONS } from '@/types';
import { SITE_CONFIG } from '@/lib/site';
import { buildOgImageEntry, getOgImageUrl } from '@/lib/seo-assets';
import { getJobPublicPath } from '@/lib/jobs-data';
import { getCachedRegionCounts } from '@/lib/listing-queries';

import { buildHomeSeoMetadata } from '@/lib/seo-metadata';
import { getActiveListingCount } from '@/lib/listing-queries';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const listingCount = await getActiveListingCount();
  const meta = buildHomeSeoMetadata(listingCount);
  const ogImage = getOgImageUrl();

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    authors: [{ name: '성피요', url: SITE_CONFIG.url }],
    creator: '성피요',
    publisher: '성피요',
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
      naver: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || '',
    },
    alternates: {
      canonical: SITE_CONFIG.url,
    },
    openGraph: {
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
      type: 'website',
      url: SITE_CONFIG.url,
      siteName: SITE_CONFIG.businessName,
      locale: 'ko_KR',
      images: [buildOgImageEntry('성피요 성인PC 매물 플랫폼')],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
      images: [ogImage],
    },
  };
}

export default async function HomePage() {
  const supabase = createPublicClient();

  // 병렬 데이터 조회
  const [
    { data: topBanners },
    { data: bottomBanners },
    { count: listingCount },
    { data: latestListings },
    { data: latestJobs },
    { data: latestPosts },
    regionCounts,
  ] = await Promise.all([
    supabase
      .from('banners')
      .select('id, title, image_url, link_url, order_num')
      .eq('is_active', true)
      .eq('position', 'top')
      .order('order_num', { ascending: true }),
    supabase
      .from('banners')
      .select('id, title, image_url, link_url, order_num')
      .eq('is_active', true)
      .eq('position', 'bottom')
      .order('order_num', { ascending: true }),
    supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('main_image_url', 'is', null),
    supabase
      .from('listings')
      .select('id, title, price, region, thumbnail_url, main_image_url, price_type')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('jobs')
      .select('id, slug, title, region, category')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('posts')
      .select('id, title, category, view_count, status, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6),
    getCachedRegionCounts(),
  ]);

  const baseUsers = 2859;
  const startDate = new Date('2026-01-01T00:00:00+09:00');
  const now = new Date();
  const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const userCount = baseUsers + Math.floor(daysPassed * 59);

  return (
    <div className="page-shell">
      {topBanners && topBanners.length > 0 && (
        <link
          rel="preload"
          as="image"
          href={getBannerImageUrl(topBanners[0].image_url)}
          fetchPriority="high"
        />
      )}
      {/* Top Banners */}
      {topBanners && topBanners.length > 0 && (
        <section className="border-b border-border-light relative py-5 md:py-6" aria-label="프로모션 배너">
          <div className="w-full px-6 lg:px-8 max-w-[1650px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {topBanners.slice(0, 2).map((banner: Banner, index: number) => (
                <Link
                  key={banner.id}
                  href={banner.link_url || '#'}
                  className="block rounded-lg overflow-hidden bg-bg-tertiary"
                  aria-label={banner.title || '프로모션 배너'}
                >
                  <Image
                    src={getBannerImageUrl(banner.image_url)}
                    alt={banner.title || '프로모션 배너'}
                    width={1509}
                    height={430}
                    className="w-full h-auto"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={75}
                    priority={index === 0}
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Compact Hero Section */}
      <section className="page-hero border-b-0">
        <div className="page-hero-inner-wide !py-8 md:!py-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3 leading-tight tracking-tight">
              성인PC · 성인피씨 매매/구인 플랫폼
            </h1>
            <p className="text-text-secondary text-sm md:text-base mb-8">
              전국 성인PC 매물 · 구인구직 · 창업정보를 한곳에서
            </p>

            <div className="grid grid-cols-3 gap-3 md:gap-4 py-5 px-4 md:px-6 surface-card max-w-2xl mx-auto mb-8 border-gold/25">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-gold-dark dark:text-gold tabular-nums">{listingCount || 0}</p>
              <p className="text-text-secondary text-xs md:text-sm font-medium">매물</p>
            </div>
            <div className="text-center border-l border-r border-gold/30">
              <p className="text-2xl md:text-3xl font-bold text-gold-dark dark:text-gold tabular-nums">{userCount || 0}</p>
              <p className="text-text-secondary text-xs md:text-sm font-medium">회원</p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-gold-dark dark:text-gold">24/7</p>
              <p className="text-text-secondary text-xs md:text-sm font-medium">운영</p>
            </div>
          </div>

          {/* CTA Buttons - 3개 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <Link href="/listings" className="btn-primary btn-lg">
              매물 보기
            </Link>
            <Link href="/listings/new" className="btn-secondary btn-lg">
              매물 등록
            </Link>
            <Link href="/jobs/new" className="btn-secondary btn-lg">
              구인 등록
            </Link>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <a
              href="https://t.me/korea24s"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border-2 border-gold rounded-xl px-6 py-3 text-gold-dark dark:text-gold hover:bg-gold hover:text-bg-primary font-semibold transition duration-300 text-center"
              aria-label="텔레그램 문의 (새 창)"
            >
              텔레그램 문의
            </a>
            <a
              href="https://t.me/pc365_112"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border-2 border-red-600 rounded-xl px-6 py-3 text-red-700 dark:text-red-400 hover:bg-red-600 hover:text-white font-semibold transition duration-300 text-center"
              aria-label="단속 및 진상 단톡방 입장 (새 창)"
            >
              단속 및 진상 단톡방 입장
            </a>
          </div>
        </div>
        </div>
      </section>


      {/* Latest Listings Section */}
      {latestListings && latestListings.length > 0 && (
        <section className="home-section">
          <div className="home-section-inner">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary">최신 매물</h2>
              <Link href="/listings" className="text-gold-dark dark:text-gold text-sm font-medium hover:underline transition-colors">
                전체 보기 →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
              {latestListings.map((listing: any) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group relative rounded-2xl overflow-hidden surface-card-hover hover-lift"
                >
                  <div className="relative w-full aspect-[4/3] bg-bg-secondary">
                    {listing.main_image_url || listing.thumbnail_url ? (
                      <Image
                        src={getOptimizedImageUrl(listing.main_image_url || listing.thumbnail_url, 320, 70)}
                        alt={listing.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        quality={70}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-bg-tertiary flex items-center justify-center text-text-muted text-xs">
                        이미지 없음
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                    <p className="text-xs font-semibold truncate">{listing.title}</p>
                    <p className="text-xs text-white/80">{formatPrice(listing.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Region Hub Links */}
      {regionCounts && Object.values(regionCounts).some((count) => count > 0) && (
        <section className="home-section">
          <div className="home-section-inner">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary">지역별 매물</h2>
              <Link href="/listings" className="text-gold-dark dark:text-gold text-sm font-medium hover:underline transition-colors">
                전체 보기 →
              </Link>
            </div>
            <nav aria-label="지역별 매물" className="flex flex-wrap gap-2">
              {REGIONS.filter((region) => (regionCounts[region] || 0) > 0)
                .sort((a, b) => (regionCounts[b] || 0) - (regionCounts[a] || 0))
                .map((region) => (
                  <Link
                    key={region}
                    href={`/listings/region/${encodeURIComponent(region)}`}
                    className="px-3 py-2 rounded-xl border border-border-light text-sm text-text-secondary hover:border-gold hover:text-gold transition-colors"
                  >
                    {region} ({regionCounts[region]})
                  </Link>
                ))}
            </nav>
          </div>
        </section>
      )}

      {/* Latest Jobs Section */}
      {latestJobs && latestJobs.length > 0 && (
        <section className="home-section">
          <div className="home-section-inner">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary">최신 구인공고</h2>
              <Link href="/jobs" className="text-gold-dark dark:text-gold text-sm font-medium hover:underline transition-colors">
                전체 보기 →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestJobs.filter((job: { slug?: string | null }) => job.slug).map((job: any) => (
                <Link
                  key={job.id}
                  href={getJobPublicPath(job.slug)}
                  className="p-4 home-card hover-lift"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-text-primary font-semibold text-sm line-clamp-2">{job.title}</p>
                      <p className="text-text-secondary text-xs mt-1">{job.region}</p>
                    </div>
                    <Badge className="ml-2" variant="secondary">
                      {job.category === 'recruitment' ? '채용' : '구직'}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Posts Section */}
      {latestPosts && latestPosts.length > 0 && (
        <section className="home-section">
          <div className="home-section-inner">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary">최신 게시글</h2>
              <Link href="/community" className="text-gold-dark dark:text-gold text-sm font-medium hover:underline transition-colors">
                전체 보기 →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestPosts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/community/${post.id}`}
                  className="p-4 home-card hover-lift"
                >
                  <p className="text-text-primary font-semibold text-sm line-clamp-2 mb-3">{post.title}</p>
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>{post.category}</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-text-secondary">
                    <span>👁 {post.view_count || 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="home-section relative">
        <div className="home-section-inner">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-text-primary mb-2">
            왜 <span className="text-gold-dark dark:text-gold">{SITE_CONFIG.businessName}</span>를 선택할까요?
          </h2>
          <p className="text-center text-text-secondary text-sm md:text-base mb-8 max-w-2xl mx-auto">
            안전하고 투명한 성인PC 거래 플랫폼
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                title: '안전한 거래',
                desc: '회원 인증 및 신뢰도 시스템'
              },
              {
                icon: 'M13 10V3L4 14h7v7l9-11h-7z',
                title: '빠른 매칭',
                desc: '지역별 검색으로 즉시 발견'
              },
              {
                icon: 'M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zM5 20a6 6 0 0110-12v12a6 6 0 01-10 0z',
                title: '활발한 커뮤니티',
                desc: '전문가 조언과 정보 공유'
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="home-card p-4 md:p-5 text-center hover-lift"
              >
                <div className="bg-gold/20 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gold-dark dark:text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-text-primary font-semibold text-sm md:text-base mb-1">{feature.title}</h3>
                <p className="text-text-secondary text-xs md:text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Banners */}
      {bottomBanners && bottomBanners.length > 0 && (
        <section className="border-t border-border-light relative py-5 md:py-6" aria-label="하단 배너">
          <div className="w-full px-6 lg:px-8 max-w-[1650px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {bottomBanners.slice(0, 2).map((banner: Banner) => (
                <Link
                  key={banner.id}
                  href={banner.link_url || '#'}
                  className="block rounded-lg overflow-hidden bg-bg-tertiary"
                  aria-label={banner.title || '하단 배너'}
                >
                  <Image
                    src={getBannerImageUrl(banner.image_url)}
                    alt={banner.title || '하단 배너'}
                    width={1509}
                    height={430}
                    className="w-full h-auto"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={75}
                    loading="lazy"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
