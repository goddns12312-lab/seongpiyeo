import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SITE_CONFIG } from '@/lib/site';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#c8a96b',
};

export const metadata: Metadata = {
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
        url: `${SITE_CONFIG.url}/og-image.png`,
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
    images: [`${SITE_CONFIG.url}/twitter-image.png`],
  },
  alternates: {
    canonical: SITE_CONFIG.url,
    languages: {
      'ko': `${SITE_CONFIG.url}`,
      'en': `${SITE_CONFIG.url}/en`,
      'x-default': SITE_CONFIG.url,
    },
  },
  verification: {
    google: 'google-site-verification-code',
    naver: 'naver-site-verification-code',
  },
};

export const schemaOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': SITE_CONFIG.url,
  name: SITE_CONFIG.businessName,
  url: SITE_CONFIG.url,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_CONFIG.url}/423432.png`,
    width: 200,
    height: 200,
  },
  image: `${SITE_CONFIG.url}/og-image.png`,
  description: SITE_CONFIG.description,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    url: SITE_CONFIG.url,
  },
  address: {
    '@type': 'PostalAddress',
    addressRegion: SITE_CONFIG.region,
    addressCountry: 'KR',
  },
  founder: {
    '@type': 'Person',
    name: SITE_CONFIG.managerName,
  },
  sameAs: [
    // Add actual social media profiles when available
    // 'https://www.facebook.com/yourpage',
    // 'https://www.instagram.com/yourprofile',
    // 'https://www.youtube.com/@yourchannel',
  ],
  knowsAbout: [
    'PC방 매물',
    '성인PC',
    '피시방 창업',
    'PC방 거래',
    '매물 정보',
  ],
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
        <meta name="description" content={SITE_CONFIG.description} />
        <meta name="keywords" content={SITE_CONFIG.keywords} />
        <meta name="theme-color" content="#c8a96b" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large" />
        <meta name="bingbot" content="index, follow, max-image-preview:large" />
        <meta name="author" content={SITE_CONFIG.managerName} />
        <meta name="copyright" content={SITE_CONFIG.businessName} />
        <meta name="revisit-after" content="7 days" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="language" content="Korean" />
        <meta name="distribution" content="global" />
        <meta property="og:locale" content="ko_KR" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={SITE_CONFIG.businessName} />
        <meta name="application-name" content={SITE_CONFIG.businessName} />
        <meta name="msapplication-TileColor" content="#c8a96b" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="canonical" href={SITE_CONFIG.url} />
        <link rel="alternate" hrefLang="ko" href={SITE_CONFIG.url} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaOrganization),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              '@id': SITE_CONFIG.url,
              name: SITE_CONFIG.businessName,
              description: '성인PC 성인피씨 매매 및 창업 정보 플랫폼',
              url: SITE_CONFIG.url,
              telephone: SITE_CONFIG.phone,
              email: SITE_CONFIG.email,
              image: `${SITE_CONFIG.url}/og-image.png`,
              address: {
                '@type': 'PostalAddress',
                addressRegion: SITE_CONFIG.region,
                addressCountry: 'KR',
              },
              geo: {
                '@type': 'GeoShape',
                box: '33.1 124.5 43.0 131.9',
              },
              priceRange: '₩0',
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                  opens: '00:00',
                  closes: '23:59',
                },
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_CONFIG.businessName,
              url: SITE_CONFIG.url,
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${SITE_CONFIG.url}/listings?region={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
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
                  name: '성인PC 매물',
                  item: `${SITE_CONFIG.url}/listings`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: '구인구직',
                  item: `${SITE_CONFIG.url}/jobs`,
                },
                {
                  '@type': 'ListItem',
                  position: 4,
                  name: '중고장터',
                  item: `${SITE_CONFIG.url}/secondhand`,
                },
                {
                  '@type': 'ListItem',
                  position: 5,
                  name: '커뮤니티',
                  item: `${SITE_CONFIG.url}/community`,
                },
              ],
            }),
          }}
        />
      </head>
      <body className="bg-bg-primary">
        <ThemeProvider>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
