import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-12 border-t border-border-light/60 bg-gradient-to-b from-bg-secondary via-bg-secondary to-bg-tertiary py-12 md:py-14">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-xl font-bold text-gold-dark dark:text-gold mb-4">
              {SITE_CONFIG.name}
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              {SITE_CONFIG.description}
            </p>
          </div>

          <div>
            <h4 className="text-text-primary font-semibold mb-4 text-xs uppercase tracking-widest">서비스</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/listings" className="text-text-secondary hover:text-gold-dark dark:hover:text-gold transition-colors">
                  매물 목록
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="text-text-secondary hover:text-gold-dark dark:hover:text-gold transition-colors">
                  구인구직
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-text-secondary hover:text-gold-dark dark:hover:text-gold transition-colors">
                  커뮤니티
                </Link>
              </li>
              <li>
                <Link href="/listings/new" className="text-text-secondary hover:text-gold-dark dark:hover:text-gold transition-colors">
                  매물 등록
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-text-primary font-semibold mb-4 text-xs uppercase tracking-widest">정보</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/guide" className="text-text-secondary hover:text-gold-dark dark:hover:text-gold transition-colors">
                  가이드
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-text-secondary hover:text-gold-dark dark:hover:text-gold transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/notice" className="text-text-secondary hover:text-gold-dark dark:hover:text-gold transition-colors">
                  공지사항
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-text-secondary hover:text-gold-dark dark:hover:text-gold transition-colors">
                  고객센터
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-text-primary font-semibold mb-4 text-xs uppercase tracking-widest">연락처</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li>담당자: {SITE_CONFIG.managerName}</li>
              <li>{SITE_CONFIG.phone}</li>
              <li>{SITE_CONFIG.region}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border-light/50 pt-8 text-center">
          <p className="text-text-muted text-xs" suppressHydrationWarning>
            &copy; {currentYear} {SITE_CONFIG.businessName}. All rights reserved.
          </p>
          <p className="mt-2 text-text-muted/70 text-xs">사업자등록번호: {SITE_CONFIG.businessNumber}</p>
        </div>
      </div>
    </footer>
  );
}
