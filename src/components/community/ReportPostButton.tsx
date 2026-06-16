'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function ReportPostButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/posts/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ postId, reason: reason.trim() }),
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
        className="text-xs text-text-muted hover:text-red-400 transition-colors"
      >
        신고
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 bg-bg-secondary border border-border-light rounded-lg">
      <p className="text-sm text-text-primary font-medium mb-2">게시글 신고</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="신고 사유를 입력해주세요"
        rows={3}
        className="w-full px-3 py-2 bg-bg-primary border border-border-light text-text-primary rounded text-sm mb-2"
      />
      {message && <p className="text-xs text-gold mb-2">{message}</p>}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" isLoading={loading} onClick={handleSubmit}>
          신고하기
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
          취소
        </Button>
      </div>
    </div>
  );
}
