import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SkipLink } from '@/components/layout/SkipLink';
import { SITE_CONFIG } from '@/lib/site';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { buildWebsiteSchema, buildOrganizationSchema } from '@/lib/seo-schema';
import { getOgImageUrl } from '@/lib/seo-assets';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#c8a96b',
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://xn--oj4bo2hu1o.com'
  ),
  title: {
    default: `성인PC 성인피씨 성인피시 창업 정보 | ${SITE_CONFIG.businessName}`,
    template: `%s | ${SITE_CONFIG.businessName}`,
  },
  description: SITE_CONFIG.description,
  keywords: ['성인PC', '성인피씨', '성인피시', '성인피씨창업', 'PC방창업', '성인PC매물', '성피요', '매물거래', '커뮤니티'],
  authors: [{ name: SITE_CONFIG.managerName }],
  creator: SITE_CONFIG.businessName,
  publisher: SITE_CONFIG.businessName,
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    other: {
      'bingbot': 'index, follow',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.businessName,
    title: `성인PC 성인피씨 성인피시 창업 | ${SITE_CONFIG.businessName}`,
    description: SITE_CONFIG.description,
    images: [
      {
        url: getOgImageUrl(),
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.businessName} - PC방 매물 거래 플랫폼`,
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `성인PC 성인피씨 성인피시 창업 | ${SITE_CONFIG.businessName}`,
    description: SITE_CONFIG.description,
    images: [getOgImageUrl()],
  },
  alternates: {
    canonical: SITE_CONFIG.url,
    languages: {
      'ko-KR': SITE_CONFIG.url,
      'x-default': SITE_CONFIG.url,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    naver: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || '',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/logo-icon.png', type: 'image/png' }],
    apple: [{ url: '/logo-icon.png', type: 'image/png', sizes: '180x180' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const theme = saved || systemPreference;
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#c8a96b" />
        <meta name="format-detection" content="telephone=yes" />
        <link rel="alternate" hrefLang="ko-KR" href={SITE_CONFIG.url} />
        <link rel="alternate" hrefLang="x-default" href={SITE_CONFIG.url} />
        <link rel="dns-prefetch" href="https://cdn.imweb.me" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="" />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
          </>
        )}

        {/* JSON-LD Structured Data - Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildOrganizationSchema()),
          }}
        />

        {/* JSON-LD Structured Data - Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildWebsiteSchema()),
          }}
        />

      </head>
      <body className="bg-bg-primary">
        <ThemeProvider>
          <SkipLink />
          <Header />
          <main id="main-content" className="min-h-screen" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
