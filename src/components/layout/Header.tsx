'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSession, logout, AuthSession } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SITE_CONFIG } from '@/lib/site';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 세션 새로고침 함수
  const refreshSession = () => {
    const session = getSession();
    setUser(session);
  };

  useEffect(() => {
    // 초기 세션 로드
    refreshSession();

    // 스토리지 변경 감지 (다른 탭에서 로그인/로그아웃할 때)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pc_bang_session') {
        refreshSession();
      }
    };

    // 주기적으로 세션 확인 (1초마다) - 같은 탭에서의 변경도 감지
    const interval = setInterval(() => {
      refreshSession();
    }, 1000);

    window.addEventListener('storage', handleStorageChange);
    setTimeout(() => setLoading(false), 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // pathname 변경 시에도 세션 새로고침 (페이지 이동 감지)
  useEffect(() => {
    refreshSession();
  }, [pathname]);

  const handleLogout = () => {
    console.log('[Header] 로그아웃 시작');
    logout();
    setUser(null);
    setIsMenuOpen(false);
    // 페이지 전체 새로고침으로 로그아웃 상태 즉시 반영
    window.location.href = '/';
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <header className="bg-gradient-to-r from-bg-secondary via-bg-secondary to-bg-tertiary border-b border-border-light/50 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 lg:px-8 py-2">
        <div className="flex justify-between items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity h-[60px] overflow-hidden" title={`${SITE_CONFIG.businessName} - 성인PC 매물 거래 플랫폼`}>
            <Image
              src="/423432.png"
              alt={SITE_CONFIG.businessName}
              width={100}
              height={100}
              className="object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-4 lg:gap-8 flex-1">
            <Link
              href="/listings"
              className={`relative text-xs sm:text-sm lg:text-base font-semibold whitespace-nowrap transition-all duration-300 group ${isActive('/listings') ? 'text-gold-light' : 'text-text-secondary hover:text-gold'}`}
            >
              성인PC 팝니다
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-gold to-gold-light group-hover:w-full transition-all duration-300 ${isActive('/listings') ? 'w-full' : ''}`}></span>
            </Link>
            <Link
              href="/jobs"
              className={`relative text-xs sm:text-sm lg:text-base font-semibold whitespace-nowrap transition-all duration-300 group ${isActive('/jobs') ? 'text-gold-light' : 'text-text-secondary hover:text-gold'}`}
            >
              구인구직
              <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gold to-gold-light group-hover:w-full transition-all duration-300 ${isActive('/jobs') ? 'w-full' : 'w-0'}`}></span>
            </Link>
            <Link
              href="/guide"
              className={`hidden lg:inline relative text-xs sm:text-sm lg:text-base font-semibold whitespace-nowrap transition-all duration-300 group ${isActive('/guide') ? 'text-gold-light' : 'text-text-secondary hover:text-gold'}`}
            >
              가이드
              <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gold to-gold-light group-hover:w-full transition-all duration-300 ${isActive('/guide') ? 'w-full' : 'w-0'}`}></span>
            </Link>
            <Link
              href="/faq"
              className={`hidden lg:inline relative text-xs sm:text-sm lg:text-base font-semibold whitespace-nowrap transition-all duration-300 group ${isActive('/faq') ? 'text-gold-light' : 'text-text-secondary hover:text-gold'}`}
            >
              FAQ
              <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gold to-gold-light group-hover:w-full transition-all duration-300 ${isActive('/faq') ? 'w-full' : 'w-0'}`}></span>
            </Link>
            <Link
              href="/secondhand"
              className={`hidden lg:inline relative text-xs sm:text-sm lg:text-base font-semibold whitespace-nowrap transition-all duration-300 group ${isActive('/secondhand') ? 'text-gold-light' : 'text-text-secondary hover:text-gold'}`}
            >
              중고장터
              <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gold to-gold-light group-hover:w-full transition-all duration-300 ${isActive('/secondhand') ? 'w-full' : 'w-0'}`}></span>
            </Link>
            <Link
              href="/notice"
              className={`hidden lg:inline relative text-xs sm:text-sm lg:text-base font-semibold whitespace-nowrap transition-all duration-300 group ${isActive('/notice') ? 'text-gold-light' : 'text-text-secondary hover:text-gold'}`}
            >
              공지사항
              <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gold to-gold-light group-hover:w-full transition-all duration-300 ${isActive('/notice') ? 'w-full' : 'w-0'}`}></span>
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex gap-1 lg:gap-2 items-center">
            <ThemeToggle />
            {!loading ? (
              <>
                {user ? (
                  <>
                    <Link href="/mypage">
                      <Button variant="secondary" size="xs" className="lg:px-4 whitespace-nowrap">
                        마이페이지
                      </Button>
                    </Link>
                    <Button variant="secondary" size="xs" className="lg:px-4 whitespace-nowrap" onClick={handleLogout}>
                      로그아웃
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="secondary" size="xs" className="lg:px-4 whitespace-nowrap">
                        로그인
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="primary" size="xs" className="lg:px-4 whitespace-nowrap">
                        회원가입
                      </Button>
                    </Link>
                  </>
                )}
              </>
            ) : (
              <div className="w-20 h-8 bg-bg-tertiary rounded animate-pulse" />
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gold"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="메뉴 토글"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden mt-6 pb-6 border-t border-border-light pt-6 flex flex-col gap-4" id="mobile-menu" role="navigation" aria-label="모바일 네비게이션">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border-light/50">
              <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">테마</span>
              <ThemeToggle />
            </div>
            <Link href="/listings" className="text-text-primary hover:text-gold font-semibold transition-colors">
              성인PC 팝니다
            </Link>
            <Link href="/jobs" className="text-text-primary hover:text-gold font-semibold transition-colors">
              구인구직
            </Link>
            <Link href="/secondhand" className="text-text-primary hover:text-gold font-semibold transition-colors">
              중고장터
            </Link>
            <Link href="/notice" className="text-text-primary hover:text-gold font-semibold transition-colors">
              공지사항
            </Link>
            <Link href="/support" className="text-text-primary hover:text-gold font-semibold transition-colors">
              고객센터
            </Link>
            <div className="pt-4 border-t border-border-light/50 flex flex-col gap-3">
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link href="/mypage" className="w-full">
                        <Button variant="secondary" size="sm" className="w-full">
                          마이페이지
                        </Button>
                      </Link>
                      <Button variant="secondary" size="sm" className="w-full" onClick={handleLogout}>
                        로그아웃
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="w-full">
                        <Button variant="secondary" size="sm" className="w-full">
                          로그인
                        </Button>
                      </Link>
                      <Link href="/register" className="w-full">
                        <Button variant="primary" size="sm" className="w-full">
                          회원가입
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
