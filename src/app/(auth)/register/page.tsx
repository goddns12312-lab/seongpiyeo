'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { registerUser, checkUsernameAvailability } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');

  const checkUsername = async (value: string) => {
    setUsername(value);

    if (!value.trim()) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    setUsernameStatus('checking');
    const result = await checkUsernameAvailability(value);

    if (result.available) {
      setUsernameStatus('available');
      setUsernameMessage(result.message);
    } else {
      setUsernameStatus('unavailable');
      setUsernameMessage(result.message);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // 중복 체크 상태 확인
    if (usernameStatus !== 'available') {
      setError('사용 가능한 아이디를 선택해주세요');
      return;
    }

    // 비밀번호 검증
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    // 닉네임 검증
    if (nickname.length < 2) {
      setError('닉네임은 2자 이상이어야 합니다');
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser(username, password, nickname, phone);

      if (!result.success) {
        setError(result.error || '회원가입 중 오류가 발생했습니다');
        return;
      }

      window.location.href = '/';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError('회원가입 중 오류가 발생했습니다: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gold/10 via-transparent to-transparent rounded-3xl blur-2xl" />
        <div className="auth-card">
          <h1 className="text-3xl font-bold text-center text-text-primary mb-2">회원가입</h1>
          <p className="text-text-muted text-center text-sm mb-8">새로운 계정을 만들어보세요</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">
                아이디 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => checkUsername(e.target.value)}
                placeholder="영문/숫자 4~20자"
                className={`input-field ${
                  usernameStatus === 'unavailable'
                    ? '!border-red-500'
                    : usernameStatus === 'available'
                      ? '!border-emerald-500'
                      : ''
                }`}
                required
              />
              {usernameStatus === 'checking' && (
                <p className="text-yellow-400 text-xs mt-1">확인 중...</p>
              )}
              {usernameStatus === 'unavailable' && (
                <p className="text-red-400 text-xs mt-1">✗ {usernameMessage}</p>
              )}
              {usernameStatus === 'available' && (
                <p className="text-green-400 text-xs mt-1">✓ {usernameMessage}</p>
              )}
            </div>

            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">
                닉네임 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="사용할 닉네임"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">휴대폰</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="input-field"
              />
              <p className="text-text-secondary text-xs mt-1">선택 입력</p>
            </div>

            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">
                비밀번호 <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
              <p className="text-text-secondary text-xs mt-1">최소 6자 이상</p>
            </div>

            <Button variant="primary" size="lg" isLoading={loading} className="w-full">
              회원가입
            </Button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-gold hover:text-gold-light font-medium">
              로그인하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
