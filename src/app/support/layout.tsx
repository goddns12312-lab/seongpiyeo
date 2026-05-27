import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '고객센터 | PC방 매물 거래',
  description: 'PC방 매물 거래 플랫폼의 고객센터. FAQ, 문의사항, 지원을 받으세요.',
  alternates: {
    canonical: 'https://pc365.kr/support',
  },
  openGraph: {
    title: '고객센터 | PC방 매물 거래',
    description: 'PC방 매물 거래 플랫폼의 고객센터. FAQ, 문의사항, 지원을 받으세요.',
    type: 'website',
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
