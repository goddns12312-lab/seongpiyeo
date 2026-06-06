'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth';

const REGIONS = [
  { name: '서울', boardCode: '40' },
  { name: '경기도', boardCode: '93' },
  { name: '강원도', boardCode: '92' },
  { name: '인천', boardCode: '91' },
  { name: '충청북도', boardCode: '90' },
  { name: '충청남도', boardCode: '89' },
  { name: '경상북도', boardCode: '88' },
  { name: '경상남도', boardCode: '87' },
  { name: '전라북도', boardCode: '86' },
  { name: '전라남도', boardCode: '85' },
  { name: '제주도', boardCode: '84' },
];

interface LogEntry {
  type: 'log' | 'error' | 'complete' | 'status';
  message?: string;
  region?: string;
  newCount?: number;
  savedCount?: number;
  duplicateCount?: number;
  timestamp: string;
}

interface FinalStats {
  newCount: number;
  savedCount: number;
  duplicateCount: number;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingCount: 0,
    activeListings: 0,
    totalUsers: 0,
    totalPosts: 0,
  });

  // 신규글 동기화 상태
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [allRegions, setAllRegions] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [finalStats, setFinalStats] = useState<FinalStats | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // 로그 자동 스크롤
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleStartCrawl = async () => {
    if (!selectedRegion && !allRegions) {
      alert('지역을 선택하거나 전체 지역을 선택해주세요.');
      return;
    }

    setIsRunning(true);
    setLogs([]);
    setFinalStats(null);

    const startLog: LogEntry = {
      type: 'status',
      message: allRegions
        ? '모든 지역 신규글만 동기화 시작...'
        : `${selectedRegion} 신규글만 동기화 시작...`,
      timestamp: new Date().toISOString(),
    };
    setLogs([startLog]);

    try {
      const response = await fetch('/api/admin/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: allRegions ? undefined : selectedRegion,
          allRegions,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('응답 스트림을 읽을 수 없습니다');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const logEntry: LogEntry = JSON.parse(line);
              setLogs((prev) => [...prev, logEntry]);

              if (logEntry.type === 'complete' && !logEntry.region) {
                if (logEntry.newCount !== undefined) {
                  setFinalStats({
                    newCount: logEntry.newCount,
                    savedCount: logEntry.savedCount || 0,
                    duplicateCount: logEntry.duplicateCount || 0,
                  });
                }
              }
            } catch (e) {
              // JSON 파싱 실패 시 무시
            }
          }
        }
      }
    } catch (error) {
      const errorLog: LogEntry = {
        type: 'error',
        message: `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp: new Date().toISOString(),
      };
      setLogs((prev) => [...prev, errorLog]);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const session = getSession();

      if (!session) {
        window.location.href = '/login';
        return;
      }

      const supabase = createClient();

      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.id)
        .single();

      if (profile?.role !== 'admin') {
        window.location.href = '/';
        return;
      }

      // Get stats
      const { count: pendingCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: activeListings } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        pendingCount: pendingCount || 0,
        activeListings: activeListings || 0,
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
      });

      setLoading(false);
    };

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="bg-bg-primary min-h-screen py-12 flex items-center justify-center">
        <p className="text-text-secondary">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text-primary mb-8">관리자 대시보드</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">승인 대기</p>
            <p className="text-3xl font-bold text-gold">{stats.pendingCount}</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">활성 매물</p>
            <p className="text-3xl font-bold text-gold">{stats.activeListings}</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">회원 수</p>
            <p className="text-3xl font-bold text-gold">{stats.totalUsers}</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
            <p className="text-text-secondary text-sm mb-2">게시글</p>
            <p className="text-3xl font-bold text-gold">{stats.totalPosts}</p>
          </div>
        </div>

        {/* 신규글 동기화 */}
        <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-12">
          <h2 className="text-xl font-semibold text-text-primary mb-6">신규글 동기화</h2>

          {/* 모드 배지 */}
          <div className="mb-6">
            <div className="inline-block bg-gold text-black px-3 py-1 rounded text-sm font-semibold">
              신규글만 수집 모드
            </div>
          </div>

          {/* 지역 선택 */}
          <div className="mb-6">
            <label className="block text-text-secondary text-sm font-semibold mb-3">지역 선택</label>

            {/* 전체 지역 체크박스 */}
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="allRegions"
                checked={allRegions}
                onChange={(e) => {
                  setAllRegions(e.target.checked);
                  if (e.target.checked) {
                    setSelectedRegion('');
                  }
                }}
                disabled={isRunning}
                className="w-4 h-4 mr-2 cursor-pointer"
              />
              <label htmlFor="allRegions" className="text-text-secondary cursor-pointer">
                전체 지역 선택
              </label>
            </div>

            {/* 지역 드롭다운 */}
            {!allRegions && (
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                disabled={isRunning}
                className="w-full bg-bg-primary border border-border-light text-text-primary px-4 py-2 rounded focus:outline-none focus:border-gold"
              >
                <option value="">-- 지역 선택 --</option>
                {REGIONS.map((region) => (
                  <option key={region.name} value={region.name}>
                    {region.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 동기화 버튼 */}
          {allRegions ? (
            <button
              onClick={handleStartCrawl}
              disabled={isRunning}
              className={`w-full py-3 px-4 rounded font-semibold transition ${
                isRunning
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gold text-black hover:bg-yellow-500'
              }`}
            >
              {isRunning ? '전체 지역 동기화 중...' : '전체 지역 신규글 동기화'}
            </button>
          ) : (
            <button
              onClick={handleStartCrawl}
              disabled={isRunning || !selectedRegion}
              className={`w-full py-3 px-4 rounded font-semibold transition ${
                isRunning || !selectedRegion
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gold text-black hover:bg-yellow-500'
              }`}
            >
              {isRunning ? '동기화 중...' : '신규글 동기화'}
            </button>
          )}

          {/* 최종 통계 */}
          {finalStats && (
            <div className="grid grid-cols-3 gap-4 mt-6 mb-6">
              <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
                <p className="text-blue-200 text-sm font-semibold">신규 발견</p>
                <p className="text-white text-3xl font-bold">{finalStats.newCount}</p>
                <p className="text-blue-300 text-xs mt-1">개</p>
              </div>
              <div className="bg-green-900 border border-green-700 rounded-lg p-4">
                <p className="text-green-200 text-sm font-semibold">신규 저장</p>
                <p className="text-white text-3xl font-bold">{finalStats.savedCount}</p>
                <p className="text-green-300 text-xs mt-1">개</p>
              </div>
              <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
                <p className="text-yellow-200 text-sm font-semibold">기존 중복</p>
                <p className="text-white text-3xl font-bold">{finalStats.duplicateCount}</p>
                <p className="text-yellow-300 text-xs mt-1">개</p>
              </div>
            </div>
          )}

          {/* 로그 출력 */}
          <div className="bg-bg-primary border border-border-light rounded-lg overflow-hidden">
            <div className="bg-border-light px-4 py-3 border-b border-border-light">
              <p className="text-text-secondary text-sm font-semibold">실시간 로그</p>
            </div>
            <div className="h-96 overflow-y-auto bg-bg-primary p-4 font-mono text-xs space-y-1">
              {logs.length === 0 ? (
                <p className="text-text-secondary">동기화를 시작하면 로그가 표시됩니다</p>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`${
                      log.type === 'error'
                        ? 'text-red-400'
                        : log.type === 'complete'
                          ? 'text-green-400'
                          : log.type === 'status'
                            ? 'text-gold'
                            : 'text-text-secondary'
                    }`}
                  >
                    {log.message}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/listings">
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-text-primary font-semibold mb-2">매물 관리</h3>
              <p className="text-text-secondary text-sm">매물 승인, 수정, 삭제</p>
            </div>
          </Link>

          <Link href="/admin/posts">
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-text-primary font-semibold mb-2">게시글 관리</h3>
              <p className="text-text-secondary text-sm">부적절한 게시글 삭제</p>
            </div>
          </Link>

          <Link href="/admin/users">
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m4 5H9m6-9h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-text-primary font-semibold mb-2">회원 관리</h3>
              <p className="text-text-secondary text-sm">사용자 정보 조회</p>
            </div>
          </Link>

          <Link href="/admin/banners">
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-text-primary font-semibold mb-2">배너 관리</h3>
              <p className="text-text-secondary text-sm">광고 배너 추가/수정</p>
            </div>
          </Link>

          <Link href="/admin/scraper">
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-text-primary font-semibold mb-2">외부 사이트 크롤링</h3>
              <p className="text-text-secondary text-sm">PC천국에서 매물 가져오기</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
