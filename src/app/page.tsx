import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { Listing, Banner } from '@/types';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: '성인PC 성인피씨 성인피시 창업 정보 거래 | 성피요',
  description: '성인PC 성인피씨 성인피시 창업 정보와 매물 거래를 한곳에서! 안전한 성인PC방 매매 플랫폼 성피요',
  keywords: ['성인PC', '성인피씨', '성인피시', '성인피씨창업', 'PC방창업정보', 'PC방매물', '성인피시방', '피씨방', 'PC방창업', 'PC방거래', '성인PC방매물', 'PC방임대', '성인피씨방'],
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
    google: 'google-site-verification-code',
    naver: 'naver-site-verification-code',
  },
  alternates: {
    canonical: SITE_CONFIG.url,
    languages: {
      'ko': SITE_CONFIG.url,
      'x-default': SITE_CONFIG.url,
    },
  },
  openGraph: {
    title: '성인PC 성인피씨 성인피시 창업 정보 | 성피요',
    description: '전국 성인PC 성인피씨 성인피시 매물 거래 및 창업 정보 커뮤니티',
    type: 'website',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [
      {
        url: `${SITE_CONFIG.url}/423432.png`,
        width: 1200,
        height: 630,
        alt: '성피요 성인PC 매물 플랫폼',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '성인PC 성인피씨 성인피시 창업',
    description: '성인PC 성인피씨 성인피시 창업 정보 및 매물 거래',
    images: [`${SITE_CONFIG.url}/423432.png`],
  },
};

export default async function HomePage() {
  const supabase = await createClient();

  // Get active banners
  const { data: topBanners } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .eq('position', 'top')
    .order('order_num', { ascending: true });

  const { data: bottomBanners } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .eq('position', 'bottom')
    .order('order_num', { ascending: true });

  // Get stats
  const { count: listingCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('main_image_url', 'is', null);

  // 테스트용: 회원 수 동적 증가
  const baseUsers = 2859;
  const startDate = new Date('2026-01-01');
  const now = new Date();
  const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const userCount = baseUsers + Math.floor(daysPassed * 59); // 하루 59명씩 증가

  // FAQ Schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '성인PC 성인피씨 매물은 어떻게 거래하나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '성피요에서는 성인PC 성인피씨 창업에 필요한 모든 매물 정보를 제공합니다. 지역별로 성인피씨방 매매 및 임대 정보를 쉽게 찾을 수 있습니다.',
        },
      },
      {
        '@type': 'Question',
        name: '성인피씨창업에 필요한 정보는?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '성피요는 성인피시 창업을 위한 매물 정보, 커뮤니티, 상담 등 모든 정보를 제공하는 전문 플랫폼입니다.',
        },
      },
      {
        '@type': 'Question',
        name: '성피요는 안전한가요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '성피요는 회원 인증, 신뢰도 시스템, 거래 내역 기록을 통해 안전한 성인PC 거래 환경을 제공합니다.',
        },
      },
    ],
  };


  return (
    <div className="bg-bg-primary">
      {/* JSON-LD Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Top Banner */}
      {topBanners && topBanners.length > 0 && (
        <section className="bg-gradient-to-b from-bg-secondary via-bg-secondary to-bg-primary border-b border-gold/30">
          <div className="max-w-full mx-auto px-4 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {topBanners.slice(0, 2).map((banner: Banner, idx: number) => (
                <Link
                  key={banner.id}
                  href={banner.link_url || '#'}
                  className="group relative rounded-2xl overflow-hidden shadow-lg block transition-shadow duration-300 hover:shadow-xl"
                >
                  <div className="relative w-full aspect-video bg-bg-tertiary">
                    <Image
                      src={banner.image_url}
                      alt={`${banner.title} - 성인PC 성피요 광고`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover brightness-100"
                      priority={false}
                      quality={80}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 630'%3E%3Crect fill='%23222222' width='1200' height='630'/%3E%3C/svg%3E"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="max-w-full mx-auto px-4 lg:px-8 py-14 md:py-20 relative overflow-hidden">

        <div className="text-center mb-14">
          <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight" style={{
            background: 'linear-gradient(135deg, rgb(243, 244, 246) 0%, rgb(200, 169, 107) 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            성인PC 성인피씨 성인피시 창업 | {SITE_CONFIG.businessName}
          </h1>
          <p className="text-text-secondary text-lg md:text-xl font-light mb-10 max-w-3xl mx-auto leading-relaxed">
            {SITE_CONFIG.tagline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/listings">
              <Button variant="primary" size="lg" className="text-lg font-semibold shadow-xl hover:shadow-gold/50">
                ▶ 매물 보기
              </Button>
            </Link>
            <Link href="/listings/new">
              <Button variant="secondary" size="lg" className="text-lg font-semibold shadow-xl hover:shadow-gold/50">
                ✚ 매물 등록
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-5 py-12 px-6 md:px-10 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border-2 border-gold/40 rounded-3xl max-w-3xl mx-auto glass backdrop-blur-sm shadow-xl shadow-gold/20">
          <div className="text-center">
            <p className="text-5xl font-black text-gold mb-3 drop-shadow-lg">{listingCount || 0}</p>
            <p className="text-text-secondary text-sm font-semibold uppercase tracking-wider">활성 매물</p>
          </div>
          <div className="text-center border-l border-r border-gold/30">
            <p className="text-5xl font-black text-gold mb-3 drop-shadow-lg">{userCount || 0}</p>
            <p className="text-text-secondary text-sm font-semibold uppercase tracking-wider">회원 수</p>
          </div>
          <div className="text-center">
            <p className="text-5xl font-black text-gold mb-3 drop-shadow-lg">24/7</p>
            <p className="text-text-secondary text-sm font-semibold uppercase tracking-wider">운영</p>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="max-w-full mx-auto px-4 lg:px-8 py-16 border-t border-gold/20 relative">

        <h2 className="text-4xl md:text-5xl font-bold text-center text-text-primary mb-4">
          왜 <span className="text-gold">{SITE_CONFIG.businessName}</span>로 성인PC 창업을 하나요?
        </h2>
        <p className="text-center text-text-secondary font-semibold mb-14 max-w-2xl mx-auto text-base">
          🏆 성인피씨, 성인피시 안전한 거래 환경
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 max-w-5xl mx-auto">
          {[
            {
              icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
              title: '안전한 거래',
              desc: '회원 인증 및 신뢰도 시스템으로 안전한 거래 환경을 제공합니다.'
            },
            {
              icon: 'M13 10V3L4 14h7v7l9-11h-7z',
              title: '빠른 매칭',
              desc: '지역별 검색으로 원하는 매물을 빠르게 찾을 수 있습니다.'
            },
            {
              icon: 'M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zM5 20a6 6 0 0110-12v12a6 6 0 01-10 0z',
              title: '활발한 커뮤니티',
              desc: '경험자들의 조언과 정보를 나눌 수 있는 커뮤니티입니다.'
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              className="group relative p-8 rounded-3xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-gold/40 hover:border-gold/80 transition-all duration-300 hover:shadow-lg glass overflow-hidden cursor-pointer"
            >
              <div className="bg-gradient-to-br from-gold/50 to-gold/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={feature.icon} />
                </svg>
              </div>

              <h3 className="text-text-primary font-black mb-3 text-xl">{feature.title}</h3>
              <p className="text-text-secondary text-sm font-medium leading-relaxed">
                {feature.desc}
              </p>

            </div>
          ))}
        </div>
      </section>

      {/* Bottom Banners */}
      {bottomBanners && bottomBanners.length > 0 && (
        <section className="bg-gradient-to-t from-gold/10 via-bg-secondary to-bg-primary border-t-2 border-gold/30 relative py-10">

          <div className="max-w-full mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bottomBanners.map((banner: Banner, idx: number) => (
                <Link
                  key={banner.id}
                  href={banner.link_url || '#'}
                  className="group relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl border-2 border-gold/30 hover:border-gold/60"
                >
                  <div className="relative w-full aspect-video bg-bg-tertiary">
                    <Image
                      src={banner.image_url}
                      alt={`${banner.title} - 성인PC 성피요 광고`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-all duration-300 brightness-100"
                      quality={80}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 630'%3E%3Crect fill='%23222222' width='1200' height='630'/%3E%3C/svg%3E"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
