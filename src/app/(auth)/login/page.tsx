'use client';

import { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { loginUser } from '@/lib/auth-credentials';
import { getSession } from '@/lib/auth-session';
import { Button } from '@/components/ui/Button';

function setSessionCookie(session: object) {
  const maxAge = 7 * 24 * 60 * 60;
  const cookieValue = encodeURIComponent(JSON.stringify(session));
  const isProduction =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    !window.location.hostname.startsWith('127.');
  const secureFlag = isProduction ? '; Secure' : '';
  document.cookie = `pc_bang_session=${cookieValue}; max-age=${maxAge}; path=/; SameSite=Lax${secureFlag}`;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setSessionCookie(session);
    }
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginUser(username, password);

      if (!result.success) {
        setError(result.error || '로그인 중 오류가 발생했습니다');
        return;
      }

      if (result.session) {
        setSessionCookie(result.session);
      }

      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError('로그인 중 오류가 발생했습니다: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gold/10 via-transparent to-transparent rounded-3xl blur-2xl" />
        <div className="auth-card">
          <h1 className="text-3xl font-bold text-center text-text-primary mb-2">로그인</h1>
          <p className="text-text-muted text-center text-sm mb-8">PC방거래 계정으로 로그인하세요</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요"
                className="input-field"
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
                className="input-field"
                required
              />
            </div>

            <Button variant="primary" size="lg" isLoading={loading} className="w-full">
              로그인
            </Button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            계정이 없으신가요?{' '}
            <Link href="/register" className="text-gold hover:text-gold-light font-medium">
              회원가입하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
