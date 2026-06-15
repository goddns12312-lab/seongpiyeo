import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '게시글 수정',
  robots: { index: false, follow: false },
};

export default function EditCommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
