import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '중고장터 | PC방 기자재 거래',
  description: 'PC방 기자재 및 중고 물품 거래 플랫폼. PC, 의자, 모니터 등 중고 기기를 사고팔 수 있습니다.',
  keywords: ['중고PC', 'PC방기자재', '중고의자', '중고모니터', 'PC방용품'],
  alternates: {
    canonical: 'https://pc365.kr/secondhand',
  },
  openGraph: {
    title: '중고장터 | PC방 기자재 거래',
    description: 'PC방 기자재 및 중고 물품 거래 플랫폼. PC, 의자, 모니터 등 중고 기기를 사고팔 수 있습니다.',
    type: 'website',
  },
};

export default function SecondhandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
