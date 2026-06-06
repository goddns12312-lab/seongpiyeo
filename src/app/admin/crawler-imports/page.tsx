'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth';

interface CrawlerImport {
  id: string;
  title: string;
  region: string;
  location: string;
  contact: string;
  price_deposit: number | null;
  price_monthly: number | null;
  business_type: string | null;
  size: string | null;
  floor: string | null;
  facilities: string | null;
  available_date: string | null;
  permit_status: string | null;
  violation_history: string | null;
  description: string | null;
  main_image_url: string | null;
  import_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  source_idx: string;
  images?: CrawlerImportImage[];
}

interface CrawlerImportImage {
  id: string;
  image_url: string;
  order_num: number;
  is_primary: boolean;
}

export default function AdminCrawlerImportsPage() {
  const [loading, setLoading] = useState(true);
  const [imports, setImports] = useState<CrawlerImport[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedImport, setSelectedImport] = useState<CrawlerImport | null>(null);
  const [processing, setProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);

  const loadImports = async () => {
    console.log('[Page] loadImports 강제 호출');
    try {
      console.log('[Page] fetch 시작');
      const response = await fetch(`/api/admin/crawler-imports/list?status=all`);
      console.log('[Page] fetch 응답 상태:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Page] API에서 받은 데이터 개수:', data?.length || 0);
        console.log('[Page] API 응답 샘플:', data?.slice(0, 2));
        setImports(data);
      } else {
        const error = await response.json();
        console.error('[Page] 목록 로드 실패 (not ok):', response.status, error);
      }
    } catch (error) {
      console.error('[Page] 목록 로드 실패 (catch):', error);
    }
  };

  const checkAdmin = async () => {
    console.log('[Page] checkAdmin 시작');
    const session = getSession();
    if (!session) {
      console.log('[Page] 세션 없음, 로그인 페이지로 이동');
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
      console.log('[Page] 관리자가 아님, 홈으로 이동');
      window.location.href = '/';
      return;
    }

    console.log('[Page] 관리자 확인 완료, loading=false 설정');
    setLoading(false);
  };

  useEffect(() => {
    console.log('[Page] useEffect 실행');
    checkAdmin();
    // 임시: 즉시 loadImports 호출 (checkAdmin과 병렬 실행)
    loadImports();
  }, []);

  const handleApprove = async (importId: string) => {
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/crawler-imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importId,
          action: 'approve',
        }),
      });

      if (response.ok) {
        alert('승인되었습니다!');
        setSelectedImport(null);
        loadImports();
      } else {
        const error = await response.json();
        alert(`오류: ${error.error}`);
      }
    } catch (error) {
      alert(`승인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (importId: string) => {
    if (!confirm('정말 거절하시겠습니까?')) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/admin/crawler-imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importId,
          action: 'reject',
        }),
      });

      if (response.ok) {
        alert('거절되었습니다.');
        setSelectedImport(null);
        loadImports();
      } else {
        const error = await response.json();
        alert(`오류: ${error.error}`);
      }
    } catch (error) {
      alert(`거절 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setProcessing(false);
    }
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">수집 매물 관리</h1>
          <p className="text-text-secondary">크롤러가 수집한 신규 매물을 승인하거나 거절합니다</p>
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-4 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => {
            let count = 0;
            if (tab === 'all') {
              count = imports.length;
            } else if (tab === 'pending') {
              count = imports.filter(i => i.import_status === null || i.import_status === 'pending').length;
            } else {
              count = imports.filter(i => i.import_status === tab).length;
            }

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded font-semibold transition ${
                  filter === tab
                    ? 'bg-gold text-black'
                    : 'bg-bg-secondary border border-border-light text-text-primary hover:border-gold'
                }`}
              >
                {tab === 'all' && '전체'}
                {tab === 'pending' && '심사 대기'}
                {tab === 'approved' && '승인됨'}
                {tab === 'rejected' && '거절됨'}
                {' '}
                <span className="text-xs">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 목록 */}
          <div className="lg:col-span-2 bg-bg-secondary border border-border-light rounded-lg overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              {(() => {
                const filteredImports = filter === 'all'
                  ? imports
                  : filter === 'pending'
                  ? imports.filter(i => i.import_status === null || i.import_status === 'pending')
                  : imports.filter(i => i.import_status === filter);

                console.log('[Page] 전체 imports 개수:', imports.length);
                console.log('[Page] filter:', filter);
                console.log('[Page] 필터링된 imports 개수:', filteredImports.length);
                console.log('[Page] imports 샘플:', imports.slice(0, 3));

                return filteredImports.length === 0 ? (
                  <div className="p-6 text-center text-text-secondary">
                    {filter === 'pending' ? '심사 대기 중인 매물이 없습니다' : '해당하는 매물이 없습니다'}
                  </div>
                ) : (
                  filteredImports.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedImport(item)}
                      className={`w-full text-left p-4 border-b border-border-light hover:bg-bg-primary transition ${
                        selectedImport?.id === item.id ? 'bg-bg-primary border-l-2 border-l-gold' : ''
                      }`}
                    >
                    <div className="flex gap-4">
                      {/* 썸네일 */}
                      {item.main_image_url && (
                        <div className="w-16 h-16 bg-bg-primary rounded overflow-hidden flex-shrink-0">
                          <img
                            src={item.main_image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="text-text-primary font-semibold truncate">{item.title}</h3>
                        <p className="text-text-secondary text-sm">{item.region} · {item.location}</p>
                        <div className="flex gap-2 mt-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              item.import_status === null || item.import_status === 'pending'
                                ? 'bg-yellow-900 text-yellow-200'
                                : item.import_status === 'approved'
                                  ? 'bg-green-900 text-green-200'
                                  : 'bg-red-900 text-red-200'
                            }`}
                          >
                            {item.import_status === null || item.import_status === 'pending'
                              ? '대기 중'
                              : item.import_status === 'approved'
                                ? '승인됨'
                                : '거절됨'}
                          </span>
                          {item.price_monthly && (
                            <span className="text-xs text-gold font-semibold">
                              ₩{item.price_monthly.toLocaleString()}/월
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    </button>
                  ))
                );
              })()}
            </div>
          </div>

          {/* 상세 보기 */}
          {selectedImport && (
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 lg:col-span-1 max-h-[600px] overflow-y-auto">
              <h2 className="text-xl font-bold text-text-primary mb-4">매물 상세</h2>

              {/* 이미지 갤러리 */}
              {selectedImport.images && selectedImport.images.length > 0 && (
                <div className="mb-6">
                  <div className="bg-bg-primary rounded-lg overflow-hidden mb-3 aspect-square">
                    <img
                      src={selectedImport.images[0]?.image_url || selectedImport.main_image_url || ''}
                      alt={selectedImport.title}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  </div>
                  {selectedImport.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedImport.images.map((img) => (
                        <div
                          key={img.id}
                          className="w-12 h-12 bg-bg-primary rounded cursor-pointer flex-shrink-0 overflow-hidden border border-border-light"
                        >
                          <img
                            src={img.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 정보 */}
              <div className="space-y-3 text-sm mb-6">
                <div>
                  <p className="text-text-secondary">제목</p>
                  <p className="text-text-primary font-semibold">{selectedImport.title}</p>
                </div>

                <div>
                  <p className="text-text-secondary">위치</p>
                  <p className="text-text-primary">{selectedImport.region} · {selectedImport.location}</p>
                </div>

                <div>
                  <p className="text-text-secondary">연락처</p>
                  <p className="text-text-primary">{selectedImport.contact || '-'}</p>
                </div>

                {selectedImport.price_deposit && (
                  <div>
                    <p className="text-text-secondary">보증금</p>
                    <p className="text-gold font-semibold">₩{selectedImport.price_deposit.toLocaleString()}</p>
                  </div>
                )}

                {selectedImport.price_monthly && (
                  <div>
                    <p className="text-text-secondary">월세</p>
                    <p className="text-gold font-semibold">₩{selectedImport.price_monthly.toLocaleString()}</p>
                  </div>
                )}

                {selectedImport.size && (
                  <div>
                    <p className="text-text-secondary">면적</p>
                    <p className="text-text-primary">{selectedImport.size}</p>
                  </div>
                )}

                {selectedImport.floor && (
                  <div>
                    <p className="text-text-secondary">층</p>
                    <p className="text-text-primary">{selectedImport.floor}</p>
                  </div>
                )}

                {selectedImport.business_type && (
                  <div>
                    <p className="text-text-secondary">업종</p>
                    <p className="text-text-primary">{selectedImport.business_type}</p>
                  </div>
                )}

                {selectedImport.permit_status && (
                  <div>
                    <p className="text-text-secondary">허가</p>
                    <p className="text-text-primary">{selectedImport.permit_status}</p>
                  </div>
                )}

                {selectedImport.description && (
                  <div>
                    <p className="text-text-secondary">설명</p>
                    <p className="text-text-primary text-xs line-clamp-3">{selectedImport.description}</p>
                  </div>
                )}
              </div>

              {/* 상태 배지 */}
              <div className="mb-6 p-3 bg-bg-primary rounded">
                <p className="text-text-secondary text-xs mb-2">현재 상태</p>
                <span
                  className={`inline-block text-xs px-3 py-1 rounded font-semibold ${
                    selectedImport.import_status === null || selectedImport.import_status === 'pending'
                      ? 'bg-yellow-900 text-yellow-200'
                      : selectedImport.import_status === 'approved'
                        ? 'bg-green-900 text-green-200'
                        : 'bg-red-900 text-red-200'
                  }`}
                >
                  {selectedImport.import_status === null || selectedImport.import_status === 'pending'
                    ? '심사 대기 중'
                    : selectedImport.import_status === 'approved'
                      ? '승인됨'
                      : '거절됨'}
                </span>
              </div>

              {/* 버튼 */}
              {(selectedImport.import_status === null || selectedImport.import_status === 'pending') && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleApprove(selectedImport.id)}
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold transition disabled:opacity-50"
                  >
                    {processing ? '처리 중...' : '승인'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedImport.id)}
                    disabled={processing}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-semibold transition disabled:opacity-50"
                  >
                    {processing ? '처리 중...' : '거절'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
