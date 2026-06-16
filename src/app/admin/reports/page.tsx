'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ensureAdminClient } from '@/lib/admin-client';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';

type ReportRow = {
  id: string;
  targetType: 'post' | 'listing';
  targetId: string;
  reason: string;
  status: string;
  created_at: string;
  post: { id: string; title: string; category: string; status: string } | null;
  listing: { id: string; title: string; status: string } | null;
};

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    const res = await fetch('/api/admin/reports?status=pending', { credentials: 'include' });
    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { ok } = await ensureAdminClient({ router });
      if (!ok) {
        setLoading(false);
        return;
      }
      await fetchReports();
    })();
  }, [router, fetchReports]);

  const handleReview = async (report: ReportRow, hideTarget: boolean) => {
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        reportId: report.id,
        targetType: report.targetType,
        status: 'reviewed',
        hidePost: report.targetType === 'post' && hideTarget,
        hideListing: report.targetType === 'listing' && hideTarget,
      }),
    });
    fetchReports();
  };

  const handleDismiss = async (report: ReportRow) => {
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        reportId: report.id,
        targetType: report.targetType,
        status: 'dismissed',
        hidePost: false,
        hideListing: false,
      }),
    });
    fetchReports();
  };

  const getReportLink = (report: ReportRow) => {
    if (report.targetType === 'listing') {
      return `/listings/${report.targetId}`;
    }
    if (report.post?.category === 'exchange') {
      return `/exchange-info/${report.targetId}`;
    }
    return `/community/${report.targetId}`;
  };

  const getReportTitle = (report: ReportRow) => {
    if (report.targetType === 'listing') {
      return report.listing?.title || report.targetId;
    }
    return report.post?.title || report.targetId;
  };

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/admin" className="text-gold text-sm mb-4 inline-block">
          ← 관리자 홈
        </Link>
        <h1 className="text-3xl font-bold text-text-primary mb-8">신고 관리</h1>

        {reports.length === 0 ? (
          <p className="text-text-secondary">대기 중인 신고가 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div key={`${r.targetType}-${r.id}`} className="bg-bg-secondary border border-border-light rounded-lg p-5">
                <div className="flex justify-between gap-4 mb-2">
                  <div className="min-w-0">
                    <span className="text-xs text-text-muted mr-2">
                      {r.targetType === 'listing' ? '매물' : '게시글'}
                    </span>
                    <Link
                      href={getReportLink(r)}
                      target="_blank"
                      className="font-semibold text-text-primary hover:text-gold"
                    >
                      {getReportTitle(r)}
                    </Link>
                  </div>
                  <span className="text-xs text-text-muted shrink-0">{formatDateTime(r.created_at)}</span>
                </div>
                <p className="text-sm text-text-secondary mb-4">{r.reason}</p>
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" onClick={() => handleReview(r, true)}>
                    숨김 처리
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleReview(r, false)}>
                    확인만
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDismiss(r)}>
                    기각
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
