'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { REGIONS } from '@/types';

interface ScraperLog {
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details: any;
}

export default function ScraperPage() {
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(8);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [logs, setLogs] = useState<ScraperLog[]>([]);

  useEffect(() => {
    const checkAdmin = async () => {
      const session = getSession();

      if (!session) {
        window.location.href = '/login';
        return;
      }

      const supabase = createClient();

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.id)
        .single();

      if (profile?.role !== 'admin') {
        window.location.href = '/';
        return;
      }

      setLoading(false);
    };

    checkAdmin();
  }, []);

  const handleScrape = async () => {
    if (startPage > endPage) {
      addLog('error', '시작 페이지가 끝 페이지보다 클 수 없습니다');
      return;
    }

    const regionsToScrape = selectedRegions.length === 0 ? REGIONS : selectedRegions;

    setScraping(true);
    addLog('pending', `PC천국 [${regionsToScrape.join(', ')}] 페이지 ${startPage}-${endPage} 크롤링 시작...`);

    try {
      const response = await fetch('/api/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startPage,
          endPage,
          regions: regionsToScrape
        }),
      });

      const data = await response.json();

      if (data.success) {
        addLog('success', data.message, data);
      } else {
        addLog('error', `크롤링 실패: ${data.error}`, data);
      }
    } catch (error) {
      addLog('error', `요청 실패: ${String(error)}`, error);
    } finally {
      setScraping(false);
    }
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev =>
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const addLog = (status: 'success' | 'error' | 'pending', message: string, details: any = {}) => {
    const log: ScraperLog = {
      timestamp: new Date().toLocaleTimeString('ko-KR'),
      status,
      message,
      details,
    };
    setLogs(prev => [log, ...prev]);
  };

  if (loading) {
    return (
      <div className="bg-bg-primary min-h-screen py-12 flex items-center justify-center">
        <p className="text-text-secondary">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text-primary mb-8">외부 사이트 크롤링</h1>

        {/* Controls */}
        <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-6">PC천국 매물 가져오기</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-text-secondary text-sm mb-3">지역 선택 (비워두면 전국)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {REGIONS.map(region => (
                  <button
                    key={region}
                    onClick={() => toggleRegion(region)}
                    disabled={scraping}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      selectedRegions.includes(region)
                        ? 'bg-gold text-black'
                        : 'bg-bg-primary border border-border-light text-text-secondary hover:border-gold'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
              {selectedRegions.length > 0 && (
                <p className="text-xs text-gold mt-2">
                  선택됨: {selectedRegions.join(', ')}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-text-secondary text-sm mb-2">시작 페이지</label>
                <input
                  type="number"
                  value={startPage}
                  onChange={e => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={scraping}
                  className="w-full bg-bg-primary border border-border-light rounded-lg px-4 py-2 text-text-primary disabled:opacity-50"
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">끝 페이지</label>
                <input
                  type="number"
                  value={endPage}
                  onChange={e => setEndPage(Math.max(startPage, parseInt(e.target.value) || 1))}
                  disabled={scraping}
                  className="w-full bg-bg-primary border border-border-light rounded-lg px-4 py-2 text-text-primary disabled:opacity-50"
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="bg-bg-tertiary border border-border-light/50 rounded-lg p-4">
              <p className="text-text-secondary text-sm">
                <span className="text-gold font-semibold">주의:</span> 크롤링은 각 페이지마다 1초 딜레이가 있으며, 중복된 매물은 자동으로 제외됩니다.
              </p>
            </div>

            <Button
              onClick={handleScrape}
              disabled={scraping}
              className="w-full"
            >
              {scraping ? '크롤링 중... 잠시만 기다려주세요' : '크롤링 시작'}
            </Button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">실행 로그</h2>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-text-secondary text-sm">로그가 없습니다</p>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`border-l-4 pl-4 py-2 ${
                    log.status === 'success'
                      ? 'border-green-500 bg-green-500/5'
                      : log.status === 'error'
                      ? 'border-red-500 bg-red-500/5'
                      : 'border-gold bg-gold/5'
                  }`}
                >
                  <p className="text-xs text-text-secondary">{log.timestamp}</p>
                  <p className={`text-sm ${
                    log.status === 'success'
                      ? 'text-green-400'
                      : log.status === 'error'
                      ? 'text-red-400'
                      : 'text-gold'
                  }`}>
                    {log.message}
                  </p>
                  {Object.keys(log.details).length > 0 && (
                    <pre className="text-xs text-text-secondary mt-1 bg-bg-primary p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
