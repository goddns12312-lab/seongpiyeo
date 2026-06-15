import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '중고물품 수정',
  robots: { index: false, follow: false },
};

export default function EditSecondhandLayout({ children }: { children: React.ReactNode }) {
  return children;
}
