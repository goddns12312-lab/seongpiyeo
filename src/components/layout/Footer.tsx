import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-bg-secondary to-bg-tertiary border-t border-border-light/50 mt-12 py-10">
      <div className="max-w-full mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent mb-3" title="성피요 - 성인PC 매물 거래 플랫폼">
              {SITE_CONFIG.name}
            </h3>
            <p className="text-text-secondary text-xs font-light leading-relaxed">
              {SITE_CONFIG.description}
            </p>
          </div>

          <div>
            <h4 className="text-text-primary font-semibold mb-3 text-xs uppercase tracking-widest">서비스</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/listings" className="text-text-secondary hover:text-gold transition-colors font-light">
                  매물 목록
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-text-secondary hover:text-gold transition-colors font-light">
                  커뮤니티
                </Link>
              </li>
              <li>
                <Link href="/listings/new" className="text-text-secondary hover:text-gold transition-colors font-light">
                  매물 등록
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-text-primary font-semibold mb-3 text-xs uppercase tracking-widest">정보</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="mailto:contact@example.com" className="text-text-secondary hover:text-gold transition-colors font-light">
                  문의
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary hover:text-gold transition-colors font-light">
                  이용약관
                </a>
              </li>
              <li>
                <a href="#" className="text-text-secondary hover:text-gold transition-colors font-light">
                  개인정보
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-text-primary font-semibold mb-3 text-xs uppercase tracking-widest">연락처</h4>
            <ul className="space-y-2 text-xs">
              <li className="text-text-secondary font-light">
                담당자: {SITE_CONFIG.managerName}
              </li>
              <li className="text-text-secondary font-light">
                {SITE_CONFIG.phone}
              </li>
              <li className="text-text-secondary font-light">
                {SITE_CONFIG.region}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border-light/50 pt-6 text-center text-text-muted text-xs font-light">
          <p>&copy; {currentYear} {SITE_CONFIG.businessName}. All rights reserved.</p>
          <p className="mt-2 text-text-muted/70">사업자등록번호: {SITE_CONFIG.businessNumber}</p>
        </div>
      </div>
    </footer>
  );
}
