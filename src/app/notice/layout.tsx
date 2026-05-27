import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '공지사항 | PC방 거래 플랫폼',
  description: '플랫폼 공지사항, 업데이트 소식, 중요 알림을 확인하세요.',
  alternates: {
    canonical: 'https://pc365.kr/notice',
  },
  openGraph: {
    title: '공지사항 | PC방 거래 플랫폼',
    description: '플랫폼 공지사항, 업데이트 소식, 중요 알림을 확인하세요.',
    type: 'website',
  },
};

export default function NoticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
