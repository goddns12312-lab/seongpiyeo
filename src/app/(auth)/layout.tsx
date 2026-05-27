import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 | PC방 거래 플랫폼',
  description: '계정에 로그인하여 매물을 등록하고 커뮤니티에 참여하세요.',
  robots: {
    index: false, // 인증 페이지는 검색에서 제외
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
