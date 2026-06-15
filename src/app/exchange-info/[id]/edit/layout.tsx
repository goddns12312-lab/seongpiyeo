import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '거래정보 수정',
  robots: { index: false, follow: false },
};

export default function EditExchangeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
