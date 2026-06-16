'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface Props {
  postId: string;
  initialData: {
    id: string;
    title: string;
    content: string;
    category: string;
  };
}

export default function CommunityEditClient({ postId, initialData }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData.title);
  const [content, setContent] = useState(initialData.content);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    if (!title.trim() || !content.trim()) {
      setError('제목과 내용은 필수입니다');
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/posts/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ postId, title: title.trim(), content: content.trim() }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || '수정 실패');
        setIsSaving(false);
        return;
      }

      router.push(`/community/${postId}`);
    } catch {
      setError('수정 중 오류가 발생했습니다');
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-bg-secondary border border-border-light rounded-lg p-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-text-primary font-semibold mb-2">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="게시글 제목을 입력하세요"
            className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-gold outline-none transition"
          />
        </div>

        <div>
          <label className="block text-text-primary font-semibold mb-2">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="게시글 내용을 입력하세요"
            className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-gold outline-none transition"
            rows={10}
          />
          <p className="text-xs text-text-secondary mt-2">## 제목, - 목록 마크다운 문법을 사용할 수 있습니다</p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 bg-gold hover:bg-gold-light disabled:bg-gold/50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded transition"
          >
            {isSaving ? '저장 중...' : '수정 완료'}
          </button>
          <Link href={`/community/${postId}`} className="flex-1">
            <Button variant="secondary" className="w-full" disabled={isSaving}>
              취소
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
