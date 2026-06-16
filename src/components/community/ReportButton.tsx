'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type ReportType = 'post' | 'listing';

const API_PATH: Record<ReportType, string> = {
  post: '/api/posts/report',
  listing: '/api/listings/report',
};

const ID_KEY: Record<ReportType, string> = {
  post: 'postId',
  listing: 'listingId',
};

const LABEL: Record<ReportType, string> = {
  post: '게시글',
  listing: '매물',
};

export function ReportButton({
  targetId,
  type = 'post',
}: {
  targetId: string;
  type?: ReportType;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(API_PATH[type], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [ID_KEY[type]]: targetId, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || '신고 실패');
        return;
      }
      setMessage('신고가 접수되었습니다.');
      setReason('');
      setTimeout(() => setOpen(false), 1500);
    } catch {
      setMessage('신고 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border-light text-text-secondary hover:border-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        aria-label={`${LABEL[type]} 신고`}
      >
        🚩 신고하기
      </button>
    );
  }

  return (
    <div className="p-4 bg-bg-secondary border border-red-500/30 rounded-lg">
      <p className="text-sm text-text-primary font-semibold mb-2">{LABEL[type]} 신고</p>
      <p className="text-xs text-text-muted mb-3">스팸·욕설·허위정보 등 신고 사유를 적어주세요.</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="신고 사유를 입력해주세요"
        rows={3}
        className="w-full px-3 py-2 bg-bg-primary border border-border-light text-text-primary rounded text-sm mb-2 focus:border-gold outline-none"
      />
      {message && <p className="text-xs text-gold mb-2">{message}</p>}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" isLoading={loading} onClick={handleSubmit}>
          신고 접수
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
          취소
        </Button>
      </div>
    </div>
  );
}
