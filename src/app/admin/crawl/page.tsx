'use client';

import { useEffect, useRef, useState } from 'react';

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

interface CrawlerState {
  [region: string]: {
    latestIdx: number | null;
    latestTitle: string | null;
    lastCrawledAt: string | null;
    totalCount: number;
    newCount?: number;
    savedCount?: number;
    duplicateCount?: number;
    excludedCount?: number;
    lastStatus?: string;
  };
}

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

export default function AdminCrawlPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [allRegions, setAllRegions] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [crawlerState, setCrawlerState] = useState<CrawlerState>({});
  const [finalStats, setFinalStats] = useState<FinalStats | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // 크롤러 상태 로드
  const loadCrawlerState = async () => {
    try {
      const response = await fetch('/api/admin/crawler-state');
      if (response.ok) {
        const state = await response.json();
        setCrawlerState(state);
      }
    } catch (error) {
      console.error('크롤러 상태 로드 실패:', error);
    }
  };

  useEffect(() => {
    loadCrawlerState();
  }, []);

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
        ? '모든 지역 신규글만 크롤링 시작...'
        : `${selectedRegion} 신규글만 크롤링 시작...`,
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

        // 마지막 불완전한 라인은 다음 반복에서 처리
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const logEntry: LogEntry = JSON.parse(line);
              setLogs((prev) => [...prev, logEntry]);

              // 완료 메시지 처리 (모든 지역 완료)
              if (logEntry.type === 'complete' && !logEntry.region) {
                // 최종 통계는 마지막 로그에서만 처리
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
      // 크롤링 완료 후 상태 다시 로드
      await loadCrawlerState();
    }
  };

  const currentRegionState = selectedRegion && crawlerState[selectedRegion];

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">신규글 크롤링</h1>
          <p className="text-gray-400">지역을 선택하고 신규 매물을 크롤링합니다</p>
        </div>

        {/* 제어 패널 */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-6 mb-6">
          {/* 모드 표시 */}
          <div className="mb-6">
            <div className="inline-block bg-[#c9a227] text-black px-3 py-1 rounded text-sm font-semibold">
              신규글만 수집 모드 (--new-only)
            </div>
          </div>

          {/* 지역 선택 */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-semibold mb-3">지역 선택</label>

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
              <label htmlFor="allRegions" className="text-gray-300 cursor-pointer">
                전체 지역 선택
              </label>
            </div>

            {/* 지역 드롭다운 */}
            {!allRegions && (
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                disabled={isRunning}
                className="w-full bg-[#1f1f1f] border border-[#2a2a2a] text-white px-4 py-2 rounded focus:outline-none focus:border-[#c9a227]"
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

          {/* 현재 상태 정보 */}
          {!allRegions && currentRegionState && (
            <div className="mb-6 bg-[#0a0a0a] p-4 rounded border border-[#1f1f1f]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">최신 idx</p>
                  <p className="text-white font-semibold">
                    {currentRegionState.latestIdx ? currentRegionState.latestIdx.toLocaleString() : '미설정'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">누적 크롤링</p>
                  <p className="text-white font-semibold">{currentRegionState.totalCount}개</p>
                </div>
                {currentRegionState.lastCrawledAt && (
                  <div className="col-span-2">
                    <p className="text-gray-400">마지막 크롤링</p>
                    <p className="text-white text-xs">
                      {new Date(currentRegionState.lastCrawledAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 크롤링 버튼 */}
          {allRegions ? (
            <button
              onClick={handleStartCrawl}
              disabled={isRunning}
              className={`w-full py-3 px-4 rounded font-semibold transition ${
                isRunning
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-[#c9a227] text-black hover:bg-yellow-500'
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
                  : 'bg-[#c9a227] text-black hover:bg-yellow-500'
              }`}
            >
              {isRunning ? '동기화 중...' : '신규글 동기화'}
            </button>
          )}
        </div>

        {/* 최종 통계 */}
        {finalStats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
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
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg overflow-hidden">
          <div className="bg-[#1f1f1f] px-4 py-3 border-b border-[#2a2a2a]">
            <p className="text-gray-300 text-sm font-semibold">실시간 로그</p>
          </div>
          <div className="h-96 overflow-y-auto bg-[#0a0a0a] p-4 font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <p className="text-gray-500">크롤링을 시작하면 로그가 표시됩니다</p>
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
                          ? 'text-[#c9a227]'
                          : 'text-gray-300'
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
    </div>
  );
}
