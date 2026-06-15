import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '매물 수정',
  robots: { index: false, follow: false },
};

export default function EditListingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
