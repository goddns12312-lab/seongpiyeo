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
          <nav className="hidden md:flex gap-2 lg:gap-4 flex-1 items-center">
            {/* Main Menu - Button Style */}
            <div className="flex gap-2 lg:gap-3">
              <Link
                href="/listings"
                className={`cursor-pointer px-3 py-1.5 rounded-lg border-2 transition-all duration-300 font-semibold text-xs sm:text-sm whitespace-nowrap ${isActive('/listings') ? 'border-gold bg-gold/10 text-gold-light' : 'border-gold text-gold hover:bg-gold/10'}`}
              >
                성인PC 팝니다
              </Link>
              <Link
                href="/jobs"
                className={`cursor-pointer px-3 py-1.5 rounded-lg border-2 transition-all duration-300 font-semibold text-xs sm:text-sm whitespace-nowrap ${isActive('/jobs') ? 'border-gold bg-gold/10 text-gold-light' : 'border-gold text-gold hover:bg-gold/10'}`}
              >
                구인구직
              </Link>
            </div>

            {/* Additional Menu */}
            <div className="hidden lg:flex gap-3 pl-4 border-l border-border-light/50">
              <Link
                href="/guide"
                className={`cursor-pointer relative text-sm font-medium whitespace-nowrap transition-all duration-300 group px-2 py-1 rounded hover:bg-bg-tertiary/50 ${isActive('/guide') ? 'text-gold-light' : 'text-text-secondary hover:text-gold'}`}
              >
                가이드
                <span className={`absolute bottom-0 left-2 h-0.5 bg-gradient-to-r from-gold to-gold-light group-hover:w-[calc(100%-1rem)] transition-all duration-300 ${isActive('/guide') ? 'w-[calc(100%-1rem)]' : 'w-0'}`}></span>
              </Link>
              <Link
                href="/faq"
                className={`cursor-pointer relative text-sm font-medium whitespace-nowrap transition-all duration-300 group px-2 py-1 rounded hover:bg-bg-tertiary/50 ${isActive('/faq') ? 'text-gold-light' : 'text-text-secondary hover:text-gold'}`}
              >
                FAQ
                <span className={`absolute bottom-0 left-2 h-0.5 bg-gradient-to-r from-gold to-gold-light group-hover:w-[calc(100%-1rem)] transition-all duration-300 ${isActive('/faq') ? 'w-[calc(100%-1rem)]' : 'w-0'}`}></span>
              </Link>
              <Link
                href="/secondhand"
                className={`cursor-pointer relative text-sm font-medium whitespace-nowrap transition-all duration-300 group px-2 py-1 rounded hover:bg-bg-tertiary/50 ${isActive('/secondhand') ? 'text-gold-light' : 'text-text-secondary hover:text-gold'}`}
              >
                중고장터
                <span className={`absolute bottom-0 left-2 h-0.5 bg-gradient-to-r from-gold to-gold-light group-hover:w-[calc(100%-1rem)] transition-all duration-300 ${isActive('/secondhand') ? 'w-[calc(100%-1rem)]' : 'w-0'}`}></span>
              </Link>
              <Link
                href="/notice"
                className={`cursor-pointer relative text-sm font-medium whitespace-nowrap transition-all duration-300 group px-2 py-1 rounded hover:bg-bg-tertiary/50 ${isActive('/notice') ? 'text-gold-light' : 'text-text-secondary hover:text-gold'}`}
              >
                공지사항
                <span className={`absolute bottom-0 left-2 h-0.5 bg-gradient-to-r from-gold to-gold-light group-hover:w-[calc(100%-1rem)] transition-all duration-300 ${isActive('/notice') ? 'w-[calc(100%-1rem)]' : 'w-0'}`}></span>
              </Link>
            </div>

            {/* Community Menu */}
            <div className="hidden lg:flex gap-3 pl-4 border-l border-border-light/50 bg-bg-tertiary/50 rounded-lg px-3 py-1">
              <Link
                href="/community"
                className={`cursor-pointer relative text-sm font-semibold whitespace-nowrap transition-all duration-300 group px-2 py-1 rounded hover:bg-gold/10 ${isActive('/community') ? 'text-gold-light' : 'text-text-secondary hover:text-gold'}`}
              >
                자유게시판
                <span className={`absolute bottom-0 left-2 h-0.5 bg-gradient-to-r from-gold to-gold-light group-hover:w-[calc(100%-1rem)] transition-all duration-300 ${isActive('/community') ? 'w-[calc(100%-1rem)]' : 'w-0'}`}></span>
              </Link>
              <Link
                href="/exchange-info"
                className={`cursor-pointer relative text-sm font-semibold whitespace-nowrap transition-all duration-300 group px-2 py-1 rounded hover:bg-gold/10 ${isActive('/exchange-info') ? 'text-gold-light' : 'text-text-secondary hover:text-gold'}`}
              >
                환수 및 정보
                <span className={`absolute bottom-0 left-2 h-0.5 bg-gradient-to-r from-gold to-gold-light group-hover:w-[calc(100%-1rem)] transition-all duration-300 ${isActive('/exchange-info') ? 'w-[calc(100%-1rem)]' : 'w-0'}`}></span>
              </Link>
              <a
                href="https://t.me/pc365_112"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer relative text-sm font-semibold whitespace-nowrap transition-all duration-300 group px-2 py-1 rounded hover:bg-red-500/10 text-red-500 hover:text-red-400"
                title="블랙진상조회"
              >
                블랙진상조회
                <span className="absolute bottom-0 left-2 h-0.5 bg-gradient-to-r from-red-500 to-red-400 group-hover:w-[calc(100%-1rem)] transition-all duration-300 w-0"></span>
              </a>
            </div>
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
          <nav className="md:hidden mt-6 pb-6 border-t border-border-light pt-6 flex flex-col gap-5" id="mobile-menu" role="navigation" aria-label="모바일 네비게이션">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between mb-2 pb-4 border-b border-border-light/50">
              <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider">테마</span>
              <ThemeToggle />
            </div>

            {/* Main Menu */}
            <div className="flex flex-col gap-2">
              <span className="text-gold text-xs font-bold uppercase tracking-wider">주요메뉴</span>
              <Link href="/listings" className="cursor-pointer px-3 py-2 rounded border-2 border-gold text-gold hover:bg-gold/10 font-semibold transition-all">
                성인PC 팝니다
              </Link>
              <Link href="/jobs" className="cursor-pointer px-3 py-2 rounded border-2 border-gold text-gold hover:bg-gold/10 font-semibold transition-all">
                구인구직
              </Link>
            </div>

            {/* Additional Menu */}
            <div className="flex flex-col gap-3">
              <span className="text-gold text-xs font-bold uppercase tracking-wider">정보</span>
              <Link href="/secondhand" className="cursor-pointer px-3 py-2 text-text-primary hover:text-gold hover:bg-bg-tertiary/50 font-semibold transition-all rounded">
                중고장터
              </Link>
              <Link href="/notice" className="cursor-pointer px-3 py-2 text-text-primary hover:text-gold hover:bg-bg-tertiary/50 font-semibold transition-all rounded">
                공지사항
              </Link>
            </div>

            {/* Community Menu */}
            <div className="flex flex-col gap-2 bg-bg-tertiary/50 rounded-lg p-4 border border-border-light/30">
              <span className="text-gold text-xs font-bold uppercase tracking-wider">커뮤니티</span>
              <Link href="/community" className="cursor-pointer px-3 py-2 text-text-primary hover:text-gold hover:bg-gold/10 font-semibold transition-all rounded">
                자유게시판
              </Link>
              <Link href="/exchange-info" className="cursor-pointer px-3 py-2 text-text-primary hover:text-gold hover:bg-gold/10 font-semibold transition-all rounded">
                환수 및 정보
              </Link>
              <a
                href="https://t.me/pc365_112"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer px-3 py-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 font-semibold transition-all rounded"
              >
                🚨 블랙진상조회
              </a>
            </div>
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
