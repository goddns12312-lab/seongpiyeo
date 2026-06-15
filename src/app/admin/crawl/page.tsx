import Link from 'next/link';

export default function DisabledCrawlPage() {
  return (
    <div className="bg-bg-primary min-h-screen py-12 flex items-center justify-center">
      <div className="text-center">
        <p className="text-text-secondary mb-4">크롤링 기능은 비활성화되었습니다.</p>
        <Link href="/admin" className="text-gold hover:underline">
          관리자 대시보드로
        </Link>
      </div>
    </div>
  );
}
