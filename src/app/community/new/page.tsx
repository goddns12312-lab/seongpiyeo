'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function NewPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const content = formData.get('content') as string;

    // 유효성 검사
    if (!title || !category || !content) {
      setError('제목, 카테고리, 내용은 필수입니다');
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('로그인이 필요합니다');
        setIsSubmitting(false);
        return;
      }

      const postData = {
        title,
        category: 'free',
        content,
        status: 'active',
      };

      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '게시글 작성에 실패했습니다');
      } else if (result.success && result.postId) {
        // 성공 후 상세 페이지로 이동
        router.push(`/community/${result.postId}`);
      } else {
        setError('게시글 작성에 실패했습니다');
      }
    } catch (err) {
      setError('게시글 작성 중 오류가 발생했습니다');
      console.error('Post creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <Link href="/community" className="inline-flex items-center text-gold hover:text-gold-light mb-6">
          ← 목록으로
        </Link>

        {/* Form */}
        <div className="bg-bg-secondary border border-border-light rounded-lg p-8">
          <h1 className="text-3xl font-bold text-text-primary mb-8">게시글 작성</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-text-primary font-semibold mb-2">제목</label>
              <input
                type="text"
                name="title"
                placeholder="게시글 제목을 입력하세요"
                className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-gold outline-none transition"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-text-primary font-semibold mb-2">카테고리</label>
              <select name="category" className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary focus:border-gold outline-none transition">
                <option value="">카테고리를 선택하세요</option>
                <option value="info">💡 정보공유</option>
                <option value="qa">❓ 질문답변</option>
                <option value="event">🎉 이벤트</option>
                <option value="review">🤝 거래후기</option>
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="block text-text-primary font-semibold mb-2">내용</label>
              <textarea
                name="content"
                placeholder="게시글 내용을 입력하세요"
                className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-gold outline-none transition"
                rows={10}
              />
              <p className="text-xs text-text-secondary mt-2">## 제목, - 목록 마크다운 문법을 사용할 수 있습니다</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gold hover:bg-gold-light disabled:bg-gold/50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded transition"
              >
                {isSubmitting ? '작성 중...' : '작성 완료'}
              </button>
              <Link href="/community" className="flex-1">
                <Button variant="secondary" className="w-full" disabled={isSubmitting}>취소</Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
