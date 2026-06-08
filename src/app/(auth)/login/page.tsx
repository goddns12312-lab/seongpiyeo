'use client';

import { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { loginUser, getSession } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ⭐ useEffect: 페이지 로드 시 localStorage 세션이 있으면 쿠키도 설정
  useEffect(() => {
    const session = getSession();
    if (session) {
      console.log('[로그인] ✓ localStorage에 세션이 이미 있습니다. 쿠키 설정...');
      const maxAge = 7 * 24 * 60 * 60; // 7일
      const cookieValue = encodeURIComponent(JSON.stringify(session));

      const isProduction = typeof window !== 'undefined' &&
                           window.location.hostname !== 'localhost' &&
                           !window.location.hostname.startsWith('127.');
      const secureFlag = isProduction ? '; Secure' : '';
      const cookieString = `pc_bang_session=${cookieValue}; max-age=${maxAge}; path=/; SameSite=Lax${secureFlag}`;

      document.cookie = cookieString;
      console.log('[로그인] ✓ 쿠키 설정 완료:', { cookieLength: cookieValue.length, isProduction });
    }
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[Login] 로그인 시작:', { username });
      const result = await loginUser(username, password);

      console.log('[Login] 로그인 결과:', result);

      if (!result.success) {
        console.error('[Login] 로그인 실패:', result.error);
        setError(result.error || '로그인 중 오류가 발생했습니다');
        return;
      }

      console.log('[Login] 로그인 성공, 쿠키 설정 중...');

      // ⭐ 1단계: saveSession() 호출로 이미 세션이 저장됨 (auth.ts 참조)
      // ⭐ 2단계: 추가 확인차 명시적으로 다시 쿠키 설정
      if (result.session) {
        const maxAge = 7 * 24 * 60 * 60; // 7일
        const cookieValue = encodeURIComponent(JSON.stringify(result.session));

        const isProduction = typeof window !== 'undefined' &&
                             window.location.hostname !== 'localhost' &&
                             !window.location.hostname.startsWith('127.');
        const secureFlag = isProduction ? '; Secure' : '';
        const cookieString = `pc_bang_session=${cookieValue}; max-age=${maxAge}; path=/; SameSite=Lax${secureFlag}`;

        document.cookie = cookieString;
        console.log('[Login] ✓ pc_bang_session 쿠키 설정 완료:', {
          userId: result.session.id,
          username: result.session.username,
          cookieLength: cookieValue.length,
          isProduction,
        });

        // 확인: 쿠키가 실제로 설정되었는지 즉시 확인
        const checkCookie = document.cookie;
        console.log('[Login] 🔍 설정된 쿠키 확인:', checkCookie.substring(0, 150) + '...');
      }

      // ⭐ 3단계: 충분한 시간(1초) 후 페이지 새로고침
      // (쿠키가 확실히 설정될 시간 제공)
      setTimeout(() => {
        console.log('[Login] 페이지 새로고침...');
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      console.error('[Login] 예기치 않은 오류:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError('로그인 중 오류가 발생했습니다: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-bg-secondary border border-border-light rounded-lg p-8">
          <h1 className="text-3xl font-bold text-center text-text-primary mb-2">로그인</h1>
          <p className="text-text-secondary text-center text-sm mb-8">PC방거래 계정으로 로그인하세요</p>

          {error && (
            <div className="bg-red-900/20 border border-red-900 text-red-200 px-4 py-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요"
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
                required
              />
            </div>

            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
                required
              />
            </div>

            <Button variant="primary" size="lg" isLoading={loading} className="w-full">
              로그인
            </Button>
          </form>

          <p className="text-center text-text-secondary text-sm mt-6">
            계정이 없으신가요?{' '}
            <Link href="/register" className="text-gold hover:text-opacity-80">
              회원가입하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
